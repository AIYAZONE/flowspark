import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Target } from 'lucide-react'
import Link from 'next/link'
import { calcDaysLeft, getUrgencyProgressColor } from '@/lib/progress'

interface GoalProgress {
  id: string
  title: string
  completedActions: number
  totalActions: number
  progress: number
  end_date?: string
}

interface GoalProgressListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  goals: GoalProgress[]
}

export function GoalProgressList({ dict, goals }: GoalProgressListProps) {
  const getDaysLeftLabel = (daysLeft: number | null) => {
    if (daysLeft == null) return null
    if (daysLeft < 0) return dict.dashboard.goals.overdue || 'Overdue'
    return (dict.dashboard.goals.daysLeft || '{days} days left').replace('{days}', daysLeft.toString())
  }

  return (
    <Card className="col-span-1 shadow-sm border-border/60 md:pb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {dict.dashboard.goals.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{dict.dashboard.goals.progressTip}</p>
        </div>
        <Link
          href="/goals"
          className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          {dict.dashboard.goals.viewAll} <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-6 overflow-y-auto custom-scrollbar max-h-none md:max-h-[400px] md:pb-6">
        {goals.length === 0 ? (
          <div className="text-center py-8 px-4 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center gap-2">
            <span>{dict.dashboard.goals.noGoals || "No active goals to focus on."}</span>
            <Link href="/goals" className="text-primary hover:underline font-medium text-xs">
              {dict.dashboard.goals.viewAll || "Go to Goals Library"}
            </Link>
          </div>
        ) : (
          goals.map((goal) => (
            (() => {
              const daysLeftValue = calcDaysLeft(goal.end_date)
              const daysLeftLabel = getDaysLeftLabel(daysLeftValue)
              return (
            <Link
              key={goal.id}
              href={`/goals/${goal.id}`}
              className="block rounded-xl p-3 -m-3 group hover:bg-muted/30 hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              aria-label={`${dict.dashboard.goals.title}: ${goal.title}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between text-sm gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-semibold truncate text-foreground group-hover:text-foreground">{goal.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{goal.completedActions} / {goal.totalActions} {dict.dashboard.goals.actions}</span>
                      {goal.end_date && (
                        <>
                          <span className="w-0.5 h-0.5 bg-muted-foreground/50 rounded-full" />
                          <span className={daysLeftValue != null && daysLeftValue < 0 ? 'text-destructive font-medium' : ''}>
                            {daysLeftLabel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-[45px]">
                    <span className="text-sm font-bold font-mono text-foreground">
                      {Math.round(goal.progress)}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out rounded-full ${getUrgencyProgressColor(daysLeftValue)}`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            </Link>
              )
            })()
          ))
        )}
      </CardContent>
    </Card>
  )
}
