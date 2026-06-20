'use client'

import { sanitizeEventPayload } from '@/lib/eventPayload'

export function sendAIFeedback(name: string, meta?: unknown) {
  if (typeof window === 'undefined') return
  const safeMeta = sanitizeEventPayload(meta, { maxStringLen: 200 })
  void fetch('/api/ai/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, meta: safeMeta })
  }).catch(() => {
  })
}
