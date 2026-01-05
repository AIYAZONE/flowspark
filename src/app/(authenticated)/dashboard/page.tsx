import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { CheckCircle2, Circle, Flame } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScoreTrendChart } from '@/components/ScoreTrendChart'
import { SetCoreActionSheet } from '@/components/SetCoreActionSheet'
import { toggleAction, submitScore } from './actions'
import { getDictionary } from '@/i18n/get-dictionary'
import { ActionListCompact } from '@/components/ActionListCompact'
import { ScoreCard } from '@/components/ScoreCard'
import { StreakCard } from '@/components/StreakCard'
import { getUserTimezone, getTodayInTZ } from '@/lib/time'

export default async function DashboardPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  // Calculate yesterday to ensure we cover timezones where 'today' starts earlier than UTC
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // Fetch today's core action
  const { data: rawActions } = await supabase
    .from('actions')
    .select('*')
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

  // Filter actions in JS to accurately handle timezone "today"
  const actions = rawActions?.filter(action => {
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

  // Fetch active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*, actions(count)')
    .eq('status', 'active')
    .eq('user_id', user.id)

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

  // Simple streak calculation
  let streak = 0
  if (recentScores && recentScores.length > 0) {
    // Check if today or yesterday has a score
    const latestScoreDate = recentScores[0].score_date
    const todayDate = new Date(today)
    const latestDate = new Date(latestScoreDate)
    const diffDays = differenceInDays(todayDate, latestDate)

    if (diffDays <= 1) {
      streak = 1
      for (let i = 1; i < recentScores.length; i++) {
        const prevDate = new Date(recentScores[i - 1].score_date)
        const currDate = new Date(recentScores[i].score_date)
        if (differenceInDays(prevDate, currDate) === 1) {
          streak++
        } else {
          break
        }
      }
    }
  }

  const chartData = recentScores?.map(s => ({ date: s.score_date, score: s.score })) || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{dict.dashboard.title}</h1>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Core Action Card */}
        <Card className="col-span-1 sm:col-span-2 relative overflow-hidden bg-primary/5 border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent pointer-events-none dark:from-emerald-950/30" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{dict.dashboard.todayCoreAction}</CardTitle>
              <span className={`text-xs rounded-full px-2 py-0.5 ${((actions?.filter(a => !a.completed).length ?? 0) > 0)
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
                }`}>
                {(actions?.filter(a => !a.completed).length ?? 0)} / {(actions?.length ?? 0)}
              </span>
            </div>
            <div className="mt-2 h-1 bg-primary/10 rounded">
              <div
                className="h-1 bg-primary rounded transition-all shadow-sm shadow-primary/20"
                style={{
                  width: `${(actions && actions.length > 0)
                    ? Math.round(((actions.length - (actions.filter(a => !a.completed).length)) / actions.length) * 100)
                    : 0}%`
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {actions && actions.length > 0 ? (
              <ActionListCompact actions={actions || []} dict={dict} today={today} showInProgressBadge={false} />
            ) : (
              <div className="text-muted-foreground">
                {dict.dashboard.noCoreAction}
                <SetCoreActionSheet goals={goals || []} dict={dict} defaultDate={today} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Score Card */}
        <ScoreCard dict={dict} today={today} recent7={chartData.slice(0, 7)} currentScore={dailyScore ?? null} />

        {/* Streak Card */}
        <StreakCard dict={dict} streak={streak} nextMilestone={10} recent7={chartData.slice(-7)} />

        {/* Trend Chart */}
        <ScoreTrendChart data={chartData} title={dict.dashboard.recentTrend} scoreLabel={dict.dashboard.submitScore} />
      </div>

      {/* Active Goals Progress */}
      <h2 className="text-xl font-semibold mt-8 mb-4">{dict.dashboard.activeGoals}</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {goals?.map((goal) => {
          const startDate = new Date(goal.start_date)
          const endDate = new Date(goal.end_date)
          const now = new Date()
          const totalDuration = Math.max(1, differenceInDays(endDate, startDate))
          const elapsed = differenceInDays(now, startDate)
          const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))

          return (
            <Link key={goal.id} href={`/goals/${goal.id}`} className="block h-full">
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{goal.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2 line-clamp-2 min-h-[40px]">
                    {goal.description || dict.common.noDescription}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{dict.common.timeProgress}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{dict.goals.start}: {format(startDate, 'MMM d')}</span>
                    <span>{dict.goals.end}: {format(endDate, 'MMM d')}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {goals?.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground bg-white rounded-lg border border-dashed">
            {dict.goals.noGoals} <Button variant="link">{dict.goals.createFirst}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
