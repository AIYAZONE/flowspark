'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { recoverYesterdayStreakWithShield } from '@/app/(authenticated)/today/actions'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'
import { buildStreakFeedback } from '@/lib/streak-feedback'
import { pushStreakFeedback } from '@/components/StreakFeedbackBanner'
import type en from '@/i18n/en.json'

type Dict = typeof en

export function StreakRecoverDialog(props: {
  dict: Dict
  open: boolean
  onOpenChange: (open: boolean) => void
  recoverableMissDate: string | null
  shieldBalance: number
}) {
  const { dict, open, onOpenChange, recoverableMissDate, shieldBalance } = props
  const isZh = String(dict.common.locale || '').toLowerCase().startsWith('zh')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorText, setErrorText] = useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isZh ? '恢复昨天的连续天数' : 'Recover Yesterday streak'}</DialogTitle>
          <DialogDescription>
            {isZh
              ? '仅支持补回昨天，且每次会消耗 1 个护盾。恢复本身不会额外奖励 XP。'
              : 'You can only recover yesterday. Each recovery consumes 1 shield and does not grant extra XP.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-card/60 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{isZh ? '目标日期' : 'Target date'}</span>
            <span className="font-medium">{recoverableMissDate || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{isZh ? '当前护盾' : 'Current shields'}</span>
            <span className="font-medium">{shieldBalance}</span>
          </div>
          {errorText ? (
            <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {errorText}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {isZh ? '取消' : 'Cancel'}
          </Button>
          <Button
            type="button"
            disabled={isPending || !recoverableMissDate || shieldBalance <= 0}
            onClick={() => {
              setErrorText(null)
              startTransition(() => {
                void (async () => {
                  try {
                    const result = await recoverYesterdayStreakWithShield()
                    const successPayload = {
                      source: 'dashboard',
                      scene: 'rescue',
                      target_date: result.targetDate,
                      shield_balance_after: result.shieldBalanceAfter,
                    }
                    logEvent('streak_recovery_success', successPayload)
                    sendAIFeedback('streak_recovery_success', successPayload)
                    pushStreakFeedback(
                      buildStreakFeedback({
                        kind: 'recovery_success',
                        targetDate: result.targetDate,
                        currentStreak: result.currentStreak,
                      })
                    )
                    if (result.milestoneReached) {
                      pushStreakFeedback(
                        buildStreakFeedback({
                          kind: 'milestone_reached',
                          milestone: result.milestoneReached.milestone,
                          phaseKey: result.milestoneReached.phaseKey,
                        })
                      )
                    }
                    onOpenChange(false)
                    router.refresh()
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'unknown_error'
                    const blockedPayload = {
                      reason: message,
                      source: 'dashboard',
                      scene: 'rescue',
                    }
                    logEvent('streak_recovery_blocked', blockedPayload)
                    sendAIFeedback('streak_recovery_blocked', blockedPayload)
                    setErrorText(
                      isZh
                        ? '恢复失败，请刷新页面后重试。'
                        : 'Recovery failed. Refresh the page and try again.'
                    )
                  }
                })()
              })
            }}
          >
            {isPending
              ? (isZh ? '恢复中...' : 'Recovering...')
              : (isZh ? '消耗 1 个护盾恢复' : 'Use 1 shield to recover')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
