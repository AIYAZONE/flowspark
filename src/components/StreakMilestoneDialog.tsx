'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type en from '@/i18n/en.json'
import { getPhaseRanges, type StreakPhaseKey } from '@/lib/streak-milestones'

type Dict = typeof en

const PHASE_ORDER: StreakPhaseKey[] = ['starter', 'steady', 'deepening', 'resilient', 'longrun', 'identity']

export function StreakMilestoneDialog(props: {
  dict: Dict
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPhaseKey: StreakPhaseKey
  nextPhaseKey: StreakPhaseKey
  currentStreak: number
  nextMilestone: number
  daysRemaining: number
}) {
  const {
    dict,
    open,
    onOpenChange,
    currentPhaseKey,
    nextPhaseKey,
    currentStreak,
    nextMilestone,
    daysRemaining,
  } = props

  const copy = dict.dashboard.streakMilestones
  const phaseRanges = getPhaseRanges()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-[560px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>{copy.dialogDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-card/60 p-4">
              <div className="text-xs text-muted-foreground">{copy.currentPhase}</div>
              <div className="mt-1 text-base font-semibold">{copy.phaseNames[currentPhaseKey]}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {copy.phaseDescriptions[currentPhaseKey]}
              </div>
            </div>
            <div className="rounded-lg border bg-card/60 p-4">
              <div className="text-xs text-muted-foreground">{copy.nextPhase}</div>
              <div className="mt-1 text-base font-semibold">{copy.phaseNames[nextPhaseKey]}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {copy.phaseGoal
                  .replace('{days}', String(nextMilestone))
                  .replace('{phase}', copy.phaseNames[nextPhaseKey])
                  .replace('{remaining}', String(daysRemaining))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card/60 p-4">
            <div className="text-xs text-muted-foreground">{copy.phaseProgress}</div>
            <div className="mt-1 text-sm font-medium">{currentStreak}</div>
          </div>

          <div className="rounded-lg border bg-card/60 p-4">
            <div className="text-sm font-medium">{copy.rewardsTitle}</div>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              <p>{copy.rewardsShield}</p>
              <p>{copy.rewardsIdentity}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card/60 p-4">
            <div className="text-sm font-medium">{copy.phasesTitle}</div>
            <div className="mt-3 space-y-3">
              {PHASE_ORDER.map((phaseKey) => {
                const isActive = phaseKey === currentPhaseKey
                const range = phaseRanges.find((r) => r.phaseKey === phaseKey)
                const rangeLabel = range
                  ? range.maxDay === null
                    ? `${range.minDay}+`
                    : `${range.minDay}–${range.maxDay}`
                  : null
                return (
                  <div
                    key={phaseKey}
                    className={`rounded-md border px-3 py-2 ${isActive ? 'border-orange-300/60 bg-orange-50/80 dark:border-orange-500/30 dark:bg-orange-950/30' : 'border-border/60'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{copy.phaseNames[phaseKey]}</div>
                      {rangeLabel ? (
                        <div className="text-xs text-muted-foreground">{rangeLabel} {dict.dashboard.days}</div>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">
                      {copy.phaseDescriptions[phaseKey]}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
