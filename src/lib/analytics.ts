type AnalyticsValue = string | number | boolean | null
type AnalyticsPayload = Record<string, AnalyticsValue>
type AIEventMeta = {
  recommendation_id?: string | null
  scene?: string | null
  strategy_version?: string | null
  prompt_version?: string | null
  model?: string | null
  variant_minutes?: number | null
}

function clampString(value: string, maxLen: number) {
  const v = value.trim()
  if (!v) return null
  if (v.length <= maxLen) return v
  return v.slice(0, maxLen)
}

function toAnalyticsValue(value: unknown): AnalyticsValue | undefined {
  if (value == null) return null
  if (typeof value === 'string') return clampString(value, 120)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value
  return undefined
}

function sanitizePayload(payload: unknown): AnalyticsPayload | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined
  const out: AnalyticsPayload = {}
  const obj = payload as Record<string, unknown>
  for (const [k, v] of Object.entries(obj)) {
    if (!k || k.length > 60) continue
    const val = toAnalyticsValue(v)
    if (val === undefined) continue
    out[k] = val
  }
  return Object.keys(out).length ? out : undefined
}

export function logEvent(name: string, payload?: unknown) {
  if (typeof window === 'undefined') return
  if (!name || typeof name !== 'string') return

  const safePayload = sanitizePayload(payload)

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
