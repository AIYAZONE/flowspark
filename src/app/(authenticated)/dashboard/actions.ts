'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { setRecommendationCompletion } from '@/lib/ai/recommendationStore';
import { awardXP } from '@/lib/gamification-actions';
import { rollCompletionReward } from '@/lib/rewards';
import type { RewardResult } from '@/lib/rewards';
import { upsertBehaviorSnapshot } from '@/lib/snapshots';
import {
  getNextRecurringRange,
  isActionRecurrenceRule,
  parseActionRecurrenceDescription,
} from '@/lib/actionRecurrence';

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
  if (action && nextCompleted) {
    // Award XP only on completion
    const source = action.type === 'core' ? 'core_action' : 'maintenance_action';
    await awardXP(action.user_id, source, id);

    reward = rollCompletionReward({ actionType: action.type })
    if (reward.bonusXP > 0) {
      await awardXP(action.user_id, 'bonus', id, reward.bonusXP)
    }

    const recurrenceMeta = parseActionRecurrenceDescription(action.description)
    if (isActionRecurrenceRule(recurrenceMeta.recurrence)) {
      const nextRange = getNextRecurringRange({
        startDate: action.start_date,
        endDate: action.end_date || action.start_date,
        recurrence: recurrenceMeta.recurrence,
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
  revalidatePath('/today');

  return { ok: true, completed: nextCompleted, reward }
}

export async function toggleAction(formData: FormData): Promise<void> {
  await toggleActionInternal(formData)
}

export async function toggleActionWithReward(formData: FormData): Promise<{ ok: boolean; completed: boolean; reward: RewardResult | null }> {
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
	await upsertBehaviorSnapshot({
		supabase,
		userId: user.id,
		snapshotDate: date
	});
}
