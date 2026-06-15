'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type en from '@/i18n/en.json'
import { formatStreakFeedbackCopy, isStreakFeedbackFresh, type StreakFeedback } from '@/lib/streak-feedback'

type Dict = typeof en

const STORAGE_KEY = 'streak_feedback_v1'
const EVENT_NAME = 'streak_feedback_updated'

function readFeedback(): StreakFeedback | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StreakFeedback
    if (!parsed || typeof parsed !== 'object') return null
    if (!('kind' in parsed) || !('createdAt' in parsed)) return null
    if (!isStreakFeedbackFresh(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function clearFeedback() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
  }
}

export function StreakFeedbackBanner(props: { dict: Dict; className?: string }) {
  const isZh = String(props.dict.common.locale || '').toLowerCase().startsWith('zh')
  const locale = isZh ? 'zh' : 'en'
  const [feedback, setFeedback] = useState<StreakFeedback | null>(null)

  const load = useCallback(() => {
    const next = readFeedback()
    if (!next) {
      clearFeedback()
      setFeedback(null)
      return
    }
    clearFeedback()
    setFeedback(next)
  }, [])

  useEffect(() => {
    load()
    if (typeof window === 'undefined') return
    const handler = () => load()
    window.addEventListener(EVENT_NAME, handler as EventListener)
    return () => window.removeEventListener(EVENT_NAME, handler as EventListener)
  }, [load])

  const copy = useMemo(() => {
    if (!feedback) return null
    return formatStreakFeedbackCopy(feedback, { locale })
  }, [feedback, locale])

  if (!feedback || !copy) return null

  return (
    <div
      className={[
        'rounded-xl border px-4 py-3',
        copy.tone === 'success'
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-primary/20 bg-primary/5',
        props.className || '',
      ].join(' ')}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{copy.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{copy.body}</div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setFeedback(null)}
        >
          {isZh ? '关闭' : 'Close'}
        </button>
      </div>
    </div>
  )
}

export function pushStreakFeedback(feedback: StreakFeedback) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(feedback))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
  }
}

