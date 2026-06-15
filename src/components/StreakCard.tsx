'use client'

import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StreakRecoverDialog } from '@/components/StreakRecoverDialog'
import { StreakMilestoneDialog } from '@/components/StreakMilestoneDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { logEvent } from '@/lib/analytics'
import { getNextPhaseTarget, getStreakMilestoneSummary } from '@/lib/streak-milestones'
import { getShieldBadgeAction, getShieldBadgeDialogCopy, getStreakStatusCopy } from '@/lib/streak-ui'
import type en from '@/i18n/en.json'

type Dict = typeof en

export function StreakCard({
  dict,
  streak = 0,
  todayCompleted = false,
  shieldBalance = 0,
  recoverableMissDate = null,
  nextGrantAtStreak = 3,
}: {
  dict: Dict
  streak?: number
  todayCompleted?: boolean
  shieldBalance?: number
  recoverableMissDate?: string | null
  nextGrantAtStreak?: number
}) {
  const milestoneSummary = useMemo(() => getStreakMilestoneSummary(streak), [streak])
  const progress = milestoneSummary.progressPercent / 100
  const remaining = milestoneSummary.daysRemaining
  const milestones = milestoneSummary.milestones
  const currentPhaseKey = milestoneSummary.currentPhaseKey
  const nextPhaseTarget = useMemo(() => getNextPhaseTarget(streak), [streak])
  const nextPhaseKey = nextPhaseTarget?.phaseKey ?? currentPhaseKey
  const [recoverOpen, setRecoverOpen] = useState(false)
  const [shieldRulesOpen, setShieldRulesOpen] = useState(false)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const isZh = String(dict.common.locale || '').toLowerCase().startsWith('zh')
  const milestoneDict = dict.dashboard.streakMilestones

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
      todayCompleted,
      shieldBalance,
      recoverableMissDate,
      nextGrantAtStreak,
    })
  }, [isZh, nextGrantAtStreak, recoverableMissDate, shieldBalance, streak, todayCompleted])

  const milestoneCopy = useMemo(() => {
    return milestoneDict.phaseGoalShort
      .replace('{days}', String(milestoneSummary.nextMilestone))
      .replace('{remaining}', String(remaining))
  }, [milestoneDict, milestoneSummary.nextMilestone, remaining])

  const shieldBadgeAction = useMemo(() => (
    getShieldBadgeAction({
      shieldBalance,
      recoverableMissDate,
    })
  ), [recoverableMissDate, shieldBalance])

  const shieldBadgeDialogCopy = useMemo(() => (
    getShieldBadgeDialogCopy({
      locale: isZh ? 'zh' : 'en',
      shieldBalance,
      nextGrantAtStreak,
    })
  ), [isZh, nextGrantAtStreak, shieldBalance])

  return (
    <div className="rounded-lg border overflow-hidden">
      <StreakRecoverDialog
        dict={dict}
        open={recoverOpen}
        onOpenChange={setRecoverOpen}
        recoverableMissDate={recoverableMissDate}
        shieldBalance={shieldBalance}
      />
      <StreakMilestoneDialog
        dict={dict}
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        currentPhaseKey={currentPhaseKey}
        nextPhaseKey={nextPhaseKey}
        currentStreak={streak}
        nextMilestone={nextPhaseTarget?.atStreak ?? milestoneSummary.nextMilestone}
        daysRemaining={Math.max(0, (nextPhaseTarget?.atStreak ?? milestoneSummary.nextMilestone) - streak)}
      />
      <Dialog open={shieldRulesOpen} onOpenChange={setShieldRulesOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{shieldBadgeDialogCopy.title}</DialogTitle>
            <DialogDescription>{shieldBadgeDialogCopy.body}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border bg-card/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isZh ? '当前护盾' : 'Current shields'}</span>
              <span className="font-medium">{shieldBalance}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isZh ? '下一次护盾' : 'Next shield at'}</span>
              <span className="font-medium">
                {isZh ? `${nextGrantAtStreak} 天连续` : `${nextGrantAtStreak}-day streak`}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
            <button
              type="button"
              className="rounded-full border border-orange-300/60 bg-white/80 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 dark:border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/60"
              onClick={() => {
                logEvent('shield_badge_click', {
                  source: 'dashboard',
                  action: shieldBadgeAction,
                  shield_balance: shieldBalance,
                  recoverable_days: recoverableMissDate ? 1 : 0,
                })

                if (shieldBadgeAction === 'recover') {
                  setRecoverOpen(true)
                  return
                }

                setShieldRulesOpen(true)
              }}
              aria-label={isZh ? '打开护盾说明' : 'Open shield details'}
            >
              {isZh ? `护盾 ${shieldBalance}` : `Shields ${shieldBalance}`}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <div className="text-muted-foreground">
              {milestoneDict.currentPhase}
            </div>
            <div className="mt-0.5 text-sm font-medium text-foreground">
              {milestoneDict.phaseNames[currentPhaseKey]}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
            onClick={() => setMilestoneDialogOpen(true)}
          >
            <Info className="h-3.5 w-3.5" />
            {milestoneDict.learnMore}
          </Button>
        </div>
        <div className="mb-1 text-xs text-muted-foreground">
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
            const isTarget = m === milestoneSummary.nextMilestone
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
