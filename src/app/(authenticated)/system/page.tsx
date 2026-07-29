import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { getStreakSnapshot } from '@/lib/streaks'
import { getUserTimezone, getTodayInTZ, shiftDateBucket } from '@/lib/time'
import { GoalProgressList } from '@/components/GoalProgressList'
import { calcCompletionPercent, calcTimeProgressPercent, getPaceStatus } from '@/lib/progress'
import { getDailyQuoteCandidates, DAILY_QUOTE_CANDIDATE_COUNT, QUOTE_TIME_ZONE } from '@/lib/daily-quote'
import { DashboardWelcome } from '@/components/DashboardWelcome'
import { WeeklyInsightCard } from '@/components/WeeklyInsightCard'
import { LevelCard } from '@/components/LevelCard'
import { ScoreCard } from '@/components/ScoreCard'
import { ScoreTrendChart } from '@/components/ScoreTrendChart'
import { FocusDistributionChart } from '@/components/FocusDistributionChart'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import { getOrCreateWeeklyInsight } from '@/lib/ai/insightStore'
import { StreakCard } from '@/components/StreakCard'

export default async function SystemPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  const yesterday = shiftDateBucket(today, -1)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, avatar_url, xp, level')
    .eq('id', user.id)
    .maybeSingle()
  const displayName =
    profile?.name ?? (user.user_metadata?.name as string) ?? user.email?.split('@')[0] ?? 'You'

  const quoteDateISO = getTodayInTZ(QUOTE_TIME_ZONE)
  const dailyQuotes = getDailyQuoteCandidates({
    locale,
    dateISO: quoteDateISO,
    count: DAILY_QUOTE_CANDIDATE_COUNT,
  })

  const { data: activeGoals } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('goals')
        .select('id, title, priority, start_date, end_date, success_criteria, stop_criteria, actions(id, completed)')
        .eq(ownershipColumn, user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
  })

  const streakSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone: tz,
    today,
  })

  const hasActiveGoals = (activeGoals || []).length > 0

  const { data: todayScoreRow } = await queryWithOwnershipFallback({
    primary: 'owner_id',
    fallback: 'user_id',
    fallbackOnEmpty: false,
    execute: (ownershipColumn) =>
      supabase
        .from('daily_scores')
        .select('score')
        .eq(ownershipColumn, user.id)
        .eq('score_date', today)
        .maybeSingle(),
  })
  const dailyScore = todayScoreRow?.score ?? null

  const { data: recentScores } = await queryWithOwnershipFallback({
    primary: 'owner_id',
    fallback: 'user_id',
    execute: (ownershipColumn) =>
      supabase
        .from('daily_scores')
        .select('score_date, score')
        .eq(ownershipColumn, user.id)
        .order('score_date', { ascending: false })
        .limit(30),
  })
  const chartData = (recentScores || []).map((s) => ({ date: s.score_date, score: s.score }))
  const todayScore = chartData.find((entry) => entry.date === today)?.score ?? null
  const recent7 = chartData.slice(0, 7).reverse()

  const datePredicate = [
    `and(start_date.lte.${today},end_date.gte.${today})`,
    `and(end_date.lt.${today},completed.eq.false)`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
    `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
  ].join(',')

  const { data: rawTodayActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select(`
          id,
          completed,
          start_date,
          end_date,
          updated_at,
          goals (
            status
          )
        `)
        .eq(ownershipColumn, user.id)
        .or(datePredicate),
  })

  const todayActionPool = (rawTodayActions || []).filter((action) => {
    if (action.goals?.[0]?.status === 'archived') return false
    const actionDate = action.end_date || action.start_date || today
    if (!action.completed) {
      return actionDate <= today
    }
    if (!action.updated_at) return false
    const updatedDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(action.updated_at))
    return updatedDate === today
  })
  const incompleteActionsCount = todayActionPool.filter((action) => !action.completed).length

  const oneYearAgo = new Date()
  oneYearAgo.setDate(oneYearAgo.getDate() - 365)

  const { data: completedActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select('updated_at')
        .eq(ownershipColumn, user.id)
        .eq('completed', true)
        .gte('updated_at', oneYearAgo.toISOString()),
  })

  const heatmapData =
    completedActions?.reduce((acc, curr) => {
      const date = curr.updated_at?.split('T')[0]
      if (!date) return acc
      const existing = acc.find((d) => d.date === date)
      if (existing) {
        existing.count++
      } else {
        acc.push({ date, count: 1 })
      }
      return acc
    }, [] as { date: string; count: number }[]) || []

  const { data: actionsType } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select('type')
        .eq(ownershipColumn, user.id),
  })

  const typeCount =
    actionsType?.reduce((acc, curr) => {
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

  const currentXP = (profile as unknown as { xp?: number | null })?.xp || 0
  const currentLevel = (profile as unknown as { level?: number | null })?.level || 1
  const nextLevelXP = 100 * Math.pow(1.2, currentLevel - 1)
  const { data: lastLog } = await supabase
    .from('xp_logs')
    .select('amount, source')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const weeklyInsight = await getOrCreateWeeklyInsight({
    supabase,
    userId: user.id,
    locale,
  })

  const goalProgressList = (activeGoals || [])
    .map((g) => {
      const raw = g as unknown as { actions?: Array<{ completed?: boolean | null }> | null }
      const total = raw.actions?.length || 0
      const completed = raw.actions?.filter((a) => Boolean(a.completed)).length || 0
      const progress = calcCompletionPercent(completed, total)
      const remainingActions = Math.max(total - completed, 0)
      const timeProgress = calcTimeProgressPercent(
        (g.start_date as string | null | undefined) ?? null,
        (g.end_date as string | null | undefined) ?? null
      )
      const paceStatus = total <= 0 || timeProgress == null ? null : getPaceStatus(progress, timeProgress)

      return {
        id: g.id as string,
        title: g.title as string,
        totalActions: total,
        completedActions: completed,
        remainingActions,
        progress,
        paceStatus,
        priority: (g.priority as string | null | undefined) ?? 'medium',
        end_date: (g.end_date as string | undefined) ?? undefined,
        start_date: (g.start_date as string | undefined) ?? '',
      }
    })
    .sort((a, b) => {
      const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const pA = pMap[a.priority] || 2
      const pB = pMap[b.priority] || 2
      if (pA !== pB) return pB - pA

      if (a.end_date !== b.end_date) {
        if (!a.end_date) return 1
        if (!b.end_date) return -1
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      }

      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })

  const localeIsZh = locale === 'zh'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/40 bg-linear-to-br from-primary/5 via-background/80 to-background p-4 shadow-sm md:p-5">
        <DashboardWelcome
          dict={dict.dashboard.welcome}
          name={displayName}
          dailyQuotes={dailyQuotes}
          defaultQuoteIndex={0}
          quoteDateISO={quoteDateISO}
          locale={locale}
          avatarUrl={profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? null}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StreakCard
          dict={dict}
          streak={streakSnapshot.currentStreak}
          todayCompleted={streakSnapshot.completedToday}
          shieldBalance={streakSnapshot.shieldBalance}
          recoverableMissDate={streakSnapshot.recoverableMissDate}
          nextGrantAtStreak={streakSnapshot.nextShieldGrantRule.nextGrantAtStreak}
          className="h-full"
        />
        <LevelCard
          dict={dict}
          level={currentLevel}
          currentXP={currentXP}
          nextLevelXP={Math.floor(nextLevelXP)}
          lastLog={lastLog}
          className="h-full"
        />
        <ScoreCard
          dict={dict}
          today={today}
          recent7={recent7}
          currentScore={dailyScore}
          className="h-full"
        />
        <ScoreTrendChart
          data={chartData}
          title={localeIsZh ? '近 30 天自评趋势' : '30-day score trend'}
          description={localeIsZh ? '看见波动与改善，让行动更有方向。' : 'See the drift and the gains.'}
          scoreLabel={localeIsZh ? '自评' : 'Score'}
          className="h-full"
        />
      </div>

      {hasActiveGoals ? (
        <GoalProgressList dict={dict} goals={goalProgressList} />
      ) : null}

      <WeeklyInsightCard dict={dict.dashboard.planning} locale={locale} insight={weeklyInsight} />

      <div className="grid gap-4 md:grid-cols-2">
        <FocusDistributionChart dict={dict} data={distributionData} />
      </div>

      <ActivityHeatmap dict={dict} data={heatmapData} />
    </div>
  )
}
