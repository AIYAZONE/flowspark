'use client'

import type en from '@/i18n/en.json'

type Dict = typeof en

export function StreakCard({
  dict,
  streak = 0,
  nextMilestone = 10,
  recent7 = []
}: {
  dict: Dict
  streak?: number
  nextMilestone?: number
  recent7?: { date: string; score: number }[]
}) {
  const progress = Math.min(1, streak / nextMilestone)
  const remaining = Math.max(0, nextMilestone - streak)
  const milestones = [1, 3, 7, 10, 30]

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="relative p-4 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-950/30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-sm text-muted-foreground">{dict.dashboard.currentStreak}</div>
            <div className="text-3xl font-bold">{streak} <span className="text-base font-medium">{dict.dashboard.days}</span></div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-1">
          {remaining > 0 ? `下一里程碑：${nextMilestone} 天（剩余 ${remaining} 天）` : '🎉 已达成当前里程碑'}
        </div>
        <div className="h-2 w-full bg-muted rounded">
          <div className="h-2 bg-orange-400 rounded" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Trend removed to avoid duplication with ScoreCard */}
        <div className="mt-3 flex flex-wrap gap-1">
          {milestones.map(m => {
            const reached = streak >= m
            const isTarget = m === nextMilestone
            return (
              <span
                key={m}
                className={`text-[11px] px-2 py-0.5 rounded-full border ${reached ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-muted text-muted-foreground border-border/40'} ${isTarget ? 'ring-2 ring-orange-300' : ''}`}
                title={`里程碑：${m} 天`}
              >
                {m} 天
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
