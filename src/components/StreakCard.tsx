'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { StreakRecoverDialog } from '@/components/StreakRecoverDialog'
import { logEvent } from '@/lib/analytics'
import { getStreakStatusCopy } from '@/lib/streak-ui'
import type en from '@/i18n/en.json'

type Dict = typeof en

export function StreakCard({
  dict,
  streak = 0,
  nextMilestone = 10,
  shieldBalance = 0,
  recoverableMissDate = null,
  nextGrantAtStreak = 3,
}: {
  dict: Dict
  streak?: number
  nextMilestone?: number
  shieldBalance?: number
  recoverableMissDate?: string | null
  nextGrantAtStreak?: number
}) {
  const progress = Math.min(1, streak / nextMilestone)
  const remaining = Math.max(0, nextMilestone - streak)
  const milestones = [1, 3, 7, 10, 30]
  const [recoverOpen, setRecoverOpen] = useState(false)
  const isZh = String(dict.common.locale || '').toLowerCase().startsWith('zh')

  useEffect(() => {
    if (!recoverableMissDate) return
    logEvent('streak_recovery_offer_exposed', {
      source: 'dashboard',
      shield_balance: shieldBalance,
      recoverable_days: 1,
    })
  }, [recoverableMissDate, shieldBalance])

  const statusCopy = useMemo(() => {
    return getStreakStatusCopy({
      locale: isZh ? 'zh' : 'en',
      streak,
      shieldBalance,
      recoverableMissDate,
      nextGrantAtStreak,
    })
  }, [isZh, nextGrantAtStreak, recoverableMissDate, shieldBalance, streak])

  const milestoneCopy = useMemo(() => {
    if (remaining <= 0) {
      return isZh ? '🎉 已达成当前里程碑' : '🎉 Milestone reached'
    }
    if (isZh) {
      return `下一里程碑：${nextMilestone} 天（剩余 ${remaining} 天）`
    }
    return `Next milestone: ${nextMilestone} days (${remaining} day${remaining === 1 ? '' : 's'} left)`
  }, [isZh, nextMilestone, remaining])

  return (
    <div className="rounded-lg border overflow-hidden">
      <StreakRecoverDialog
        dict={dict}
        open={recoverOpen}
        onOpenChange={setRecoverOpen}
        recoverableMissDate={recoverableMissDate}
        shieldBalance={shieldBalance}
      />
      <div className="relative bg-linear-to-br from-orange-50 to-transparent p-4 dark:from-orange-950/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-sm text-muted-foreground">{dict.dashboard.currentStreak}</div>
              <div className="text-3xl font-bold">{streak} <span className="text-base font-medium">{dict.dashboard.days}</span></div>
            </div>
          </div>
          <div>
            <div className="rounded-full border border-orange-300/60 bg-white/80 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm dark:border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-300">
              {isZh ? `护盾 ${shieldBalance}` : `Shields ${shieldBalance}`}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-1">
          {milestoneCopy}
        </div>
        <div className="h-2 w-full bg-muted rounded">
          <div className="h-2 bg-orange-400 rounded" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-3 rounded-md border border-orange-200/60 bg-orange-50/70 px-3 py-2 text-[11px] leading-5 text-muted-foreground dark:border-orange-500/20 dark:bg-orange-950/20">
          {dict.dashboard.streakRule}
        </div>
        <div className="mt-3 rounded-md border border-border/60 bg-card px-3 py-3">
          <div className="text-sm font-medium">{statusCopy.title}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{statusCopy.body}</div>
          {statusCopy.action ? (
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  logEvent('streak_recovery_click', {
                    source: 'dashboard',
                    target_date: recoverableMissDate,
                  })
                  setRecoverOpen(true)
                }}
              >
                {statusCopy.action}
              </Button>
            </div>
          ) : null}
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
                title={isZh ? `里程碑：${m} 天` : `Milestone: ${m} days`}
              >
                {m} {dict.dashboard.days}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
