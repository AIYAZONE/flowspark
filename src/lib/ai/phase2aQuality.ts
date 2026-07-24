import { safeParseJSON } from './json.ts'
import type { ParseResult } from './phase2aSchemas.ts'
import { buildRepairPrompt } from './phase2aSchemas.ts'

export type ChatMessage = { role: 'system' | 'user'; content: string }

export async function generateWithSingleRepair<T>(opts: {
  locale: 'en' | 'zh'
  messages: ChatMessage[]
  call: (messages: ChatMessage[]) => Promise<string>
  parse: (payload: unknown) => ParseResult<T>
}) {
  const first = await opts.call(opts.messages)
  const parsedFirst = parseContent(first, opts.parse)
  if (parsedFirst.ok) return parsedFirst.value

  const repairMessages: ChatMessage[] = [
    ...opts.messages,
    { role: 'user', content: buildRepairPrompt(opts.locale, parsedFirst.violations) }
  ]
  const second = await opts.call(repairMessages)
  const parsedSecond = parseContent(second, opts.parse)
  if (parsedSecond.ok) return parsedSecond.value

  throw new Error('invalid_ai_output')
}

function parseContent<T>(content: string, parse: (payload: unknown) => ParseResult<T>): ParseResult<T> {
  const payload = safeParseJSON(content)
  return parse(payload)
}
