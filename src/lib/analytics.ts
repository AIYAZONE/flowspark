import { sanitizeEventPayload, type EventPayload } from '@/lib/eventPayload'

type AnalyticsPayload = EventPayload
type AIEventMeta = {
  recommendation_id?: string | null
  scene?: string | null
  strategy_version?: string | null
  prompt_version?: string | null
  model?: string | null
  variant_minutes?: number | null
  source_action_id?: string | null
}

export function logEvent(name: string, payload?: unknown) {
  if (typeof window === 'undefined') return
  if (!name || typeof name !== 'string') return

  const safePayload = sanitizeEventPayload(payload, { maxStringLen: 120 }) as AnalyticsPayload | undefined

  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('[event]', name, safePayload ?? null)
    } catch {
    }
  }

  void import('@vercel/analytics')
    .then(({ track }) => {
      if (typeof track !== 'function') return
      track(name, safePayload)
    })
    .catch(() => {
    })
}

export function logAIEvent(name: string, payload?: unknown, meta?: AIEventMeta) {
  logEvent(name, {
    ...(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}),
    ...(meta || {}),
  })
}
