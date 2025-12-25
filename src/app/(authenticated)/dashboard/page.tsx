import { format, differenceInDays } from 'date-fns'
import { CheckCircle2, Circle, Flame } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScoreTrendChart } from '@/components/ScoreTrendChart'
import { toggleAction, submitScore } from './actions'
import { getDictionary } from '@/i18n/get-dictionary'

export default async function DashboardPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's core action
  const { data: actions } = await supabase
    .from('actions')
    .select('*')
    .eq('action_date', today)
    .eq('type', 'core')
    .limit(1)

  const coreAction = actions?.[0]

  // Fetch daily score
  const { data: scores } = await supabase
    .from('daily_scores')
    .select('score')
    .eq('score_date', today)
    .maybeSingle()

  const dailyScore = scores?.score

  // Fetch active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*, actions(count)')
    .eq('status', 'active')

  // Fetch recent scores for trend and streak
  const { data: recentScores } = await supabase
    .from('daily_scores')
    .select('score_date, score')
    .order('score_date', { ascending: false })
    .limit(30)

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

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Core Action Card */}
        <Card className="col-span-1 sm:col-span-2 bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-primary">{dict.dashboard.todayCoreAction}</CardTitle>
          </CardHeader>
          <CardContent>
            {coreAction ? (
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-foreground">{coreAction.title}</span>
                <form action={toggleAction}>
                  <input type="hidden" name="id" value={coreAction.id} />
                  <input type="hidden" name="completed" value={coreAction.completed ? 'true' : 'false'} />
                  <Button
                    size="icon"
                    variant={coreAction.completed ? "default" : "outline"}
                    className={coreAction.completed ? "bg-primary hover:bg-primary/90" : "border-primary text-primary hover:bg-primary/10"}
                  >
                    {coreAction.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-muted-foreground">
                {dict.dashboard.noCoreAction}
                <Button variant="link" className="px-0 text-primary underline">{dict.dashboard.setCoreAction}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Score Card */}
        <Card className="overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none dark:from-blue-950/20" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.dashboard.dailyScore}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {dailyScore !== undefined ? dailyScore : '-'}
              </span>
              <span className="text-muted-foreground font-medium text-lg">/ 5</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <form key={score} action={submitScore} className="flex-1">
                  <input type="hidden" name="score" value={score} />
                  <input type="hidden" name="date" value={today} />
                  <Button
                    type="submit"
                    variant={dailyScore === score ? "default" : "outline"}
                    className={cn(
                      "w-full h-10 p-0 rounded-xl transition-all duration-200",
                      dailyScore === score
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 font-bold"
                        : "hover:bg-primary/5 hover:text-primary hover:border-primary/30 text-muted-foreground font-medium"
                    )}
                  >
                    {score}
                  </Button>
                </form>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="overflow-hidden relative shadow-sm hover:shadow-md transition-shadow border-orange-200/40 dark:border-orange-900/40">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent pointer-events-none dark:from-orange-950/20" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.dashboard.currentStreak}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100/80 dark:bg-orange-900/30 rounded-full ring-4 ring-orange-50 dark:ring-orange-900/10">
                <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground">{streak}</span>
                  <span className="text-sm font-medium text-muted-foreground">{dict.dashboard.days}</span>
                </div>
                <p className="text-xs text-muted-foreground/80 mt-1 font-medium">{dict.dashboard.keepMomentum}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <ScoreTrendChart data={chartData} title={dict.dashboard.recentTrend} />
      </div>

      {/* Active Goals Progress */}
      <h2 className="text-xl font-semibold mt-8 mb-4">{dict.dashboard.activeGoals}</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {goals?.map((goal) => {
          const startDate = new Date(goal.start_date)
          const endDate = new Date(goal.end_date)
          const now = new Date()
          const totalDuration = differenceInDays(endDate, startDate)
          const elapsed = differenceInDays(now, startDate)
          const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))

          return (
            <Card key={goal.id}>
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
