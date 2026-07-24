'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { setRecommendationCompletion } from '@/lib/ai/recommendationStore';
import { awardXP } from '@/lib/gamification-actions';
import { rollCompletionReward } from '@/lib/rewards';
import type { RewardResult } from '@/lib/rewards';
import { upsertBehaviorSnapshot } from '@/lib/snapshots';
import { getUserTimezone } from '@/lib/time';
import { insertUserNotification } from '@/lib/notifications/commands';
import {
  getShieldGrantDecision,
  getStreakSnapshot,
  grantShieldIfEligible,
} from '@/lib/streaks';
import { getCelebrationMilestone, getPhaseKeyForStreak } from '@/lib/streak-milestones';
import {
  getNextRecurringRange,
  isActionRecurrenceRule,
  parseActionRecurrenceDescription,
} from '@/lib/actionRecurrence';

type ToggleActionResult = {
  ok: boolean
  completed: boolean
  reward: RewardResult | null
  streak: {
    currentStreak: number
    shieldBalance: number
    shieldGrantedRule: 'first_3_day' | 'refill_7_day' | null
    shieldGrantedAtStreak: number | null
    nextGrantAtStreak: number
    milestoneReached: { milestone: number; phaseKey: 'starter' | 'steady' | 'deepening' | 'resilient' | 'longrun' | 'identity' } | null
  } | null
  xpEarned: number | null
  xpBreakdown: { base: number; bonus: number } | null
}

async function insertActionSubItemsForRecurring(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  actionId: string
  items: Array<{ title: string; sort_order: number }>
}) {
  if (params.items.length === 0) return

  const payload = params.items.map((item) => ({
    action_id: params.actionId,
    title: item.title,
    completed: false,
    sort_order: item.sort_order,
    user_id: params.userId,
    owner_id: params.userId,
  }))

  const { error } = await params.supabase.from('action_sub_items').insert(payload)
  if (!error) return

  const columnMissing = error.code === '42703' || error.message?.includes('column')
  if (!columnMissing) throw error

  const { error: fallbackError } = await params.supabase.from('action_sub_items').insert(
    payload.map((item) => ({
      action_id: item.action_id,
      title: item.title,
      completed: item.completed,
      sort_order: item.sort_order,
      user_id: item.user_id,
    }))
  )
  if (!fallbackError) return

  const { error: ownerOnlyError } = await params.supabase.from('action_sub_items').insert(
    payload.map((item) => ({
      action_id: item.action_id,
      title: item.title,
      completed: item.completed,
      sort_order: item.sort_order,
      owner_id: item.owner_id,
    }))
  )
  if (ownerOnlyError) throw ownerOnlyError
}

async function toggleActionInternal(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const currentCompleted = formData.get('completed') === 'true';
  const nextCompleted = !currentCompleted;

  const { data: action } = await supabase
    .from('actions')
    .update({ 
      completed: nextCompleted,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, user_id, goal_id, title, type, priority, description, start_date, end_date, ai_recommendation_id')
    .single();

  let reward: RewardResult | null = null
  let streak: ToggleActionResult['streak'] = null
  let xpEarned: ToggleActionResult['xpEarned'] = null
  let xpBreakdown: ToggleActionResult['xpBreakdown'] = null
  if (action && nextCompleted) {
    // Award XP only on completion
    const source = action.type === 'core' ? 'core_action' : 'maintenance_action';
    const { data: existingXpLog } = await supabase
      .from('xp_logs')
      .select('id')
      .eq('user_id', action.user_id)
      .eq('action_id', id)
      .in('source', ['core_action', 'maintenance_action', 'bonus'])
      .limit(1)

    const alreadyAwarded = Array.isArray(existingXpLog) && existingXpLog.length > 0

    if (!alreadyAwarded) {
      const baseAward = await awardXP(action.user_id, source, id);

      reward = rollCompletionReward({ actionType: action.type })
      const baseEarned = baseAward?.success && typeof baseAward.earned === 'number' ? baseAward.earned : null
      let bonusEarned: number | null = 0
      if (reward.bonusXP > 0) {
        const bonusAward = await awardXP(action.user_id, 'bonus', id, reward.bonusXP)
        bonusEarned = bonusAward?.success && typeof bonusAward.earned === 'number' ? bonusAward.earned : null
      }

      if (typeof baseEarned === 'number' && typeof bonusEarned === 'number') {
        xpBreakdown = { base: baseEarned, bonus: bonusEarned }
        xpEarned = baseEarned + bonusEarned
      }
    }

    const recurrenceMeta = parseActionRecurrenceDescription(action.description)
    if (isActionRecurrenceRule(recurrenceMeta.recurrence)) {
      const nextRange = getNextRecurringRange({
        startDate: action.start_date,
        recurrence: recurrenceMeta.recurrence,
        ruleParams: recurrenceMeta.params,
      })

      let { data: existingNext } = await supabase
        .from('actions')
        .select('id')
        .eq('goal_id', action.goal_id)
        .eq('title', action.title)
        .eq('completed', false)
        .eq('start_date', nextRange.startDate)
        .eq('user_id', action.user_id)
        .maybeSingle()

      if (!existingNext) {
        const fallbackExisting = await supabase
          .from('actions')
          .select('id')
          .eq('goal_id', action.goal_id)
          .eq('title', action.title)
          .eq('completed', false)
          .eq('start_date', nextRange.startDate)
          .eq('owner_id', action.user_id)
          .maybeSingle()
        existingNext = fallbackExisting.data
      }

      if (!existingNext?.id) {
        const basePayload = {
          goal_id: action.goal_id,
          title: action.title,
          type: action.type,
          priority: action.priority || 'medium',
          description: action.description || '',
          start_date: nextRange.startDate,
          end_date: nextRange.endDate,
          completed: false,
          ai_recommendation_id: null,
        }

        let inserted = await supabase
          .from('actions')
          .insert({
            ...basePayload,
            user_id: action.user_id,
            owner_id: action.user_id,
          })
          .select('id')
          .single()

        if (inserted.error && (inserted.error.code === '42703' || inserted.error.message?.includes('column'))) {
          inserted = await supabase
            .from('actions')
            .insert({
              ...basePayload,
              user_id: action.user_id,
            })
            .select('id')
            .single()
          if (inserted.error) {
            inserted = await supabase
              .from('actions')
              .insert({
                ...basePayload,
                owner_id: action.user_id,
              })
              .select('id')
              .single()
          }
        }

        if (!inserted.error && inserted.data?.id) {
          let { data: subItems } = await supabase
            .from('action_sub_items')
            .select('title, sort_order')
            .eq('action_id', action.id)
            .eq('user_id', action.user_id)
            .order('sort_order', { ascending: true })

          if (!subItems || subItems.length === 0) {
            const fallbackSubItems = await supabase
              .from('action_sub_items')
              .select('title, sort_order')
              .eq('action_id', action.id)
              .eq('owner_id', action.user_id)
              .order('sort_order', { ascending: true })
            subItems = fallbackSubItems.data
          }

          await insertActionSubItemsForRecurring({
            supabase,
            userId: action.user_id,
            actionId: inserted.data.id as string,
            items: (subItems || []).map((item) => ({
              title: item.title as string,
              sort_order: Number(item.sort_order || 0),
            })),
          })
        }
      }
    }

    const timeZone = await getUserTimezone(supabase, action.user_id)
    const snapshot = await getStreakSnapshot({
      supabase,
      userId: action.user_id,
      timeZone,
    })
    const granted = await grantShieldIfEligible({
      supabase,
      userId: action.user_id,
      currentStreak: snapshot.currentStreak,
      shieldBalance: snapshot.shieldBalance,
      lastShieldGrantedForStreak: snapshot.lastShieldGrantedForStreak,
    })

    let milestoneReached: { milestone: number; phaseKey: 'starter' | 'steady' | 'deepening' | 'resilient' | 'longrun' | 'identity' } | null = null
    const milestone = getCelebrationMilestone(snapshot.currentStreak)
    if (milestone) {
      const phaseKey = getPhaseKeyForStreak(snapshot.currentStreak)
      const inserted = await insertUserNotification({
        supabase,
        userId: action.user_id,
        kind: 'milestone_reached',
        payload: { milestone, phaseKey },
      })
      if (inserted.inserted) {
        milestoneReached = { milestone, phaseKey }
      }
    }

    if (granted.shouldGrant && granted.grantedRule && typeof granted.grantedAtStreak === 'number') {
      await insertUserNotification({
        supabase,
        userId: action.user_id,
        kind: 'shield_granted',
        payload: {
          rule: granted.grantedRule,
          grantedAtStreak: granted.grantedAtStreak,
          shieldBalanceAfter: granted.nextBalance,
        },
      })
    }

    streak = {
      currentStreak: snapshot.currentStreak,
      shieldBalance: granted.shouldGrant ? granted.nextBalance : snapshot.shieldBalance,
      shieldGrantedRule: granted.grantedRule,
      shieldGrantedAtStreak: granted.grantedAtStreak,
      nextGrantAtStreak: granted.nextGrantAtStreak,
      milestoneReached,
    }
  }

  if (action?.ai_recommendation_id) {
    await setRecommendationCompletion({
      supabase,
      recommendationId: action.ai_recommendation_id,
      userId: action.user_id,
      completed: nextCompleted
    })
  }

  if (action?.user_id) {
    await upsertBehaviorSnapshot({
      supabase,
      userId: action.user_id,
      snapshotDate: new Date().toISOString().slice(0, 10)
    })
  }

  revalidatePath('/dashboard');
  revalidatePath('/system');
  revalidatePath('/today');
  revalidatePath('/notifications');

  return { ok: true, completed: nextCompleted, reward, streak, xpEarned, xpBreakdown }
}

export async function toggleAction(formData: FormData): Promise<void> {
  await toggleActionInternal(formData)
}

export async function toggleActionWithReward(formData: FormData): Promise<ToggleActionResult> {
  return toggleActionInternal(formData)
}

export async function submitScore(formData: FormData) {
	const supabase = await createClient();
	const rawScore = formData.get('score') as string;
	const rawDate = formData.get('date') as string;
	const score = Math.min(5, Math.max(0, Number.parseInt(rawScore, 10)));
	const date = (rawDate || '').slice(0, 10);

	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;
	if (!Number.isFinite(score)) return;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

	// Upsert score
	const { error } = await supabase.from('daily_scores').upsert(
		{
			owner_id: user.id,
			user_id: user.id,
			score_date: date,
			score: score
		},
		{ onConflict: 'owner_id, score_date' }
	);
	if (error) {
		if (
			error.message?.includes('Could not find') ||
			error.code === '42703' ||
			error.message?.includes('column') ||
			error.code === '42P10' ||
			/(unique|exclusion) constraint/i.test(error.message || '')
		) {
			await supabase.from('daily_scores').upsert(
				{
					user_id: user.id,
					score_date: date,
					score: score
				},
				{ onConflict: 'user_id, score_date' }
			);
		} else {
			throw new Error('operation_failed');
		}
	}

	revalidatePath('/dashboard');
	revalidatePath('/system');
	await upsertBehaviorSnapshot({
		supabase,
		userId: user.id,
		snapshotDate: date
	});
}
