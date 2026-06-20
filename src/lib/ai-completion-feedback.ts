'use client'

export type AICompletionFeedback = {
  title: string
  createdAt: number
}

export const AI_COMPLETION_FEEDBACK_STORAGE_KEY = 'ai_completion_feedback_v1'
export const AI_COMPLETION_FEEDBACK_EVENT = 'ai_completion_feedback_updated'
export const AI_COMPLETION_FEEDBACK_FRESH_MS = 5000

export function isAICompletionFeedbackFresh(feedback: AICompletionFeedback) {
  return Date.now() - feedback.createdAt <= AI_COMPLETION_FEEDBACK_FRESH_MS
}

export function readAICompletionFeedback() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(AI_COMPLETION_FEEDBACK_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AICompletionFeedback
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.title !== 'string' || !parsed.title.trim()) return null
    if (typeof parsed.createdAt !== 'number' || !Number.isFinite(parsed.createdAt)) return null
    if (!isAICompletionFeedbackFresh(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAICompletionFeedback() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(AI_COMPLETION_FEEDBACK_STORAGE_KEY)
  } catch {
  }
}

export function pushAICompletionFeedback(payload: { title: string }) {
  if (typeof window === 'undefined') return
  try {
    const feedback: AICompletionFeedback = {
      title: payload.title.trim(),
      createdAt: Date.now(),
    }
    window.sessionStorage.setItem(AI_COMPLETION_FEEDBACK_STORAGE_KEY, JSON.stringify(feedback))
    window.dispatchEvent(new Event(AI_COMPLETION_FEEDBACK_EVENT))
  } catch {
  }
}
