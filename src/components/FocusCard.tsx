'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Circle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { calcCompletionPercent } from '@/lib/progress'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'

interface FlowDict {
  title: string
  progress: string
  nextAction: string
  enterFlow: string
  allDone: string
  badgeAllDone: string
}

interface FocusCardProps {
  dict: FlowDict
  totalActions: number
  completedActions: number
  nextActionTitle?: string
  locale?: 'zh' | 'en'
  continuityPriority?: {
    enabled: boolean
    href: string
    actionTitle?: string
  }
  className?: string
}

export function FocusCard({
  dict,
  totalActions,
  completedActions,
  nextActionTitle,
  locale = 'en',
  continuityPriority,
  className
}: FocusCardProps) {
  const isAllDone = completedActions === totalActions && totalActions > 0
  const progressPercent = calcCompletionPercent(completedActions, totalActions)
  const showContinuityPriority = Boolean(continuityPriority?.enabled && continuityPriority.href)
  const continuityTitle = locale === 'zh' ? '今天先保连续' : 'Protect continuity first'
  const continuityBody = continuityPriority?.actionTitle
    ? (
      locale === 'zh'
        ? `优先把「${continuityPriority.actionTitle}」降到 5 分钟可完成版本，再考虑做更多。`
        : `Shrink "${continuityPriority.actionTitle}" into a 5-minute version before trying to do more.`
    )
    : (
      locale === 'zh'
        ? '今天先完成一个最小版本，保住连续性，再决定要不要继续推进。'
        : 'Start with one minimum version today, protect the streak, then decide whether to do more.'
    )
  const primaryHref = showContinuityPriority ? continuityPriority?.href || '/today' : '/today'
  const primaryLabel = showContinuityPriority
    ? (locale === 'zh' ? '去保连续' : 'Open 5-min rescue')
    : dict.enterFlow

  function handlePrimaryClick() {
    if (!showContinuityPriority) return
    const payload = {
      source: 'dashboard',
      scene: 'rescue',
      action_title: continuityPriority?.actionTitle || null,
      target: 'rescue',
    }
    logEvent('continuity_priority_cta_click', payload)
    sendAIFeedback('continuity_priority_cta_click', payload)
  }

  return (
    <Card className={`relative overflow-hidden border-primary/20 bg-linear-to-br from-background to-primary/5 ${className}`}>
      <CardContent className="p-6 sm:p-8">
        {showContinuityPriority ? (
          <div className="mb-5 rounded-2xl border border-orange-200/60 bg-orange-50/80 p-4 dark:border-orange-500/20 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-orange-500/10 p-2 text-orange-600 dark:text-orange-300">
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{continuityTitle}</div>
                <div className="mt-1 text-sm text-muted-foreground">{continuityBody}</div>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          <div className="space-y-4 flex-1 min-w-0">
            <div>
              <h3 className="text-lg font-medium text-muted-foreground mb-1">
                {dict.title}
              </h3>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold tracking-tight">
                  {completedActions} <span className="text-muted-foreground/50">/ {totalActions}</span>
                </div>
                {isAllDone && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {dict.badgeAllDone}
                  </span>
                )}
              </div>
            </div>

            <div className="relative pt-2">
              <div className="flex items-center gap-2 mb-2 min-w-0">
                {isAllDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-primary animate-pulse" />
                )}
                <span className="font-medium text-lg flex-1 min-w-0 line-clamp-2 sm:line-clamp-1">
                  {isAllDone
                    ? dict.allDone
                    : dict.nextAction.replace('{action}', nextActionTitle || '...')}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-auto">
            <Link href={primaryHref}>
              <Button size="lg" className="w-full rounded-full shadow-lg shadow-primary/20 h-12 px-8 text-base" onClick={handlePrimaryClick}>
                {primaryLabel} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
