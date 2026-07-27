import type { ChatActionDraft } from './types'

/**
 * Maps a raw LLM JSON string from the action-extraction call into a structured
 * result. Tolerant of malformed output: defaults to "no action".
 */
export function parseActionExtraction(raw: string): { hasAction: boolean; draft: ChatActionDraft | null } {
  try {
    const parsed = JSON.parse(raw) as { hasAction?: boolean; draft?: ChatActionDraft }
    if (parsed.hasAction && parsed.draft && parsed.draft.title) {
      return { hasAction: true, draft: parsed.draft }
    }
    return { hasAction: false, draft: null }
  } catch {
    return { hasAction: false, draft: null }
  }
}
