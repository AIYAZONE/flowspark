function hash32(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type Variant = 'A' | 'B'

export function assignVariant(userId: string, experimentKey: string, splitPercentB = 50): Variant {
  const split = Math.max(0, Math.min(100, Math.floor(splitPercentB)))
  const bucket = hash32(`${userId}:${experimentKey}`) % 100
  return bucket < split ? 'B' : 'A'
}

export function isEnvEnabled(value: string | undefined) {
  const v = (value || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'on' || v === 'yes'
}

