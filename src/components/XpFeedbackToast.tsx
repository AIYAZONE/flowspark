'use client'

import { useEffect, useMemo, useState } from 'react'

import type en from '@/i18n/en.json'
import { Sparkles } from 'lucide-react'

type Dict = typeof en

type XpFeedback = {
  amount: number
  createdAt: number
}

const STORAGE_KEY = 'xp_feedback_v1'
const EVENT_NAME = 'xp_feedback_updated'
const FRESH_MS = 4000

function isFresh(feedback: XpFeedback) {
  return Date.now() - feedback.createdAt <= FRESH_MS
}

function readFeedback(): XpFeedback | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as XpFeedback
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.amount !== 'number' || !Number.isFinite(parsed.amount)) return null
    if (typeof parsed.createdAt !== 'number' || !Number.isFinite(parsed.createdAt)) return null
    if (!isFresh(parsed)) return null
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

export function XpFeedbackToast(props: { dict: Dict }) {
  const [feedback, setFeedback] = useState<XpFeedback | null>(null)

  useEffect(() => {
    const load = () => {
      const next = readFeedback()
      if (!next) {
        clearFeedback()
        setFeedback(null)
        return
      }
      clearFeedback()
      setFeedback(next)
    }

    load()
    window.addEventListener(EVENT_NAME, load as EventListener)
    return () => window.removeEventListener(EVENT_NAME, load as EventListener)
  }, [])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const copy = useMemo(() => {
    if (!feedback) return null
    return props.dict.common.xpGainedShort.replace('{amount}', String(feedback.amount))
  }, [feedback, props.dict.common.xpGainedShort])

  if (!feedback || !copy) return null

  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-500/15 via-background/90 to-background/90 px-4 py-2.5 text-sm font-semibold text-yellow-700 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-250 dark:text-yellow-300">
        <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
        <span>{copy}</span>
      </div>
    </div>
  )
}

export function pushXpFeedback(payload: { amount: number }) {
  if (typeof window === 'undefined') return
  try {
    const feedback: XpFeedback = {
      amount: Math.round(payload.amount),
      createdAt: Date.now(),
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(feedback))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
  }
}
