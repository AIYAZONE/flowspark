'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'

import type en from '@/i18n/en.json'
import { cn } from '@/lib/utils'
import {
  buildTomorrowHandoffExposureDedupeKey,
  buildTomorrowHandoffStorageKey,
  readTomorrowHandoffState,
  type TomorrowHandoffCandidate,
  writeTomorrowHandoffClicked,
  writeTomorrowHandoffDismissed,
} from '@/lib/tomorrow-handoff'
import { emitTomorrowHandoffEvent } from '@/lib/tomorrow-handoff-client'

type Dict = typeof en

export function TomorrowHandoffCard(props: {
  dict: Dict
  userId: string
  todayDateBucket: string
  candidate: TomorrowHandoffCandidate
  targetActionId: string | null
  canFallbackToTodayPlan: boolean
  className?: string
}) {
  const [visible, setVisible] = useState(false)

  const storageKey = useMemo(() => buildTomorrowHandoffStorageKey({
    userId: props.userId,
    dateBucket: props.todayDateBucket,
    recommendationId: props.candidate.recommendationId,
  }), [props.candidate.recommendationId, props.todayDateBucket, props.userId])

  const href = props.targetActionId
    ? `/today?action=${props.targetActionId}#today-actions`
    : '/today#today-ai-plan'

  const target = props.targetActionId ? 'existing_action' : 'today_plan'
  const payload = useMemo(() => ({
    source: 'today',
    scene: 'tomorrow_handoff',
    entry: 'yesterday_completion',
    recommendation_id: props.candidate.recommendationId,
    goal_id: props.candidate.goalId,
    target_action_id: props.targetActionId,
    target,
  }), [props.candidate.goalId, props.candidate.recommendationId, props.targetActionId, target])

  useEffect(() => {
    const state = readTomorrowHandoffState(storageKey)
    setVisible(!state.dismissed)
  }, [storageKey])

  useEffect(() => {
    if (!visible) return

    emitTomorrowHandoffEvent({
      name: 'ai_tomorrow_handoff_exposed',
      payload,
      dedupeKey: buildTomorrowHandoffExposureDedupeKey({
        userId: props.userId,
        dateBucket: props.todayDateBucket,
        recommendationId: props.candidate.recommendationId,
        targetActionId: props.targetActionId,
      }),
    })
  }, [
    payload,
    props.candidate.recommendationId,
    props.targetActionId,
    props.todayDateBucket,
    props.userId,
    visible,
  ])

  if (!visible || (!props.targetActionId && !props.canFallbackToTodayPlan)) {
    return null
  }

  const title = props.dict.today.tomorrowHandoffTitle || '昨天你完成了 AI 核心行动'
  const body = props.dict.today.tomorrowHandoffBody || '今天继续下一步，会更容易保持节奏。'
  const cta = props.dict.today.tomorrowHandoffCTA || '继续明日第一步'
  const dismissLabel = props.dict.today.tomorrowHandoffDismiss || '先不显示'

  return (
    <div className={cn(
      'rounded-2xl border border-primary/20 bg-linear-to-br from-primary/8 via-card to-card p-4 shadow-sm',
      props.className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{body}</div>
            <div className="mt-2 rounded-lg bg-background/70 px-3 py-2 text-sm">
              {props.candidate.title}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            writeTomorrowHandoffDismissed(storageKey)
            emitTomorrowHandoffEvent({
              name: 'ai_tomorrow_handoff_dismiss',
              payload,
            })
            setVisible(false)
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={dismissLabel}
          title={dismissLabel}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            writeTomorrowHandoffClicked(storageKey)
            emitTomorrowHandoffEvent({
              name: 'ai_tomorrow_handoff_click',
              payload,
            })
            window.setTimeout(() => {
              window.location.href = href
            }, 80)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <span>{cta}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            writeTomorrowHandoffDismissed(storageKey)
            emitTomorrowHandoffEvent({
              name: 'ai_tomorrow_handoff_dismiss',
              payload,
            })
            setVisible(false)
          }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  )
}
