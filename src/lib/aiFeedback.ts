'use client'

type JSONValue = string | number | boolean | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toJSONValue(value: unknown): JSONValue | undefined {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 200)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value
  return undefined
}

function sanitizeMeta(meta: unknown): Record<string, JSONValue> | undefined {
  if (!isRecord(meta)) return undefined
  const out: Record<string, JSONValue> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (!k || k.length > 60) continue
    const val = toJSONValue(v)
    if (val === undefined) continue
    out[k] = val
  }
  return Object.keys(out).length ? out : undefined
}

export function sendAIFeedback(name: string, meta?: unknown) {
  if (typeof window === 'undefined') return
  const safeMeta = sanitizeMeta(meta)
  void fetch('/api/ai/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, meta: safeMeta })
  }).catch(() => {
  })
}

