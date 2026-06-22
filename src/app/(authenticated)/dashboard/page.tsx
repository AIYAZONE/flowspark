import { createClient } from '@/lib/supabase/server'
import { ScoreTrendChart } from '@/components/ScoreTrendChart'
import { getDictionary } from '@/i18n/get-dictionary'
import { getUserTimezone, getTodayInTZ } from '@/lib/time'
import { DashboardWelcome } from '@/components/DashboardWelcome'
import { OnboardingHero } from '@/components/OnboardingHero'
import { DailyPlanningCard } from '@/components/DailyPlanningCard'
import { FocusCard } from '@/components/FocusCard'
import { LevelCard } from '@/components/LevelCard'
import { FocusDistributionChart } from '@/components/FocusDistributionChart'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import { ScoreCard } from '@/components/ScoreCard'
import { StreakCard } from '@/components/StreakCard'
import { StreakFeedbackBanner } from '@/components/StreakFeedbackBanner'
import { GoalProgressList } from '@/components/GoalProgressList'
import { WeeklyInsightCard } from '@/components/WeeklyInsightCard'
import { isEnvEnabled } from '@/lib/experiments'
import { ExperimentExposureTracker } from '@/components/ExperimentExposureTracker'
import { calcCompletionPercent, calcTimeProgressPercent, getPaceStatus } from '@/lib/progress'
import { getOrCreateWeeklyInsight } from '@/lib/ai/insightStore'
import { getStreakSnapshot } from '@/lib/streaks'
import { DAILY_QUOTE_CANDIDATE_COUNT, getDailyQuoteCandidates, QUOTE_TIME_ZONE } from '@/lib/daily-quote'
import { getExperimentDecision } from '@/lib/featureFlags'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import Link from 'next/link'
import { ArrowRight, BrainCircuit, Route, Shield, Sparkles } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
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

  const ab2ReviewDecision = await getExperimentDecision({
    supabase,
    userId: user.id,
    experimentKey: 'ab2_review_q',
    envEnabled: process.env.AI_EXPERIMENT_AB2_REVIEW_Q,
    defaultEnabled: false,
  })
  const ab2ReviewEnabled = ab2ReviewDecision.enabled
  const ab2ReviewVariant = ab2ReviewDecision.variant
  const reviewQuestionsCount = ab2ReviewEnabled ? (ab2ReviewVariant === 'A' ? 1 : 2) : 2
  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toISOString().split('T')[0]

  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const quoteDateISO = getTodayInTZ(QUOTE_TIME_ZONE)
  const dailyQuotes = getDailyQuoteCandidates({
    locale,
    dateISO: quoteDateISO,
    count: DAILY_QUOTE_CANDIDATE_COUNT,
  })
  const weeklyInsight = await getOrCreateWeeklyInsight({
    supabase,
    userId: user.id,
    locale,
  })

  // Fetch user profile for name and XP
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, xp, level, avatar_url')
    .eq('id', user.id)
    .single()

  const currentXP = profile?.xp || 0
  const currentLevel = profile?.level || 1
  const nextLevelXP = 100 * Math.pow(1.2, currentLevel - 1)

  // Fetch recent XP log
  const { data: lastLog } = await supabase
    .from('xp_logs')
    .select('amount, source')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch today's core action
  const { data: rawActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('actions')
      .select(`
        *,
        goals (
          status
        )
      `)
      .eq('type', 'core')
      .eq(ownershipColumn, user.id)
      .or(
        [
          `and(start_date.lte.${today},end_date.gte.${today})`,
          `and(end_date.lt.${today},completed.eq.false)`,
          `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
          `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
          `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
        ].join(',')
      )
      .order('completed', { ascending: true })
      .order('start_date', { ascending: true }),
  })

  const { data: archivedGoals } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('goals')
      .select('id')
      .eq(ownershipColumn, user.id)
      .eq('status', 'archived'),
  })

  const archivedGoalIdSet = new Set((archivedGoals || []).map(g => g.id))

  // Fetch completed actions for Heatmap (Last 365 days for now, can be expanded)
  const oneYearAgo = new Date()
  oneYearAgo.setDate(oneYearAgo.getDate() - 365)

  const { data: completedActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('actions')
      .select('updated_at')
      .eq(ownershipColumn, user.id)
      .eq('completed', true)
      .gte('updated_at', oneYearAgo.toISOString()),
  })

  // Prepare Heatmap Data
  const heatmapData = completedActions?.reduce((acc, curr) => {
    const date = curr.updated_at?.split('T')[0]
    if (!date) return acc
    const existing = acc.find(d => d.date === date)
    if (existing) {
      existing.count++
    } else {
      acc.push({ date, count: 1 })
    }
    return acc
  }, [] as { date: string; count: number }[]) || []

  // Fetch actions type distribution
  const { data: actionsType } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('actions')
      .select('type')
      .eq(ownershipColumn, user.id),
  })

  const typeCount = actionsType?.reduce((acc, curr) => {
    const type = curr.type || 'other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const distributionData = Object.entries(typeCount).map(([type, count]) => {
    let color = '#6b7280'
    const typeLabel = dict.today.types[type as keyof typeof dict.today.types] || type
    let name = typeLabel
    if (type === 'core') { color = '#059669'; name = dict.today.types.core }
    if (type === 'learning') { color = '#3b82f6'; name = dict.today.types.learning }
    if (type === 'maintenance') { color = '#f59e0b'; name = dict.today.types.maintenance }
    if (type === 'health') { color = '#ec4899'; name = dict.today.types.rest }

    return { name, value: count, color }
  })

  // Filter actions in JS to accurately handle timezone "today"
  const actions = rawActions?.filter(action => {
    if (action.goals?.status === 'archived') return false
    if (action.goal_id && archivedGoalIdSet.has(action.goal_id)) return false

    const isRegular = action.start_date <= today && (action.end_date || action.start_date) >= today;
    const isDelayedIncomplete = !action.completed && (action.end_date || action.start_date) < today;

    if (isRegular || isDelayedIncomplete) return true;

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
  }) || [];

  // Fetch daily score
  const { data: scores } = await queryWithOwnershipFallback({
    primary: 'owner_id',
    fallback: 'user_id',
    execute: (ownershipColumn) => supabase
      .from('daily_scores')
      .select('score')
      .eq(ownershipColumn, user.id)
      .eq('score_date', today)
      .maybeSingle()
  })

  const dailyScore = scores?.score

  // Fetch yesterday score for planning card
  const { data: yesterdayScores } = await queryWithOwnershipFallback({
    primary: 'owner_id',
    fallback: 'user_id',
    execute: (ownershipColumn) => supabase
      .from('daily_scores')
      .select('score')
      .eq(ownershipColumn, user.id)
      .eq('score_date', yesterday)
      .maybeSingle(),
    fallbackOnEmpty: false,
  })

  // Fetch active goals WITH actions count
  const { data: goalsData } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('goals')
      .select('id, title, status, priority, start_date, end_date, success_criteria, stop_criteria, actions(id, completed)')
      .eq('status', 'active')
      .eq(ownershipColumn, user.id),
  })

  const activeGoalsCount = goalsData?.length || 0

  // Process goals for GoalProgressList
  // Strategy: Align with GoalListFilter.tsx logic
  // Priority > End Date > Start Date
  const goalProgressList = goalsData?.map(g => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = (g.actions as any[])?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed = (g.actions as any[])?.filter((a: any) => a.completed).length || 0
    const progress = calcCompletionPercent(completed, total)
    const remainingActions = Math.max(total - completed, 0)
    const timeProgress = calcTimeProgressPercent(g.start_date, g.end_date)
    const paceStatus = total <= 0 || timeProgress == null ? null : getPaceStatus(progress, timeProgress)

    return {
      id: g.id,
      title: g.title,
      totalActions: total,
      completedActions: completed,
      remainingActions,
      progress,
      paceStatus,
      priority: g.priority || 'medium',
      end_date: g.end_date,
      start_date: g.start_date || ''
    }
  })
    .sort((a, b) => {
      // 1. Priority: High > Medium > Low
      const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const pA = pMap[a.priority] || 2
      const pB = pMap[b.priority] || 2
      if (pA !== pB) return pB - pA

      // 2. End Date: Urgent first (Sooner < Later)
      if (a.end_date !== b.end_date) {
        if (!a.end_date) return 1 // No deadline -> Last
        if (!b.end_date) return -1
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      }

      // 3. Start Date: Sooner first
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    }) || []

  // Fetch recent scores for trend and streak
  const { data: recentScores } = await queryWithOwnershipFallback({
    primary: 'owner_id',
    fallback: 'user_id',
    execute: (ownershipColumn) => supabase
      .from('daily_scores')
      .select('score_date, score')
      .eq(ownershipColumn, user.id)
      .order('score_date', { ascending: false })
      .limit(30)
  })

  const streakSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone: tz,
    today,
  })
  const streak = streakSnapshot.currentStreak
  const continuityPriorityAction = actions.find(action => !action.completed && action.type === 'core') || null
  const showContinuityPriority = !streakSnapshot.completedToday && Boolean(continuityPriorityAction)

  const chartData = recentScores?.map(s => ({ date: s.score_date, score: s.score })) || []

  // Determine Dashboard Stage
  // Stage 0: Onboarding (No Goals)
  // Stage 1: Planning (Has Goals, No Actions)
  // Stage 2: Flow (Has Actions)
  const isStage0 = activeGoalsCount === 0
  const isStage1 = !isStage0 && actions.length === 0
  const incompleteActionsCount = actions.filter(action => !action.completed).length
  const nextActionTitle = actions.find(action => !action.completed)?.title || null
  const systemJudgmentTitle = isStage0
    ? (locale === 'zh' ? '先定义你的第一条长期路径' : 'Define your first long-term path')
    : showContinuityPriority
      ? (locale === 'zh' ? '今天先保连续，再谈冲刺' : 'Protect continuity first, then push harder')
      : nextActionTitle
        ? (locale === 'zh' ? `今天先推进「${nextActionTitle}」` : `Push "${nextActionTitle}" first today`)
        : (locale === 'zh' ? '今天的主线已完成，适合收口复盘' : 'Today’s main thread is complete. Close the loop with a review.')
  const systemJudgmentBody = isStage0
    ? (locale === 'zh'
        ? '系统还缺少一条足够清晰的长期路径。先定义你要走向哪里，后面的 AI 判断才会越来越准。'
        : 'The system still needs one clear long-term path. Define where you are headed first so AI judgment can become sharper over time.')
    : showContinuityPriority
      ? (locale === 'zh'
          ? '你现在更需要保住节奏，而不是做更多。先完成一个最小版本，系统会帮你把连续性留住。'
          : 'You need rhythm more than volume right now. Finish a minimum version first and let the system preserve continuity.')
      : nextActionTitle
        ? (locale === 'zh'
            ? '系统判断你现在最应该做的不是看更多信息，而是把下一步推进到发生。'
            : 'The system believes your next step matters more than consuming more information right now.')
        : (locale === 'zh'
            ? '执行层已经收口，下一步更适合做今日复盘，让系统更新对你的理解。'
            : 'Execution is closed for today. The next best move is a daily review so the system can update its model of you.')
  const systemJudgmentHref = isStage0 ? '/goals' : '/today'
  const systemJudgmentCta = isStage0
    ? (locale === 'zh' ? '定义一条路径' : 'Define a path')
    : (locale === 'zh' ? '进入今日主线' : 'Open today')

  return (
    <div className="space-y-8 pb-12">
      <ExperimentExposureTracker
        source="dashboard"
        ab1TodayPlanVariant={ab1TodayPlanVariant}
        ab2ReviewVariant={ab2ReviewVariant}
        showAIPlan={showAIPlan}
        showAIReview={!isStage0}
        dateBucket={today}
      />
      <StreakFeedbackBanner dict={dict} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/10 via-background to-background p-5 shadow-sm md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Premium Life OS</span>
          </div>
          <div className="mt-4 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{dict.dashboard.title}</h1>
            <div className="max-w-2xl text-sm text-muted-foreground md:text-base">{dict.dashboard.subtitle}</div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Route className="h-3.5 w-3.5" />
                <span>{locale === 'zh' ? '活跃路径' : 'Active paths'}</span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{activeGoalsCount}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {locale === 'zh' ? '你当前真正持续推进的长期方向。' : 'The long arcs you are actively moving forward.'}
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>{locale === 'zh' ? '连续系统' : 'Continuity'}</span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{streak}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {locale === 'zh'
                  ? `连续 ${streak} 天，护盾 ${streakSnapshot.shieldBalance} 个。`
                  : `${streak}-day streak, ${streakSnapshot.shieldBalance} shield(s).`}
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>{locale === 'zh' ? '今日执行' : 'Today state'}</span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">
                {dailyScore ?? incompleteActionsCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {dailyScore != null
                  ? (locale === 'zh' ? `今日评分已记录，剩余 ${incompleteActionsCount} 个行动待推进。` : `Score submitted. ${incompleteActionsCount} action(s) still open.`)
                  : (locale === 'zh' ? `${incompleteActionsCount} 个行动待推进，系统仍在等待今日输入。` : `${incompleteActionsCount} action(s) still open. The system is still waiting for today’s input.`)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/50 bg-background/90 p-5 shadow-sm md:p-6">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {locale === 'zh' ? '系统判断' : 'System judgment'}
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight">{systemJudgmentTitle}</div>
          <div className="mt-3 text-sm leading-6 text-muted-foreground">{systemJudgmentBody}</div>
          <Link
            href={systemJudgmentHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <span>{systemJudgmentCta}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 rounded-2xl border border-border/50 bg-muted/30 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {locale === 'zh' ? '本周信号' : 'Weekly signal'}
            </div>
            <div className="mt-2 text-sm text-foreground">
              {weeklyInsight?.output.summary || (locale === 'zh' ? '系统会在本周复盘中继续提炼你的执行模式。' : 'The system will keep refining your execution pattern in this week’s review.')}
            </div>
          </div>
        </div>
      </div>
      {/* 1. Header & Welcome */}
      <div className="rounded-2xl border border-border/40 bg-linear-to-br from-primary/5 via-background/80 to-background p-4 md:p-5 shadow-sm">
        <DashboardWelcome
          dict={dict.dashboard.welcome}
          name={profile?.name || user.email?.split('@')[0] || 'Flow Seeker'}
          isNewUser={isStage0}
          dailyQuotes={dailyQuotes}
          defaultQuoteIndex={0}
          quoteDateISO={quoteDateISO}
          locale={locale}
          avatarUrl={profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? null}
        />
      </div>

      {/* 2. Top Stats Row (KPIs) - Only for active users */}
      {!isStage0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Streak Card - Takes 2 columns for emphasis */}
          <div className="md:col-span-2">
            <StreakCard
              dict={dict}
              streak={streak}
              todayCompleted={streakSnapshot.completedToday}
              shieldBalance={streakSnapshot.shieldBalance}
              recoverableMissDate={streakSnapshot.recoverableMissDate}
              nextGrantAtStreak={streakSnapshot.nextShieldGrantRule.nextGrantAtStreak}
            />
          </div>

          {/* Level Card (Status) - Takes 1 column */}
          <LevelCard
            dict={dict}
            level={currentLevel}
            currentXP={currentXP}
            nextLevelXP={Math.floor(nextLevelXP)}
            lastLog={lastLog}
            className="h-full"
          />
        </div>
      )}

      {/* 3. Main Stage (State Aware) */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isStage0 && (
          <OnboardingHero dict={dict.dashboard.onboarding} />
        )}
      </div>

      {!isStage0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Row 1: Focus & Score (Action Zone) */}
          <div className="lg:col-span-2">
            {/* Today's Focus Card */}
            {isStage1 ? (
              <DailyPlanningCard
                dict={dict.dashboard.planning}
                activeGoalsCount={activeGoalsCount}
                yesterdayScore={yesterdayScores?.score ?? null}
                goals={goalsData?.map(g => ({
                  id: g.id,
                  title: g.title,
                  status: g.status,
                  priority: (g as unknown as { priority?: string | null }).priority ?? null,
                  start_date: (g as unknown as { start_date?: string | null }).start_date ?? null,
                  end_date: (g as unknown as { end_date?: string | null }).end_date ?? null,
                  success_criteria: (g as unknown as { success_criteria?: string | null }).success_criteria ?? null,
                  stop_criteria: (g as unknown as { stop_criteria?: string | null }).stop_criteria ?? null
                })) || []}
                dictFull={dict}
                defaultDate={today}
                showAIPlan={showAIPlan}
                ab1TodayPlanVariant={ab1TodayPlanVariant}
                className="h-full"
              />
            ) : (
              <FocusCard
                dict={dict.dashboard.flow}
                totalActions={actions.length}
                completedActions={actions.filter(a => a.completed).length}
                nextActionTitle={actions.find(a => !a.completed)?.title}
                locale={locale}
                continuityPriority={{
                  enabled: showContinuityPriority,
                  href: continuityPriorityAction ? `/today?rescue=${continuityPriorityAction.id}#today-actions` : '/today',
                  actionTitle: continuityPriorityAction?.title,
                }}
                className="h-full"
              />
            )}
          </div>

          <div className="lg:col-span-1">
            {/* Daily Score Card (Input) */}
            <ScoreCard
              dict={dict}
              today={today}
              recent7={chartData.slice(0, 7)}
              currentScore={dailyScore ?? null}
              reviewQuestionsCount={reviewQuestionsCount}
              ab2ReviewVariant={ab2ReviewVariant}
              className="h-full"
            />
          </div>

          <div className="lg:col-span-3">
            <WeeklyInsightCard
              dict={dict.dashboard.planning}
              locale={locale}
              insight={weeklyInsight}
            />
          </div>

          {/* Row 2: Main Content (Left) & Analysis (Right) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goal Progress List (New) */}
            <GoalProgressList dict={dict} goals={goalProgressList} />

            {/* Score Trend Chart - In Main Column */}
            <ScoreTrendChart
              data={chartData}
              title={dict.dashboard.recentTrend}
              description={dict.dashboard.recentTrendDesc}
              scoreLabel={dict.dashboard.submitScore}
            />

            {/* Consistency Calendar - In Main Column */}
            <ActivityHeatmap dict={dict} data={heatmapData} />
          </div>

          {/* Right Column (Analysis) */}
          <div className="lg:col-span-1 space-y-6">
            <FocusDistributionChart dict={dict} data={distributionData} />
          </div>
        </div>
      )}
    </div>
  )
}
