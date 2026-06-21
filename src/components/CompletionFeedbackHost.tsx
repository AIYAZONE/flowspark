'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'

import type en from '@/i18n/en.json'
import { RewardLootBoxDialog } from '@/components/RewardLootBoxDialog'
import {
  clearCompletionFeedback,
  COMPLETION_FEEDBACK_EVENT,
  readCompletionFeedback,
  type CompletionFeedback,
} from '@/lib/completion-feedback'
import { formatStreakFeedbackCopy } from '@/lib/streak-feedback'

type Dict = typeof en

const TOAST_MS = 4500

export function CompletionFeedbackHost(props: { dict: Dict }) {
  const [feedback, setFeedback] = useState<CompletionFeedback | null>(null)

  useEffect(() => {
    const load = () => {
      const next = readCompletionFeedback()
      if (!next) {
        clearCompletionFeedback()
        setFeedback(null)
        return
      }

      clearCompletionFeedback()
      setFeedback(next)
    }

    load()
    window.addEventListener(COMPLETION_FEEDBACK_EVENT, load as EventListener)
    return () => window.removeEventListener(COMPLETION_FEEDBACK_EVENT, load as EventListener)
  }, [])

  useEffect(() => {
    if (!feedback || feedback.kind !== 'toast') return
    const timer = window.setTimeout(() => setFeedback(null), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const locale = String(props.dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const toastCopy = useMemo(() => {
    if (!feedback || feedback.kind !== 'toast') return null

    if (feedback.toast.variant === 'streak') {
      return formatStreakFeedbackCopy(feedback.toast.feedback, { locale })
    }

    if (feedback.toast.variant === 'ai_xp') {
      const heading = props.dict.today.completionToastAIAndXPTitle || props.dict.today.aiCompletionToastTitle || '已完成 AI 核心行动'
      const template = props.dict.today.completionToastAIAndXPBody || '“{title}” 已完成，并获得 {xp} XP。'
      return {
        tone: 'success' as const,
        title: heading,
        body: template
          .replace('{title}', feedback.toast.actionTitle)
          .replace('{xp}', String(feedback.toast.xpEarned)),
      }
    }

    if (feedback.toast.variant === 'ai_only') {
      return {
        tone: 'success' as const,
        title: props.dict.today.aiCompletionToastTitle || '已完成 AI 核心行动',
        body: (props.dict.today.aiCompletionToastBody || '“{title}” 已计入 AI 建议效果，系统会据此继续优化推荐。')
          .replace('{title}', feedback.toast.actionTitle),
      }
    }

    const heading = props.dict.today.completionToastXPTitle || '行动已完成'
    const template = props.dict.today.completionToastXPBody || '获得 {xp} XP，继续保持节奏。'
    return {
      tone: 'success' as const,
      title: heading,
      body: template.replace('{xp}', String(feedback.toast.xpEarned)),
    }
  }, [feedback, locale, props.dict.today])

  return (
    <>
      <RewardLootBoxDialog
        open={Boolean(feedback && feedback.kind === 'modal')}
        onOpenChange={(open) => {
          if (!open) setFeedback(null)
        }}
        reward={feedback?.kind === 'modal' ? feedback.reward : null}
        dict={props.dict}
      />

      {feedback?.kind === 'toast' && toastCopy ? (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2">
          <div className="min-w-[280px] max-w-[92vw] rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-background/95 to-background/95 px-4 py-3 text-sm shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-250">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground">{toastCopy.title}</div>
                <div className="mt-1 text-muted-foreground">{toastCopy.body}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
