export type DateRange = { start: string; end: string }

function parseISODateToUTC(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const d = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function formatUTCDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addUTCDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

export function scheduleRangesWithinGoal(opts: { start: string; end: string; count: number }): DateRange[] {
  const n = Math.max(0, Math.floor(opts.count))
  if (n === 0) return []

  const start = parseISODateToUTC(opts.start)
  const end = parseISODateToUTC(opts.end)
  if (!start || !end) {
    return Array.from({ length: n }, () => ({ start: opts.start, end: opts.end }))
  }

  const msDay = 24 * 60 * 60 * 1000
  const diffDays = Math.floor((end.getTime() - start.getTime()) / msDay)
  if (diffDays <= 0) {
    const single = formatUTCDate(start)
    return Array.from({ length: n }, () => ({ start: single, end: single }))
  }

  const totalSlots = diffDays + 1
  const ranges: DateRange[] = []
  for (let i = 0; i < n; i++) {
    const sIndex = Math.floor((i * totalSlots) / n)
    const eIndexExclusive = Math.floor(((i + 1) * totalSlots) / n)
    const eIndex = Math.max(sIndex, eIndexExclusive - 1)
    const sDate = addUTCDays(start, sIndex)
    const eDate = addUTCDays(start, eIndex)
    ranges.push({ start: formatUTCDate(sDate), end: formatUTCDate(eDate) })
  }
  return ranges
}

