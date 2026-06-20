export type EventScalar = string | number | boolean | null
export type EventPayload = Record<string, EventScalar>

function toEventScalar(value: unknown, maxStringLen: number): EventScalar | undefined {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    return trimmed.length <= maxStringLen ? trimmed : trimmed.slice(0, maxStringLen)
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value
  return undefined
}

export function sanitizeEventPayload(
  value: unknown,
  options?: {
    maxKeyLen?: number
    maxStringLen?: number
  }
): EventPayload | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const maxKeyLen = options?.maxKeyLen ?? 60
  const maxStringLen = options?.maxStringLen ?? 160
  const output: EventPayload = {}

  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!key || key.length > maxKeyLen) continue
    const sanitized = toEventScalar(raw, maxStringLen)
    if (sanitized === undefined) continue
    output[key] = sanitized
  }

  return Object.keys(output).length > 0 ? output : undefined
}
