'use client'

import { sanitizeEventPayload } from '@/lib/eventPayload'

export function sendAIFeedback(name: string, meta?: unknown) {
  if (typeof window === 'undefined') return
  const safeMeta = sanitizeEventPayload(meta, { maxStringLen: 200 })
  const payload = JSON.stringify({ name, meta: safeMeta })

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon('/api/ai/feedback', blob)) return
    } catch {
    }
  }

  void fetch('/api/ai/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {})
}
