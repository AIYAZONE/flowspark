import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Target } from 'lucide-react'
import Link from 'next/link'
import { calcDaysLeft, getUrgencyProgressColor, type PaceStatus } from '@/lib/progress'

interface GoalProgress {
  id: string
  title: string
  completedActions: number
  totalActions: number
  remainingActions: number
  progress: number
  paceStatus?: PaceStatus | null
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

  const getRemainingLabel = (remainingActions: number, totalActions: number) => {
    if (totalActions <= 0) return dict.dashboard.goals.needsBreakdown || 'Needs breakdown'
    return (dict.dashboard.goals.remaining || 'Remaining {count}').replace('{count}', remainingActions.toString())
  }

  const getPaceLabel = (paceStatus: PaceStatus) => {
    if (paceStatus === 'ahead') return dict.dashboard.goals.paceAhead || 'Ahead'
    if (paceStatus === 'behind') return dict.dashboard.goals.paceBehind || 'Behind'
    return dict.dashboard.goals.paceOnTrack || 'On track'
  }

  const getPaceBadgeClassName = (paceStatus: PaceStatus) => {
    if (paceStatus === 'ahead') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (paceStatus === 'behind') return 'border-rose-200 bg-rose-50 text-rose-700'
    return 'border-border/60 bg-background/60 text-muted-foreground'
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
              const remainingLabel = getRemainingLabel(goal.remainingActions, goal.totalActions)
              const paceLabel = goal.paceStatus ? getPaceLabel(goal.paceStatus) : null
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
                      <span className={goal.totalActions > 0 ? 'font-medium text-foreground/90' : ''}>
                        {remainingLabel}
                      </span>
                      {goal.totalActions > 0 && (
                        <>
                          <span className="w-0.5 h-0.5 bg-muted-foreground/50 rounded-full" />
                          <span>{goal.completedActions} / {goal.totalActions} {dict.dashboard.goals.actions}</span>
                        </>
                      )}
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
                  <div className="text-right shrink-0 w-[72px] flex flex-col items-end gap-0.5">
                    <span className="text-sm font-bold font-mono text-foreground">
                      {goal.totalActions > 0 ? `${Math.round(goal.progress)}%` : '—'}
                    </span>
                    {paceLabel && goal.paceStatus ? (
                      <span
                        className={`inline-flex items-center justify-end rounded-full border px-2 py-0.5 text-[10px] leading-none ${getPaceBadgeClassName(goal.paceStatus)}`}
                      >
                        {paceLabel}
                      </span>
                    ) : null}
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
