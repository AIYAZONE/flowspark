import { isRecord } from '../ai/json.ts'
import type { ParseResult } from '../ai/phase2aSchemas.ts'

export type ChatAgentIntentType =
  | 'capability_answer'
  | 'review_current_tasks'
  | 'review_main_path'
  | 'create_action_request'
  | 'general_guidance'
  | 'clarify_missing_info'
  | 'unsupported_but_understood'

export type ChatAgentReplyMode = 'answer' | 'execute' | 'clarify'
export type ChatAgentConfidence = 'low' | 'medium' | 'high'
export type ChatAgentSurface = 'chat' | 'system' | 'today' | 'goals' | 'profile'

export type ChatAgentUnderstanding = {
  type: 'chat_understanding'
  intent_type: ChatAgentIntentType
  user_goal_summary: string
  reasoning_summary: string
  judgement: string
  next_step: string
  reply_mode: ChatAgentReplyMode
  needs_clarification: boolean
  clarifying_question: string | null
  suggested_action_title: string | null
  target_path_hint: string | null
  recommended_surface: ChatAgentSurface
  confidence?: ChatAgentConfidence
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNullableString(value: unknown) {
  const next = asString(value)
  return next || null
}

function normalizeIntentType(value: unknown): ChatAgentIntentType | null {
  const next = asString(value)
  if (
    next === 'capability_answer' ||
    next === 'review_current_tasks' ||
    next === 'review_main_path' ||
    next === 'create_action_request' ||
    next === 'general_guidance' ||
    next === 'clarify_missing_info' ||
    next === 'unsupported_but_understood'
  ) {
    return next
  }
  return null
}

function normalizeReplyMode(value: unknown): ChatAgentReplyMode | null {
  const next = asString(value)
  if (next === 'answer' || next === 'execute' || next === 'clarify') return next
  return null
}

function normalizeSurface(value: unknown): ChatAgentSurface | null {
  const next = asString(value)
  if (next === 'chat' || next === 'system' || next === 'today' || next === 'goals' || next === 'profile') return next
  return null
}

function normalizeConfidence(value: unknown): ChatAgentConfidence | undefined {
  const next = asString(value)
  if (next === 'low' || next === 'medium' || next === 'high') return next
  return undefined
}

export function parseChatAgentUnderstanding(payload: unknown): ParseResult<ChatAgentUnderstanding> {
  if (!isRecord(payload)) return { ok: false, violations: ['payload_not_object'] }

  const violations: string[] = []
  const type = asString(payload.type)
  if (type !== 'chat_understanding') violations.push('type_invalid')

  const intentType = normalizeIntentType(payload.intent_type)
  if (!intentType) violations.push('intent_type_invalid')

  const replyMode = normalizeReplyMode(payload.reply_mode)
  if (!replyMode) violations.push('reply_mode_invalid')

  const surface = normalizeSurface(payload.recommended_surface)
  if (!surface) violations.push('recommended_surface_invalid')

  const userGoalSummary = asString(payload.user_goal_summary)
  if (!userGoalSummary) violations.push('user_goal_summary_required')

  const reasoningSummary = asString(payload.reasoning_summary)
  if (!reasoningSummary) violations.push('reasoning_summary_required')

  const judgement = asString(payload.judgement)
  if (!judgement) violations.push('judgement_required')

  const nextStep = asString(payload.next_step)
  if (!nextStep) violations.push('next_step_required')

  const needsClarification = typeof payload.needs_clarification === 'boolean' ? payload.needs_clarification : null
  if (needsClarification == null) violations.push('needs_clarification_required')

  const clarifyingQuestion = asNullableString(payload.clarifying_question)
  if ((needsClarification || replyMode === 'clarify') && !clarifyingQuestion) {
    violations.push('clarifying_question_required')
  }

  if (violations.length > 0 || !intentType || !replyMode || !surface || needsClarification == null) {
    return { ok: false, violations }
  }

  return {
    ok: true,
    value: {
      type: 'chat_understanding',
      intent_type: intentType,
      user_goal_summary: userGoalSummary,
      reasoning_summary: reasoningSummary,
      judgement,
      next_step: nextStep,
      reply_mode: replyMode,
      needs_clarification: needsClarification,
      clarifying_question: clarifyingQuestion,
      suggested_action_title: asNullableString(payload.suggested_action_title),
      target_path_hint: asNullableString(payload.target_path_hint),
      recommended_surface: surface,
      confidence: normalizeConfidence(payload.confidence),
    },
  }
}
