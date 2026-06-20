'use client'

import { sendAIFeedback } from '@/lib/aiFeedback'
import { logEvent } from '@/lib/analytics'

export function emitTomorrowHandoffEvent(params: {
  name: 'ai_tomorrow_handoff_exposed' | 'ai_tomorrow_handoff_click' | 'ai_tomorrow_handoff_dismiss'
  payload: Record<string, string | number | boolean | null>
  dedupeKey?: string | null
}) {
  if (typeof window === 'undefined') return false

  const { dedupeKey, name, payload } = params
  if (dedupeKey) {
    try {
      if (window.sessionStorage.getItem(dedupeKey) === '1') return false
      window.sessionStorage.setItem(dedupeKey, '1')
    } catch {
      return false
    }
  }

  logEvent(name, payload)
  sendAIFeedback(name, payload)
  return true
}
