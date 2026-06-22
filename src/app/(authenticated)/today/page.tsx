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
import { getRecentRecommendations } from '@/lib/ai/analyticsStore'
import { buildTodayPersonalization, summarizeRecommendationSignals } from '@/lib/self-model'
import { buildPrimaryPathContext } from '@/lib/path-context'
import { buildMainPathDensityContext } from '@/lib/main-path-density'

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

type MainPathActionWindowRow = {
  goal_id: string | null
  completed: boolean | null
  created_at: string | null
  updated_at: string | null
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
      .select('id, title, priority, start_date, end_date, success_criteria, stop_criteria, actions(id, completed)')
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
  const recentRecommendations = await getRecentRecommendations({
    supabase,
    userId: user.id,
    limit: 24,
    days: 30,
  })
  const localeIsZh = dict.common.locale.startsWith('zh')
  const hasCompletedToday = streakSnapshot.completedDates.includes(today)
  const showStreakRiskBanner = !hasCompletedToday && (streakSnapshot.currentStreak > 0 || Boolean(streakSnapshot.recoverableMissDate))
  const rescueAction = (actions || []).find(action => !action.completed && action.type === 'core') || null
  const completedCount = (actions || []).filter(action => action.completed).length
  const incompleteCount = (actions || []).filter(action => !action.completed).length
  const nextActionTitle = (actions || []).find(action => !action.completed)?.title || null
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
    ? (localeIsZh ? '先恢复昨天，再完成今天' : 'Recover yesterday, then finish today')
    : (localeIsZh ? '先做 5 分钟版本，保住连续性' : 'Start with a 5-minute version to protect your streak')
  const streakBannerBody = streakSnapshot.recoverableMissDate
    ? (
      streakSnapshot.shieldBalance > 0
        ? (localeIsZh
          ? `昨天漏掉了 1 天，你还有 ${streakSnapshot.shieldBalance} 个护盾可补回；处理完后再推进今天。`
          : `Yesterday is recoverable. You still have ${streakSnapshot.shieldBalance} shield(s); recover it first, then move today forward.`)
        : (localeIsZh
          ? '昨天已经断掉，但现在没有护盾；先完成今天的 5 分钟最小行动，重新起步。'
          : 'Yesterday was missed and no shield is available. Restart with a 5-minute minimum action today.'))
    : (localeIsZh
      ? `你当前已经连续 ${streakSnapshot.currentStreak} 天，今天优先完成一个最小行动即可继续保持。`
      : `You are on a ${streakSnapshot.currentStreak}-day streak. Finish one minimum action today to keep it going.`)
  const rescueHref = rescueAction ? `/today?rescue=${rescueAction.id}#today-actions` : '#today-actions'
  const rescueCtaLabel = localeIsZh
    ? (rescueAction ? '打开 5 分钟救援' : '去做最小行动')
    : (rescueAction ? 'Open 5-min rescue' : 'Do a minimum action')
  const mainThreadTitle = showStreakRiskBanner
    ? (localeIsZh ? '今天先保连续，不先追求更多' : 'Protect continuity before chasing more today')
    : tomorrowHandoffCandidate
      ? (localeIsZh ? '先把昨天的 momentum 接回来' : 'Bring yesterday’s momentum forward first')
      : nextActionTitle
        ? (localeIsZh ? `今天的主线是推进「${nextActionTitle}」` : `Today’s main thread is "${nextActionTitle}"`)
        : (localeIsZh ? '今天的执行层已经收口' : 'Today’s execution layer is closed')
  const mainThreadBody = showStreakRiskBanner
    ? streakBannerBody
    : tomorrowHandoffCandidate
      ? (localeIsZh
          ? '系统优先建议你延续昨天已经完成的 AI 核心行动，让推进感不要断掉。'
          : 'The system recommends extending yesterday’s completed AI core action so momentum stays alive.')
      : nextActionTitle
        ? (localeIsZh
            ? '今天不需要做更多决定。先把这一条推进到发生，其余信息都应该为它让路。'
            : 'You do not need more decisions today. Push this one thing forward and let everything else support it.')
        : (localeIsZh
            ? '主线已经完成。接下来更适合补复盘、收口和为明天留出承接。'
            : 'The main thread is already complete. The next best move is to review, close the loop, and prepare tomorrow.')
  const recommendationSignals = summarizeRecommendationSignals(recentRecommendations)
  const primaryPathContext = buildPrimaryPathContext({
    locale: localeIsZh ? 'zh' : 'en',
    today,
    goals: (activeGoals || []).map(goal => ({
      id: goal.id as string,
      title: goal.title as string,
      priority: (goal.priority as string | null | undefined) ?? null,
      start_date: (goal.start_date as string | null | undefined) ?? null,
      end_date: (goal.end_date as string | null | undefined) ?? null,
      success_criteria: (goal.success_criteria as string | null | undefined) ?? null,
      stop_criteria: (goal.stop_criteria as string | null | undefined) ?? null,
      actions: Array.isArray(goal.actions)
        ? goal.actions.map(action => ({
            id: action.id as string,
            completed: Boolean(action.completed),
          }))
        : [],
    })),
  })
  const sevenDaysAgo = shiftDateBucket(today, -6)
  const { data: recentMainPathActions } = primaryPathContext?.goalId
    ? await queryWithOwnershipFallback({
        execute: (ownershipColumn) => supabase
          .from('actions')
          .select('goal_id, completed, created_at, updated_at')
          .eq(ownershipColumn, ownerId)
          .eq('goal_id', primaryPathContext.goalId)
      })
    : { data: [] as MainPathActionWindowRow[] }
  const primaryGoal = (activeGoals || []).find((goal) => goal.id === primaryPathContext?.goalId) ?? null
  const primaryGoalTotalCount = Array.isArray(primaryGoal?.actions) ? primaryGoal.actions.length : 0
  const primaryGoalCompletionCount = Array.isArray(primaryGoal?.actions)
    ? primaryGoal.actions.filter((action) => Boolean(action.completed)).length
    : 0
  const inRecentWindow = (iso?: string | null) => {
    if (!iso) return false
    const bucket = getDateBucketInTZ(iso, tz)
    return bucket >= sevenDaysAgo && bucket <= today
  }
  const recentCompletedCount7d = ((recentMainPathActions || []) as MainPathActionWindowRow[]).filter(
    (action) => Boolean(action.completed) && inRecentWindow(action.updated_at)
  ).length
  const recentActiveCount7d = ((recentMainPathActions || []) as MainPathActionWindowRow[]).filter(
    (action) => inRecentWindow(action.updated_at) || inRecentWindow(action.created_at)
  ).length
  const mainPathDensityContext = buildMainPathDensityContext({
    locale: localeIsZh ? 'zh' : 'en',
    primaryPathContext,
    totalCount: primaryGoalTotalCount,
    completionCount: primaryGoalCompletionCount,
    recentCompletedCount7d: recentCompletedCount7d > 0 ? recentCompletedCount7d : null,
    recentActiveCount7d: recentActiveCount7d > 0 ? recentActiveCount7d : null,
  })
  const todayPersonalization = buildTodayPersonalization({
    locale: localeIsZh ? 'zh' : 'en',
    currentStreak: streakSnapshot.currentStreak,
    nextActionTitle,
    showStreakRiskBanner,
    hasTomorrowHandoff: Boolean(tomorrowHandoffCandidate),
    signals: recommendationSignals,
  })

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
          <div className="text-sm text-muted-foreground mt-1">{dict.today.subtitle}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {toLocaleDateStringTZ(dict.common.locale, tz, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="hidden md:block">
          <AddActionDialog activeGoals={activeGoals || []} dict={dict} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/10 via-background to-background p-5 shadow-sm md:p-6">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
            {localeIsZh ? 'Today Main Thread' : 'Today Main Thread'}
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{mainThreadTitle}</div>
          <div className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{mainThreadBody}</div>
          <div id="today-system-read" className="mt-5 max-w-2xl rounded-2xl border border-border/50 bg-background/80 p-4 scroll-mt-24">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
              {todayPersonalization.eyebrow}
            </div>
            <div className="mt-2 text-base font-medium">{todayPersonalization.title}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{todayPersonalization.body}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/profile#current-system-read"
                className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium hover:border-primary/35 hover:bg-primary/5"
              >
                {localeIsZh ? '看当前理解' : 'Current system read'}
              </a>
              <a
                href="/profile/ai-insights#system-read-explained"
                className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium hover:border-primary/35 hover:bg-primary/5"
              >
                {localeIsZh ? '看系统为何这样判断' : 'Why the system thinks this'}
              </a>
            </div>
          </div>
          {primaryPathContext ? (
            <div className="mt-4 max-w-2xl rounded-2xl border border-primary/12 bg-primary/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                {primaryPathContext.stageLabel}
              </div>
              <div className="mt-2 text-base font-medium">
                {localeIsZh ? `当前主线路径是「${primaryPathContext.title}」` : `Current main path: "${primaryPathContext.title}"`}
              </div>
              <div className="mt-2 text-sm leading-6 text-foreground/90">
                {primaryPathContext.titleText}
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {primaryPathContext.body}
              </div>
              <div className="mt-3 rounded-2xl border border-border/50 bg-background/80 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {localeIsZh ? 'Why This Path Leads Today' : 'Why This Path Leads Today'}
                </div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  {primaryPathContext.evidence}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`/goals/${primaryPathContext.goalId}`}
                  className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium hover:border-primary/35 hover:bg-primary/5"
                >
                  {primaryPathContext.ctaLabel}
                </a>
                <a
                  href="/goals"
                  className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium hover:border-primary/35 hover:bg-primary/5"
                >
                  {localeIsZh ? '查看全部路径' : 'View all paths'}
                </a>
              </div>
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {localeIsZh ? '待推进' : 'Open actions'}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{incompleteCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {localeIsZh ? '今天仍需向前推进的行动数。' : 'Actions still waiting to move forward today.'}
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {localeIsZh ? '已收口' : 'Closed today'}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{completedCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {localeIsZh ? '已经完成并计入系统判断的行动。' : 'Actions already closed and counted by the system.'}
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {localeIsZh ? '连续状态' : 'Continuity'}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{streakSnapshot.currentStreak}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {localeIsZh
                ? `护盾 ${streakSnapshot.shieldBalance} 个，${hasCompletedToday ? '今天已保住连续' : '今天仍需一次完成' }。`
                : `${streakSnapshot.shieldBalance} shield(s), ${hasCompletedToday ? 'continuity secured today' : 'one completion still needed today'}.`}
            </div>
          </div>
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
          <div className="rounded-3xl border border-orange-200/60 bg-linear-to-br from-orange-50/90 to-background p-5 shadow-sm dark:border-orange-500/20 dark:from-orange-950/30 dark:to-background">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-orange-700/80 dark:text-orange-300/80">
                  {localeIsZh ? 'Continuity Priority' : 'Continuity Priority'}
                </div>
                <div className="mt-2 text-base font-medium">{streakBannerTitle}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{streakBannerBody}</div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {streakSnapshot.recoverableMissDate ? (
                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-medium hover:bg-background"
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
                  className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
                >
                  {rescueCtaLabel}
                </TrackedEventLink>
              </div>
            </div>
          </div>
        ) : null}
        {showAIPlan ? (
          <div id="today-ai-plan" className="rounded-3xl border border-primary/12 bg-linear-to-br from-primary/5 via-card to-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                  {localeIsZh ? 'System Suggestion' : 'System Suggestion'}
                </div>
                <div className="text-base font-medium">
                  {dict.dashboard.planning.aiPlanTitle}
                </div>
                <div className="text-sm leading-6 text-muted-foreground">
                  {dict.dashboard.planning.desc.replace('{count}', String(activeGoals?.length || 0))}
                </div>
              </div>
              <AITodayPlanButton
                dict={dict}
                goals={activeGoals || []}
                actions={aiActionContext}
                defaultDate={today}
                ab1TodayPlanVariant={ab1TodayPlanVariant}
                preferredGoalId={primaryPathContext?.goalId ?? null}
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
            primaryGoalId={primaryPathContext?.goalId ?? null}
            primaryPathContext={primaryPathContext ?? null}
            mainPathDensityContext={mainPathDensityContext}
            initialOpenActionId={initialOpenActionId}
            initialPanelMode={initialPanelMode}
          />
        </div>
      </div>
    </div>
  )
}
