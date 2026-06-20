'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'

import type en from '@/i18n/en.json'
import {
  AI_COMPLETION_FEEDBACK_EVENT,
  AI_COMPLETION_FEEDBACK_FRESH_MS,
  clearAICompletionFeedback,
  readAICompletionFeedback,
  type AICompletionFeedback,
} from '@/lib/ai-completion-feedback'

type Dict = typeof en

export function AICompletionToast(props: { dict: Dict }) {
  const [feedback, setFeedback] = useState<AICompletionFeedback | null>(null)

  useEffect(() => {
    const load = () => {
      const next = readAICompletionFeedback()
      if (!next) {
        clearAICompletionFeedback()
        setFeedback(null)
        return
      }
      clearAICompletionFeedback()
      setFeedback(next)
    }

    load()
    window.addEventListener(AI_COMPLETION_FEEDBACK_EVENT, load as EventListener)
    return () => window.removeEventListener(AI_COMPLETION_FEEDBACK_EVENT, load as EventListener)
  }, [])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), AI_COMPLETION_FEEDBACK_FRESH_MS)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const body = useMemo(() => {
    if (!feedback) return null
    const template =
      props.dict.today.aiCompletionToastBody ||
      '“{title}” 已计入 AI 建议效果，系统会据此继续优化推荐。'
    return template.replace('{title}', feedback.title)
  }, [feedback, props.dict.today.aiCompletionToastBody])

  const heading =
    props.dict.today.aiCompletionToastTitle ||
    '已完成 AI 核心行动'

  if (!feedback || !body) return null

  return (
    <div className="pointer-events-none fixed left-1/2 top-16 z-50 -translate-x-1/2">
      <div className="min-w-[280px] max-w-[92vw] rounded-2xl border border-emerald-500/25 bg-linear-to-br from-emerald-500/12 via-background/95 to-background/95 px-4 py-3 text-sm shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-250">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
              <span>{heading}</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{body}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
