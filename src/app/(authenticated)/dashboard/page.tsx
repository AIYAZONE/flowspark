import { format, parseISO, subDays } from 'date-fns'
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
import { StatCard } from '@/components/StatCard'
import { StreakCard } from '@/components/StreakCard'
import { GoalProgressList } from '@/components/GoalProgressList'
import { InboxCard } from '@/components/InboxCard'
import { WeeklyInsightCard } from '@/components/WeeklyInsightCard'
import { Target, Star } from 'lucide-react'
import { assignVariant, isEnvEnabled } from '@/lib/experiments'
import { ExperimentExposureTracker } from '@/components/ExperimentExposureTracker'
import { calcCompletionPercent, calcTimeProgressPercent, getPaceStatus } from '@/lib/progress'
import { getOrCreateWeeklyInsight } from '@/lib/ai/insightStore'

export default async function DashboardPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const todayPlanEnabledEnv =
    process.env.NEXT_PUBLIC_AI_TODAY_PLAN_ENABLED ?? process.env.AI_TODAY_PLAN_ENABLED
  const todayPlanEnabled = todayPlanEnabledEnv ? isEnvEnabled(todayPlanEnabledEnv) : true
  const ab1TodayPlanEnabled = isEnvEnabled(process.env.AI_EXPERIMENT_AB1_TODAY_PLAN)
  const ab1TodayPlanVariant = ab1TodayPlanEnabled ? assignVariant(user.id, 'ab1_today_plan') : null
  const showAIPlan = todayPlanEnabled && (!ab1TodayPlanEnabled || ab1TodayPlanVariant === 'B')

  const ab2ReviewEnabled = isEnvEnabled(process.env.AI_EXPERIMENT_AB2_REVIEW_Q)
  const ab2ReviewVariant = ab2ReviewEnabled ? assignVariant(user.id, 'ab2_review_q') : null
  const reviewQuestionsCount = ab2ReviewEnabled ? (ab2ReviewVariant === 'A' ? 1 : 2) : 2
  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const { count: inboxOpenCountRaw } = await supabase
    .from('inbox_items')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('status', 'open')

  const inboxOpenCount = inboxOpenCountRaw ?? 0
  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const weeklyInsight = await getOrCreateWeeklyInsight({
    supabase,
    userId: user.id,
    locale,
  })

  const { data: inboxRecent } = await supabase
    .from('inbox_items')
    .select('id, content, tags')
    .eq('owner_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch user profile for name and XP
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, xp, level')
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
  const { data: rawActions } = await supabase
    .from('actions')
    .select(`
      *,
      goals (
        status
      )
    `)
    .eq('type', 'core')
    .eq('user_id', user.id)
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
    .order('start_date', { ascending: true })

  const { data: archivedGoals } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'archived')

  const archivedGoalIdSet = new Set((archivedGoals || []).map(g => g.id))

  // Fetch completed actions for Heatmap (Last 365 days for now, can be expanded)
  const oneYearAgo = new Date()
  oneYearAgo.setDate(oneYearAgo.getDate() - 365)

  const { data: completedActions } = await supabase
    .from('actions')
    .select('updated_at')
    .eq('user_id', user.id)
    .eq('completed', true)
    .gte('updated_at', oneYearAgo.toISOString())

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
  const { data: actionsType } = await supabase
    .from('actions')
    .select('type')
    .eq('user_id', user.id)

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
  let { data: scores } = await supabase
    .from('daily_scores')
    .select('score')
    .eq('score_date', today)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!scores) {
    const fallback = await supabase
      .from('daily_scores')
      .select('score')
      .eq('score_date', today)
      .eq('user_id', user.id)
      .maybeSingle()
    scores = fallback.data ?? null
  }

  const dailyScore = scores?.score

  // Fetch yesterday score for planning card
  const { data: yesterdayScores } = await supabase
    .from('daily_scores')
    .select('score')
    .eq('score_date', yesterday)
    .eq('owner_id', user.id)
    .maybeSingle()

  // Fetch active goals WITH actions count
  const { data: goalsData } = await supabase
    .from('goals')
    .select('id, title, status, priority, start_date, end_date, success_criteria, stop_criteria, actions(id, completed)')
    .eq('status', 'active')
    .eq('user_id', user.id)

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
  let { data: recentScores } = await supabase
    .from('daily_scores')
    .select('score_date, score')
    .eq('owner_id', user.id)
    .order('score_date', { ascending: false })
    .limit(30)

  if (!recentScores || recentScores.length === 0) {
    const fallbackRecent = await supabase
      .from('daily_scores')
      .select('score_date, score')
      .eq('user_id', user.id)
      .order('score_date', { ascending: false })
      .limit(30)
    recentScores = fallbackRecent.data ?? []
  }

  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  const completedDateSet = new Set(
    (completedActions || [])
      .map(a => (a.updated_at ? dateFormatter.format(new Date(a.updated_at)) : null))
      .filter((d): d is string => !!d)
  )

  let streak = 0
  if (completedDateSet.size > 0) {
    const todayDate = parseISO(today)
    const todayStr = format(todayDate, 'yyyy-MM-dd')
    const yesterdayStr = format(subDays(todayDate, 1), 'yyyy-MM-dd')

    const startOffset = completedDateSet.has(todayStr) ? 0 : (completedDateSet.has(yesterdayStr) ? 1 : null)
    if (startOffset != null) {
      for (let i = startOffset; ; i++) {
        const d = format(subDays(todayDate, i), 'yyyy-MM-dd')
        if (completedDateSet.has(d)) {
          streak++
        } else {
          break
        }
      }
    }
  }
  const streakMilestones = [1, 3, 7, 10, 30]
  const nextMilestone = streakMilestones.find((milestone) => streak < milestone) ?? streakMilestones[streakMilestones.length - 1]

  const chartData = recentScores?.map(s => ({ date: s.score_date, score: s.score })) || []

  // Determine Dashboard Stage
  // Stage 0: Onboarding (No Goals)
  // Stage 1: Planning (Has Goals, No Actions)
  // Stage 2: Flow (Has Actions)
  const isStage0 = activeGoalsCount === 0
  const isStage1 = !isStage0 && actions.length === 0
  const isStage2 = !isStage0 && actions.length > 0

  return (
    <div className="space-y-8 pb-12">
      <ExperimentExposureTracker
        source="dashboard"
        ab1TodayPlanVariant={ab1TodayPlanVariant}
        ab2ReviewVariant={ab2ReviewVariant}
        showAIPlan={showAIPlan}
      />
      {/* 1. Header & Welcome */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-background/80 to-background p-4 md:p-5 shadow-sm">
        <DashboardWelcome
          dict={dict.dashboard.welcome}
          name={profile?.name || user.email?.split('@')[0] || 'Flow Seeker'}
          isNewUser={isStage0}
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
              nextMilestone={nextMilestone}
              recent7={chartData.slice(-7)}
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
            <InboxCard
              dict={dict}
              openCount={inboxOpenCount}
              recentItems={(inboxRecent || []).map((it) => ({
                id: it.id as string,
                content: it.content as string,
                tags: (it.tags as string[]) || [],
              }))}
            />
            <FocusDistributionChart dict={dict} data={distributionData} />
          </div>
        </div>
      )}
    </div>
  )
}
