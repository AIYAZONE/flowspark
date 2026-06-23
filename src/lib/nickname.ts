export const NICKNAME_MAX_UNITS = 20

export function getNicknameUnits(input: string): number {
  let units = 0
  for (const ch of String(input ?? '')) {
    const codePoint = ch.codePointAt(0) ?? 0
    units += codePoint <= 0x7f ? 1 : 2
  }
  return units
}

export function truncateNicknameToUnits(input: string, maxUnits: number = NICKNAME_MAX_UNITS): string {
  const raw = String(input ?? '')
  if (raw === '') return raw
  if (!Number.isFinite(maxUnits) || maxUnits <= 0) return ''

  let units = 0
  let out = ''
  for (const ch of raw) {
    const codePoint = ch.codePointAt(0) ?? 0
    const add = codePoint <= 0x7f ? 1 : 2
    if (units + add > maxUnits) break
    units += add
    out += ch
  }
  return out
}

