import { format, differenceInDays } from 'date-fns'
import { CheckCircle2, Circle, Flame } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Core Action Card */}
        <Card className="col-span-2 bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-green-900">{dict.dashboard.todayCoreAction}</CardTitle>
          </CardHeader>
          <CardContent>
            {coreAction ? (
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-green-800">{coreAction.title}</span>
                <form action={toggleAction}>
                  <input type="hidden" name="id" value={coreAction.id} />
                  <input type="hidden" name="completed" value={coreAction.completed ? 'true' : 'false'} />
                  <Button
                    size="icon"
                    variant={coreAction.completed ? "default" : "outline"}
                    className={coreAction.completed ? "bg-green-600 hover:bg-green-700" : "border-green-600 text-green-600 hover:bg-green-100"}
                  >
                    {coreAction.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-green-700">
                {dict.dashboard.noCoreAction}
                <Button variant="link" className="px-0 text-green-800 underline">{dict.dashboard.setCoreAction}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.dashboard.dailyScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyScore !== undefined ? dailyScore : '-'} / 5
            </div>
            <div className="mt-4 flex justify-between">
              {[1, 2, 3, 4, 5].map((score) => (
                <form key={score} action={submitScore}>
                  <input type="hidden" name="score" value={score} />
                  <input type="hidden" name="date" value={today} />
                  <Button
                    type="submit"
                    variant={dailyScore === score ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    {score}
                  </Button>
                </form>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.dashboard.currentStreak}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-8 w-8 text-orange-500" />
              <div className="text-2xl font-bold">{streak} {dict.dashboard.days}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{dict.dashboard.keepMomentum}</p>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <ScoreTrendChart data={chartData} title={dict.dashboard.recentTrend} />
      </div>

      {/* Active Goals Progress */}
      <h2 className="text-xl font-semibold mt-8 mb-4">{dict.dashboard.activeGoals}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
