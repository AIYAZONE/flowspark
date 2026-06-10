import { stripHtmlToPlainText } from "@/lib/utils"

function escapeICSText(input: string) {
  return input
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll(/\r?\n/g, '\\n')
}

function toICSDate(date: string) {
  return date.replaceAll('-', '')
}

function addOneDay(date: string) {
  const base = new Date(`${date}T00:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() + 1)
  return base.toISOString().slice(0, 10)
}

function slugifyFilename(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'flowspark-goal'
}

export function buildGoalCalendarICS(params: {
  goalTitle: string
  events: Array<{
    id: string
    title: string
    startDate: string
    endDate?: string | null
    description?: string | null
    priority?: string | null
    type?: string | null
  }>
}) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FlowSpark//Goal Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(params.goalTitle)}`,
  ]

  for (const event of params.events) {
    const startDate = event.startDate
    const endDate = event.endDate || event.startDate
    const descriptionParts = [
      event.type ? `Type: ${event.type}` : null,
      event.priority ? `Priority: ${event.priority}` : null,
      stripHtmlToPlainText(event.description, { preserveLineBreaks: true }) || null,
    ].filter(Boolean)

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@flowspark.goal`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${escapeICSText(event.title)}`,
      `DTSTART;VALUE=DATE:${toICSDate(startDate)}`,
      `DTEND;VALUE=DATE:${toICSDate(addOneDay(endDate))}`,
      `DESCRIPTION:${escapeICSText(descriptionParts.join('\n'))}`,
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')

  return {
    filename: `${slugifyFilename(params.goalTitle)}.ics`,
    content: `${lines.join('\r\n')}\r\n`,
  }
}
