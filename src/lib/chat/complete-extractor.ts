import type { ChatCompleteDraft } from './types'

/**
 * Maps a raw LLM JSON string from the completion-detection call into a
 * structured result. Tolerant of malformed output: defaults to "no complete".
 */
export function parseCompleteExtraction(raw: string): {
  hasComplete: boolean
  draft: ChatCompleteDraft | null
} {
  try {
    const parsed = JSON.parse(raw) as {
      hasComplete?: boolean
      actionId?: string | null
      title?: string | null
      reason?: string | null
    }
    if (parsed.hasComplete && parsed.actionId && parsed.title) {
      return {
        hasComplete: true,
        draft: {
          actionId: parsed.actionId,
          title: parsed.title,
          reason: parsed.reason ?? null
        }
      }
    }
    return { hasComplete: false, draft: null }
  } catch {
    return { hasComplete: false, draft: null }
  }
}
