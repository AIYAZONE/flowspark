import { addDays, addMonths, addWeeks, differenceInCalendarDays, format, parseISO } from 'date-fns'

export const RECURRENCE_MARKER_START = '<!-- flowspark:recurrence:'
export const RECURRENCE_MARKER_END = ' -->'

export type ActionRecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly'

export function isActionRecurrenceRule(value: string | null | undefined): value is Exclude<ActionRecurrenceRule, 'none'> {
  return value === 'daily' || value === 'weekly' || value === 'monthly'
}

export function parseActionRecurrenceDescription(raw: string | null | undefined) {
  const description = raw || ''
  const pattern = /<!-- flowspark:recurrence:(daily|weekly|monthly) -->\s*$/i
  const match = description.match(pattern)
  const recurrence = (match?.[1]?.toLowerCase() || 'none') as ActionRecurrenceRule
  const cleanDescription = match ? description.replace(pattern, '').trimEnd() : description

  return {
    cleanDescription,
    recurrence,
  }
}

export function serializeActionRecurrenceDescription(description: string, recurrence: ActionRecurrenceRule) {
  const clean = parseActionRecurrenceDescription(description).cleanDescription.trimEnd()
  if (recurrence === 'none') return clean
  return clean ? `${clean}\n${RECURRENCE_MARKER_START}${recurrence}${RECURRENCE_MARKER_END}` : `${RECURRENCE_MARKER_START}${recurrence}${RECURRENCE_MARKER_END}`
}

export function getNextRecurringRange(params: {
  startDate: string
  endDate?: string | null
  recurrence: Exclude<ActionRecurrenceRule, 'none'>
}) {
  const start = parseISO(params.startDate)
  const end = parseISO(params.endDate || params.startDate)
  const durationDays = Math.max(0, differenceInCalendarDays(end, start))

  const shiftDate = (date: Date) => {
    switch (params.recurrence) {
      case 'daily':
        return addDays(date, 1)
      case 'weekly':
        return addWeeks(date, 1)
      case 'monthly':
        return addMonths(date, 1)
    }
  }

  const nextStart = shiftDate(start)
  const nextEndBase = shiftDate(end)
  const nextEnd = differenceInCalendarDays(nextEndBase, nextStart) === durationDays ? nextEndBase : addDays(nextStart, durationDays)

  return {
    startDate: format(nextStart, 'yyyy-MM-dd'),
    endDate: format(nextEnd, 'yyyy-MM-dd'),
  }
}
