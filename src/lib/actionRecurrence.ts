import { addDays, addMonths, addWeeks, endOfMonth, format, getDate, getDay, parseISO, setDate, startOfMonth } from 'date-fns'

export const RECURRENCE_MARKER_START = '<!-- flowspark:recurrence:'
export const RECURRENCE_MARKER_END = ' -->'

export type ActionRecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly'

export function isActionRecurrenceRule(value: string | null | undefined): value is Exclude<ActionRecurrenceRule, 'none'> {
  return value === 'daily' || value === 'weekly' || value === 'monthly'
}

export type ActionRecurrenceParams = {
  weekday?: number
  monthday?: number
  missing?: 'clamp'
}

export function parseActionRecurrenceDescription(raw: string | null | undefined) {
  const description = raw || ''
  const pattern = /<!-- flowspark:recurrence:(daily|weekly|monthly)([^>]*) -->\s*$/i
  const match = description.match(pattern)
  const recurrence = (match?.[1]?.toLowerCase() || 'none') as ActionRecurrenceRule
  const params: ActionRecurrenceParams = {}
  const rawParams = match?.[2] || ''
  const tokens = rawParams
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean)
  for (const token of tokens) {
    const [rawKey, rawValue] = token.split('=', 2).map((value) => value.trim())
    if (!rawKey || !rawValue) continue
    const key = rawKey.toLowerCase()
    if (key === 'weekday') {
      const weekday = Number(rawValue)
      if (Number.isFinite(weekday) && weekday >= 1 && weekday <= 7) params.weekday = weekday
      continue
    }
    if (key === 'monthday') {
      const monthday = Number(rawValue)
      if (Number.isFinite(monthday) && monthday >= 1 && monthday <= 31) params.monthday = monthday
      continue
    }
    if (key === 'missing') {
      if (rawValue === 'clamp') params.missing = 'clamp'
      continue
    }
  }
  const cleanDescription = match ? description.replace(pattern, '').trimEnd() : description

  return {
    cleanDescription,
    recurrence,
    params,
  }
}

export function serializeActionRecurrenceDescription(description: string, recurrence: ActionRecurrenceRule, params?: ActionRecurrenceParams) {
  const clean = parseActionRecurrenceDescription(description).cleanDescription.trimEnd()
  if (recurrence === 'none') return clean
  const parts: string[] = []
  if (recurrence === 'weekly' && params?.weekday) parts.push(`weekday=${params.weekday}`)
  if (recurrence === 'monthly' && params?.monthday) parts.push(`monthday=${params.monthday}`)
  if (recurrence === 'monthly' && params?.missing) parts.push(`missing=${params.missing}`)
  const suffix = parts.length > 0 ? `;${parts.join(';')}` : ''
  return clean
    ? `${clean}\n${RECURRENCE_MARKER_START}${recurrence}${suffix}${RECURRENCE_MARKER_END}`
    : `${RECURRENCE_MARKER_START}${recurrence}${suffix}${RECURRENCE_MARKER_END}`
}

export function getNextRecurringRange(params: {
  startDate: string
  recurrence: Exclude<ActionRecurrenceRule, 'none'>
  ruleParams?: ActionRecurrenceParams
}) {
  const start = parseISO(params.startDate)
  const ruleParams = params.ruleParams || {}

  const getMonthlyDate = (base: Date, monthday: number, missing: 'clamp') => {
    const monthStart = startOfMonth(base)
    const candidate = setDate(monthStart, monthday)
    if (candidate.getMonth() !== monthStart.getMonth()) return endOfMonth(monthStart)
    if (missing === 'clamp') return candidate
    return candidate
  }

  const nextStart =
    params.recurrence === 'daily'
      ? addDays(start, 1)
      : params.recurrence === 'weekly'
        ? addWeeks(start, 1)
        : (() => {
            const monthday = ruleParams.monthday || getDate(start)
            const missing = ruleParams.missing || 'clamp'
            return getMonthlyDate(addMonths(start, 1), monthday, missing)
          })()
  const nextEnd = nextStart

  return {
    startDate: format(nextStart, 'yyyy-MM-dd'),
    endDate: format(nextEnd, 'yyyy-MM-dd'),
  }
}

export function getUpcomingRecurringDate(params: {
  today: string
  recurrence: Exclude<ActionRecurrenceRule, 'none'>
  ruleParams?: ActionRecurrenceParams
}) {
  if (params.recurrence === 'daily') return { startDate: params.today, endDate: params.today }
  const todayDate = parseISO(params.today)
  const ruleParams = params.ruleParams || {}

  const isoWeekday = (date: Date) => {
    const value = getDay(date)
    return value === 0 ? 7 : value
  }

  if (params.recurrence === 'weekly') {
    const weekday = ruleParams.weekday || isoWeekday(todayDate)
    const delta = (weekday - isoWeekday(todayDate) + 7) % 7
    const date = addDays(todayDate, delta)
    const value = format(date, 'yyyy-MM-dd')
    return { startDate: value, endDate: value }
  }

  const monthday = ruleParams.monthday || getDate(todayDate)
  const missing = ruleParams.missing || 'clamp'
  const base = getDate(todayDate) <= monthday ? todayDate : addMonths(todayDate, 1)
  const monthStart = startOfMonth(base)
  const candidate = setDate(monthStart, monthday)
  const date = candidate.getMonth() !== monthStart.getMonth() ? endOfMonth(monthStart) : candidate
  const value = format(date, 'yyyy-MM-dd')
  return { startDate: value, endDate: value }
}
