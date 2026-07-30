import { cn } from '@/lib/utils'
import { getUrgencyProgressColor } from '@/lib/progress'

function barColor(status: string, daysLeft: number | null): string {
  if (status === 'completed') return 'bg-emerald-500'
  if (status === 'abandoned' || status === 'archived') return 'bg-zinc-400'
  return getUrgencyProgressColor(daysLeft)
}

interface GoalProgressProps {
  percent: number
  daysLeft: number | null
  status: string
}

export function GoalProgress({ percent, daysLeft, status }: GoalProgressProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          barColor(status, daysLeft),
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
