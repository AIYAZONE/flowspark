import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { getStreakSnapshot } from '@/lib/streaks'
import { getUserTimezone, getTodayInTZ } from '@/lib/time'
import { ScoreCard } from '@/components/ScoreCard'
import { StreakCard } from '@/components/StreakCard'
import { GoalProgressList } from '@/components/GoalProgressList'
import { calcCompletionPercent, calcTimeProgressPercent, getPaceStatus } from '@/lib/progress'
import { getDailyQuoteCandidates, DAILY_QUOTE_CANDIDATE_COUNT, QUOTE_TIME_ZONE } from '@/lib/daily-quote'
import { DashboardWelcome } from '@/components/DashboardWelcome'

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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, avatar_url')
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

      {hasActiveGoals ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StreakCard
              dict={dict}
              streak={streakSnapshot.currentStreak}
              todayCompleted={streakSnapshot.completedToday}
              shieldBalance={streakSnapshot.shieldBalance}
              recoverableMissDate={streakSnapshot.recoverableMissDate}
              nextGrantAtStreak={streakSnapshot.nextShieldGrantRule.nextGrantAtStreak}
            />
          </div>
          <ScoreCard dict={dict} today={today} recent7={[]} currentScore={dailyScore} className="h-full" />
        </section>
      ) : null}

      {hasActiveGoals ? (
        <GoalProgressList dict={dict} goals={goalProgressList} />
      ) : null}
    </div>
  )
}
