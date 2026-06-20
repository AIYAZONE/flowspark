import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { AddActionDialog } from '@/components/AddActionDialog'
import { AITodayPlanButton } from '@/components/AITodayPlanButton'
import { getDateBucketInTZ, getUserTimezone, getTodayInTZ, shiftDateBucket, toLocaleDateStringTZ } from '@/lib/time'
import { TodayActionList } from '@/components/TodayActionList'
import { StreakFeedbackBanner } from '@/components/StreakFeedbackBanner'
import { isEnvEnabled } from '@/lib/experiments'
import { getStreakSnapshot } from '@/lib/streaks'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { ensureUpcomingRecurringActions } from '@/app/(authenticated)/dashboard/recurring'
import { ExperimentExposureTracker } from '@/components/ExperimentExposureTracker'
import { getExperimentDecision } from '@/lib/featureFlags'
import { TrackedEventLink } from '@/components/TrackedEventLink'
import { RescueEntryTracker } from '@/components/RescueEntryTracker'
import { TomorrowHandoffCard } from '@/components/TomorrowHandoffCard'
import {
  pickTargetActionId,
  pickYesterdayHandoffCandidate,
  type TomorrowHandoffCandidateInput,
} from '@/lib/tomorrow-handoff'
import {
  resolveInitialOpenAction,
  resolveInitialPanelMode,
} from '@/lib/today-action-open-state'

type RecommendationOutcomeRow = {
  id: string
  recommendation_id: string
  action_id: string | null
  updated_at: string
}

type HandoffActionRow = {
  id: string
  title: string
  goal_id: string | null
  ai_recommendation_id: string | null
  type: string | null
}

export default async function TodayPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const dict = await getDictionary()
  const searchParams = await props.searchParams
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const ownerId = user.id
  const todayPlanEnabledEnv =
    process.env.NEXT_PUBLIC_AI_TODAY_PLAN_ENABLED ?? process.env.AI_TODAY_PLAN_ENABLED
  const todayPlanEnabled = todayPlanEnabledEnv ? isEnvEnabled(todayPlanEnabledEnv) : true
  const ab1TodayPlanDecision = await getExperimentDecision({
    supabase,
    userId: user.id,
    experimentKey: 'ab1_today_plan',
    envEnabled: process.env.AI_EXPERIMENT_AB1_TODAY_PLAN,
    defaultEnabled: false,
  })
  const ab1TodayPlanEnabled = ab1TodayPlanDecision.enabled
  const ab1TodayPlanVariant = ab1TodayPlanDecision.variant
  const showAIPlan = todayPlanEnabled && (!ab1TodayPlanEnabled || ab1TodayPlanVariant === 'B')

  // Get active goals for the dropdown with mixed-schema ownership fallback.
  const { data: activeGoals } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('goals')
      .select('id, title, priority, start_date, end_date, success_criteria, stop_criteria')
      .eq(ownershipColumn, ownerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
  })

  const tz = await getUserTimezone(supabase, user.id)
  // Get today's actions by timezone
  const today = getTodayInTZ(tz)
  await ensureUpcomingRecurringActions({ supabase, userId: ownerId, today })
  const yesterday = shiftDateBucket(today, -1)

  const datePredicate = [
    `and(start_date.lte.${today},end_date.gte.${today})`,
    `and(end_date.lt.${today},completed.eq.false)`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
    `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
  ].join(',')

  const { data: rawActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('actions')
      .select(`
        *,
        action_sub_items (
          id,
          title,
          completed,
          sort_order
        ),
        goals (
          id,
          title,
          status
        )
      `)
      .eq(ownershipColumn, ownerId)
      .or(datePredicate)
      .order('completed', { ascending: true })
      .order('priority', { ascending: false })
  })

  // Filter actions in JS to accurately handle timezone "today"
  const actions = rawActions?.filter(action => {
    if (action.goals?.status === 'archived') return false;
    // If it's a regular active action or incomplete delayed action, keep it
    const isRegular = action.start_date <= today && (action.end_date || action.start_date) >= today;
    const isDelayedIncomplete = !action.completed && (action.end_date || action.start_date) < today;

    if (isRegular || isDelayedIncomplete) return true;

    // For completed delayed actions, strictly check if updated_at is "today" in user's timezone
    if (action.completed && action.updated_at) {
      const updatedDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(action.updated_at));
      return updatedDate === today;
    }

    return false;
  });

  const handoffRecentCutoffIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: recentCompletedOutcomes } = await supabase
    .from('ai_recommendation_outcomes')
    .select('id, recommendation_id, action_id, updated_at')
    .eq('user_id', ownerId)
    .eq('completed', true)
    .gte('updated_at', handoffRecentCutoffIso)
    .order('updated_at', { ascending: false })
    .limit(20)

  const yesterdayOutcomeRows = ((recentCompletedOutcomes || []) as RecommendationOutcomeRow[])
    .filter((outcome) => (
      Boolean(outcome.recommendation_id) &&
      Boolean(outcome.updated_at) &&
      getDateBucketInTZ(outcome.updated_at, tz) === yesterday
    ))

  const outcomeActionIds = [...new Set(
    yesterdayOutcomeRows
      .map((outcome) => outcome.action_id)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  )]
  const fallbackRecommendationIds = [...new Set(
    yesterdayOutcomeRows
      .filter((outcome) => !outcome.action_id)
      .map((outcome) => outcome.recommendation_id)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  )]

  const { data: handoffActionsById } = outcomeActionIds.length > 0
    ? await queryWithOwnershipFallback({
      execute: (ownershipColumn) => supabase
        .from('actions')
        .select('id, title, goal_id, ai_recommendation_id, type')
        .eq(ownershipColumn, ownerId)
        .eq('type', 'core')
        .in('id', outcomeActionIds)
    })
    : { data: [] as HandoffActionRow[] }

  const { data: handoffActionsByRecommendation } = fallbackRecommendationIds.length > 0
    ? await queryWithOwnershipFallback({
      execute: (ownershipColumn) => supabase
        .from('actions')
        .select('id, title, goal_id, ai_recommendation_id, type')
        .eq(ownershipColumn, ownerId)
        .eq('type', 'core')
        .in('ai_recommendation_id', fallbackRecommendationIds)
        .order('id', { ascending: true })
    })
    : { data: [] as HandoffActionRow[] }

  const handoffActionById = new Map(
    ((handoffActionsById || []) as HandoffActionRow[]).map((action) => [action.id, action])
  )
  const handoffActionByRecommendationId = new Map<string, HandoffActionRow>()
  for (const action of (handoffActionsByRecommendation || []) as HandoffActionRow[]) {
    if (!action.ai_recommendation_id || handoffActionByRecommendationId.has(action.ai_recommendation_id)) continue
    handoffActionByRecommendationId.set(action.ai_recommendation_id, action)
  }

  const yesterdayCandidates: TomorrowHandoffCandidateInput[] = yesterdayOutcomeRows.flatMap((outcome) => {
    const matchedAction = outcome.action_id
      ? handoffActionById.get(outcome.action_id) ?? null
      : handoffActionByRecommendationId.get(outcome.recommendation_id) ?? null

    if (!matchedAction || !matchedAction.title) return []
    return [{
      outcomeId: outcome.id,
      recommendationId: outcome.recommendation_id,
      actionId: matchedAction.id,
      title: matchedAction.title,
      goalId: matchedAction.goal_id ?? null,
      completedAt: outcome.updated_at,
    }]
  })
  const tomorrowHandoffCandidate = pickYesterdayHandoffCandidate(yesterdayCandidates)
  const hasCompletedCoreToday = (actions || []).some((action) => action.completed && action.type === 'core')
  const tomorrowHandoffTargetActionId = pickTargetActionId({
    actions: (actions || []).map((action) => ({
      id: action.id as string,
      goal_id: (action.goal_id as string | null | undefined) ?? null,
      priority: (action.priority as string | null | undefined) ?? null,
      start_date: (action.start_date as string | null | undefined) ?? null,
      end_date: (action.end_date as string | null | undefined) ?? null,
      completed: Boolean(action.completed),
      type: (action.type as string | null | undefined) ?? null,
    })),
    goalId: tomorrowHandoffCandidate?.goalId ?? null,
  })

  const aiActionContext = (actions || []).map(action => ({
    id: action.id as string,
    title: action.title as string,
    description: (action.description as string | null | undefined) ?? null,
    goal_id: (action.goal_id as string | null | undefined) ?? null,
    goal_title: (action.goals?.title as string | null | undefined) ?? null,
    type: (action.type as string | null | undefined) ?? null,
    priority: (action.priority as string | null | undefined) ?? null,
    completed: Boolean(action.completed),
    start_date: (action.start_date as string | null | undefined) ?? null,
    end_date: (action.end_date as string | null | undefined) ?? null,
  }))
  const streakSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone: tz,
    today,
  })
  const hasCompletedToday = streakSnapshot.completedDates.includes(today)
  const showStreakRiskBanner = !hasCompletedToday && (streakSnapshot.currentStreak > 0 || Boolean(streakSnapshot.recoverableMissDate))
  const rescueAction = (actions || []).find(action => !action.completed && action.type === 'core') || null
  const actionIdParam = Array.isArray(searchParams?.action) ? searchParams?.action[0] : searchParams?.action
  const rescueActionIdParam = Array.isArray(searchParams?.rescue) ? searchParams?.rescue[0] : searchParams?.rescue
  const initialOpenActionId = resolveInitialOpenAction({
    actionIdParam: typeof actionIdParam === 'string' ? actionIdParam : null,
    rescueParam: typeof rescueActionIdParam === 'string' ? rescueActionIdParam : null,
  })
  const initialPanelMode = resolveInitialPanelMode({
    actionIdParam: typeof actionIdParam === 'string' ? actionIdParam : null,
    rescueParam: typeof rescueActionIdParam === 'string' ? rescueActionIdParam : null,
  })
  const streakBannerTitle = streakSnapshot.recoverableMissDate
    ? (dict.common.locale.startsWith('zh') ? '先恢复昨天，再完成今天' : 'Recover yesterday, then finish today')
    : (dict.common.locale.startsWith('zh') ? '先做 5 分钟版本，保住连续性' : 'Start with a 5-minute version to protect your streak')
  const streakBannerBody = streakSnapshot.recoverableMissDate
    ? (
      streakSnapshot.shieldBalance > 0
        ? (dict.common.locale.startsWith('zh')
          ? `昨天漏掉了 1 天，你还有 ${streakSnapshot.shieldBalance} 个护盾可补回；处理完后再推进今天。`
          : `Yesterday is recoverable. You still have ${streakSnapshot.shieldBalance} shield(s); recover it first, then move today forward.`)
        : (dict.common.locale.startsWith('zh')
          ? '昨天已经断掉，但现在没有护盾；先完成今天的 5 分钟最小行动，重新起步。'
          : 'Yesterday was missed and no shield is available. Restart with a 5-minute minimum action today.'))
    : (dict.common.locale.startsWith('zh')
      ? `你当前已经连续 ${streakSnapshot.currentStreak} 天，今天优先完成一个最小行动即可继续保持。`
      : `You are on a ${streakSnapshot.currentStreak}-day streak. Finish one minimum action today to keep it going.`)
  const rescueHref = rescueAction ? `/today?rescue=${rescueAction.id}#today-actions` : '#today-actions'
  const rescueCtaLabel = dict.common.locale.startsWith('zh')
    ? (rescueAction ? '打开 5 分钟救援' : '去做最小行动')
    : (rescueAction ? 'Open 5-min rescue' : 'Do a minimum action')

  return (
    <div className="space-y-6">
      <ExperimentExposureTracker
        source="today"
        ab1TodayPlanVariant={ab1TodayPlanVariant}
        showAIPlan={showAIPlan}
        showAIReview={false}
        showStreakRiskBanner={showStreakRiskBanner}
        dateBucket={today}
      />
      {initialOpenActionId && initialPanelMode === 'rescue' ? (
        <RescueEntryTracker
          actionId={initialOpenActionId}
          source="today"
          entry="streak_banner"
        />
      ) : null}
      <StreakFeedbackBanner dict={dict} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {toLocaleDateStringTZ(dict.common.locale, tz, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="hidden md:block">
          <AddActionDialog activeGoals={activeGoals || []} dict={dict} />
        </div>
      </div>

      {tomorrowHandoffCandidate && !hasCompletedCoreToday && (tomorrowHandoffTargetActionId || showAIPlan) ? (
        <TomorrowHandoffCard
          dict={dict}
          userId={user.id}
          todayDateBucket={today}
          candidate={tomorrowHandoffCandidate}
          targetActionId={tomorrowHandoffTargetActionId}
          canFallbackToTodayPlan={showAIPlan}
        />
      ) : null}

      <div className="grid gap-6">
        {showStreakRiskBanner ? (
          <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-4 dark:border-orange-500/20 dark:bg-orange-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium">{streakBannerTitle}</div>
                <div className="mt-1 text-sm text-muted-foreground">{streakBannerBody}</div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {streakSnapshot.recoverableMissDate ? (
                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs font-medium hover:bg-background"
                  >
                    {dict.common.locale.startsWith('zh') ? '去恢复' : 'Go recover'}
                  </a>
                ) : null}
                <TrackedEventLink
                  href={rescueHref}
                  eventName="ai_rescue_click"
                  payload={{
                    source: 'today',
                    scene: 'rescue',
                    entry: 'streak_banner',
                    target_action_id: rescueAction?.id || null,
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {rescueCtaLabel}
                </TrackedEventLink>
              </div>
            </div>
          </div>
        ) : null}
        {showAIPlan ? (
          <div id="today-ai-plan" className="rounded-xl border border-dashed bg-card/60 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {dict.dashboard.planning.aiPlanTitle}
                </div>
                <div className="text-sm text-muted-foreground">
                  {dict.dashboard.planning.desc.replace('{count}', String(activeGoals?.length || 0))}
                </div>
              </div>
              <AITodayPlanButton
                dict={dict}
                goals={activeGoals || []}
                actions={aiActionContext}
                defaultDate={today}
                ab1TodayPlanVariant={ab1TodayPlanVariant}
                triggerClassName="w-full sm:w-auto"
              />
            </div>
          </div>
        ) : null}
        {/* Actions List with Filter */}
        <div id="today-actions">
          <TodayActionList
            actions={actions || []}
            dict={dict}
            showGoalTitle={true}
            tz={tz}
            today={today}
            goals={activeGoals || []}
            initialOpenActionId={initialOpenActionId}
            initialPanelMode={initialPanelMode}
          />
        </div>
      </div>
    </div>
  )
}
