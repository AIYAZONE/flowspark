import { isRecord } from '@/lib/ai/json'

export type ISODate = string
export type Minutes = number

export type ActionType = 'core' | 'maintenance' | 'learning' | 'review' | 'rest'
export type ActionPriority = 'high' | 'medium' | 'low'
export type GoalPriority = 'low' | 'medium' | 'high'
export type SuccessCriterionType = 'outcome' | 'process'
export type StopCriterionType = 'resource' | 'direction'
export type QuestionType = 'single_choice' | 'short_text'

export interface GoalBriefInput {
  title: string
  description?: string | null
  start_date?: ISODate | null
  end_date?: ISODate | null
  priority?: GoalPriority | null
  category?: string | null
  success_criteria?: string | null
  stop_criteria?: string | null
  user_context?: {
    time_budget_bucket?: '5-10' | '10-20' | '20-45' | '45+' | 'unknown'
    constraints?: string[]
    likely_frictions?: string[]
    preference?: string | null
  }
}

export interface GoalSetupStepAOutput {
  type: 'goal_setup_stepA'
  understanding: {
    goal_summary: string
    key_constraints: string[]
    likely_failure_reasons: string[]
    leverage_point: string
  }
  clarifying_questions: Array<{
    id: string
    question: string
    type: QuestionType
    options?: string[]
    required: boolean
  }>
  need_more_info: {
    blocking: boolean
    missing: string[]
    message: string
  }
  confidence?: 'low' | 'medium' | 'high'
}

export interface GoalSetupStepBOutput {
  type: 'goal_setup_stepB'
  goal_draft: {
    category: string
    priority: GoalPriority
    start_date: ISODate
    end_date: ISODate
  }
  actions: Array<{
    title: string
    why: string
    definition_of_done: string
    estimated_minutes: Minutes
    action_type: ActionType
    priority: ActionPriority | null
  }>
  success_criteria: Array<{ type: SuccessCriterionType; text: string }>
  stop_criteria: Array<{ type: StopCriterionType; text: string }>
  if_then_plans: Array<{ if: string; then: string; minimal_action_minutes: Minutes }>
  confidence?: 'low' | 'medium' | 'high'
}

export interface TodayPlanOutput {
  type: 'today_plan'
  recommendations: Array<{
    kind: 'core' | 'alt'
    goal_id: string | null
    reason: string
    variants: Array<{
      minutes: 5 | 10 | 20
      title: string
      first_step: string
      definition_of_done: string
    }>
  }>
  confidence?: 'low' | 'medium' | 'high'
}

export interface RescueOutput {
  type: 'rescue'
  reason_tag: 'no_time' | 'too_hard' | 'anxiety' | 'unclear_next' | 'low_energy' | 'other'
  minimal_variant: {
    minutes: 5
    title: string
    first_step: string
    definition_of_done: string
  }
  if_then: { if: string; then: string }
  confidence?: 'low' | 'medium' | 'high'
}

export interface ReviewOutput {
  type: 'review'
  summary_sentence: string
  detected_friction_tag: string | null
  tomorrow_card: {
    risk: string
    if_then: { if: string; then: string }
    suggested_core_action_direction: string
  }
  confidence?: 'low' | 'medium' | 'high'
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; violations: string[] }

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v ? v : null
}

function asStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    const s = asTrimmedString(item)
    if (!s) continue
    out.push(s)
    if (out.length >= max) break
  }
  return out
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  return null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function normalizeActionType(value: unknown): ActionType | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'core') return 'core'
  if (v === 'maintenance') return 'maintenance'
  if (v === 'learning') return 'learning'
  if (v === 'review') return 'review'
  if (v === 'rest') return 'rest'
  return null
}

function normalizeActionPriority(value: unknown): ActionPriority | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'high') return 'high'
  if (v === 'medium') return 'medium'
  if (v === 'low') return 'low'
  return null
}

function normalizeGoalPriority(value: unknown): GoalPriority | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'high') return 'high'
  if (v === 'medium') return 'medium'
  if (v === 'low') return 'low'
  return null
}

function asISODate(value: unknown): ISODate | null {
  const v = asTrimmedString(value)
  if (!v) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return v
}

function normalizeQuestionType(value: unknown): QuestionType | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'single_choice') return 'single_choice'
  if (v === 'short_text') return 'short_text'
  return null
}

function normalizeSuccessCriterionType(value: unknown): SuccessCriterionType | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'outcome') return 'outcome'
  if (v === 'process') return 'process'
  return null
}

function normalizeStopCriterionType(value: unknown): StopCriterionType | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'resource') return 'resource'
  if (v === 'direction') return 'direction'
  return null
}

function normalizeConfidence(value: unknown): 'low' | 'medium' | 'high' | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  if (v === 'low') return 'low'
  if (v === 'medium') return 'medium'
  if (v === 'high') return 'high'
  return undefined
}

function ensureMinutesInRange(value: number, min: number, max: number): number | null {
  if (!Number.isFinite(value)) return null
  const n = Math.round(value)
  if (n < min || n > max) return null
  return n
}

function isExecutableTitle(title: string): boolean {
  if (!title.trim()) return false
  if (title.length < 3) return false
  const vague = ['提升', '优化', '更好', '加强', '努力', '坚持', '学习更多', '变得更好', 'be better', 'improve', 'optimize']
  const lower = title.toLowerCase()
  return !vague.some(v => lower.includes(v.toLowerCase()))
}

function isShortSentence(value: string, maxChars: number) {
  const v = value.trim()
  return v.length > 0 && v.length <= maxChars
}

export function parseGoalSetupStepA(payload: unknown): ParseResult<GoalSetupStepAOutput> {
  if (!isRecord(payload)) return { ok: false, violations: ['payload_not_object'] }
  const violations: string[] = []

  const type = asTrimmedString(payload.type)
  if (type !== 'goal_setup_stepA') violations.push('type_must_be_goal_setup_stepA')

  const understandingRaw = isRecord(payload.understanding) ? payload.understanding : null
  const goal_summary = understandingRaw ? asTrimmedString(understandingRaw.goal_summary) : null
  const leverage_point = understandingRaw ? asTrimmedString(understandingRaw.leverage_point) : null
  const key_constraints = understandingRaw ? asStringArray(understandingRaw.key_constraints, 6) : []
  const likely_failure_reasons = understandingRaw ? asStringArray(understandingRaw.likely_failure_reasons, 6) : []

  if (!goal_summary || !isExecutableTitle(goal_summary)) violations.push('understanding_goal_summary_not_specific')
  if (!leverage_point) violations.push('understanding_leverage_point_required')

  const clarifying_questions: GoalSetupStepAOutput['clarifying_questions'] = []
  if (Array.isArray(payload.clarifying_questions)) {
    for (const item of payload.clarifying_questions) {
      if (!isRecord(item)) continue
      const id = asTrimmedString(item.id)
      const question = asTrimmedString(item.question)
      const qt = normalizeQuestionType(item.type)
      const required = asBoolean(item.required)
      if (!id || !question || !qt || required == null) continue
      const options = qt === 'single_choice' ? asStringArray(item.options, 8) : undefined
      if (qt === 'single_choice' && (!options || options.length < 2)) continue
      clarifying_questions.push({ id, question, type: qt, options, required })
      if (clarifying_questions.length >= 3) break
    }
  }

  const needMoreRaw = isRecord(payload.need_more_info) ? payload.need_more_info : null
  const blocking = needMoreRaw ? asBoolean(needMoreRaw.blocking) : null
  const missing = needMoreRaw ? asStringArray(needMoreRaw.missing, 6) : []
  const message = needMoreRaw ? asTrimmedString(needMoreRaw.message) : null
  if (blocking == null) violations.push('need_more_info_blocking_required')
  if (!message) violations.push('need_more_info_message_required')

  const confidence = normalizeConfidence(payload.confidence)

  const blockingValue = blocking ?? false
  if (blockingValue) {
    if (clarifying_questions.length !== 0) violations.push('blocking_true_questions_must_be_empty')
    if (missing.length === 0 || missing.length > 3) violations.push('blocking_true_missing_2_to_3')
  } else {
    if (clarifying_questions.length < 2 || clarifying_questions.length > 3) violations.push('clarifying_questions_2_to_3')
  }

  if (violations.length) return { ok: false, violations }

  return {
    ok: true,
    value: {
      type: 'goal_setup_stepA',
      understanding: {
        goal_summary: goal_summary!,
        key_constraints,
        likely_failure_reasons,
        leverage_point: leverage_point!
      },
      clarifying_questions,
      need_more_info: { blocking: blockingValue, missing, message: message! },
      confidence
    }
  }
}

export function parseGoalSetupStepB(payload: unknown): ParseResult<GoalSetupStepBOutput> {
  if (!isRecord(payload)) return { ok: false, violations: ['payload_not_object'] }
  const violations: string[] = []

  const type = asTrimmedString(payload.type)
  if (type !== 'goal_setup_stepB') violations.push('type_must_be_goal_setup_stepB')

  const goalDraftRaw =
    (isRecord(payload.goal_draft) ? payload.goal_draft : null) ??
    (isRecord(payload.goal) ? payload.goal : null)
  const goal_category = goalDraftRaw ? asTrimmedString(goalDraftRaw.category) : null
  const goal_priority = goalDraftRaw ? normalizeGoalPriority(goalDraftRaw.priority) : null
  const goal_start_date = goalDraftRaw ? asISODate(goalDraftRaw.start_date) : null
  const goal_end_date = goalDraftRaw ? asISODate(goalDraftRaw.end_date) : null

  if (!goalDraftRaw) violations.push('goal_draft_required')
  if (!goal_category) violations.push('goal_draft_category_required')
  if (goal_category && goal_category.length > 60) violations.push('goal_draft_category_too_long')
  if (!goal_priority) violations.push('goal_draft_priority_required')
  if (!goal_start_date || !goal_end_date) violations.push('goal_draft_dates_required')
  if (goal_start_date && goal_end_date && goal_end_date < goal_start_date) violations.push('goal_draft_date_range_invalid')

  const actions: GoalSetupStepBOutput['actions'] = []
  if (Array.isArray(payload.actions)) {
    for (const item of payload.actions) {
      if (!isRecord(item)) continue
      const title = asTrimmedString(item.title)
      const why = asTrimmedString(item.why)
      const definition_of_done = asTrimmedString(item.definition_of_done)
      const estimated_minutes_raw = asNumber(item.estimated_minutes)
      const estimated_minutes = estimated_minutes_raw != null ? ensureMinutesInRange(estimated_minutes_raw, 5, 20) : null
      const action_type = normalizeActionType(item.action_type) ?? normalizeActionType(item.type) ?? null
      const priority = normalizeActionPriority(item.priority)
      if (!title || !why || !definition_of_done || estimated_minutes == null || !action_type) continue
      if (!isExecutableTitle(title)) continue
      actions.push({ title, why, definition_of_done, estimated_minutes, action_type, priority })
      if (actions.length >= 10) break
    }
  }

  const success_criteria: GoalSetupStepBOutput['success_criteria'] = []
  if (Array.isArray(payload.success_criteria)) {
    for (const item of payload.success_criteria) {
      if (!isRecord(item)) continue
      const t = normalizeSuccessCriterionType(item.type)
      const text = asTrimmedString(item.text)
      if (!t || !text) continue
      success_criteria.push({ type: t, text })
    }
  }

  const stop_criteria: GoalSetupStepBOutput['stop_criteria'] = []
  if (Array.isArray(payload.stop_criteria)) {
    for (const item of payload.stop_criteria) {
      if (!isRecord(item)) continue
      const t = normalizeStopCriterionType(item.type)
      const text = asTrimmedString(item.text)
      if (!t || !text) continue
      stop_criteria.push({ type: t, text })
    }
  }

  const if_then_plans: GoalSetupStepBOutput['if_then_plans'] = []
  if (Array.isArray(payload.if_then_plans)) {
    for (const item of payload.if_then_plans) {
      if (!isRecord(item)) continue
      const iff = asTrimmedString(item.if)
      const then = asTrimmedString(item.then)
      const minutesRaw = asNumber(item.minimal_action_minutes)
      const minimal_action_minutes = minutesRaw != null ? ensureMinutesInRange(minutesRaw, 5, 10) : null
      if (!iff || !then || minimal_action_minutes == null) continue
      if_then_plans.push({ if: iff, then, minimal_action_minutes })
      if (if_then_plans.length >= 2) break
    }
  }

  const confidence = normalizeConfidence(payload.confidence)

  const actionsLen = actions.length
  if (actionsLen < 3) violations.push('actions_min_3')
  if (actionsLen >= 3 && actionsLen < 6) {
    if (confidence !== 'low') violations.push('actions_3_to_5_requires_low_confidence')
  }
  if (actionsLen > 10) violations.push('actions_max_10')

  const hasOutcome = success_criteria.some(s => s.type === 'outcome')
  const hasProcess = success_criteria.some(s => s.type === 'process')
  if (success_criteria.length < 2 || !hasOutcome || !hasProcess) violations.push('success_criteria_need_outcome_and_process')

  const hasResource = stop_criteria.some(s => s.type === 'resource')
  const hasDirection = stop_criteria.some(s => s.type === 'direction')
  if (stop_criteria.length < 2 || !hasResource || !hasDirection) violations.push('stop_criteria_need_resource_and_direction')

  if (if_then_plans.length === 0) violations.push('if_then_plans_min_1')

  if (violations.length) return { ok: false, violations }

  return {
    ok: true,
    value: {
      type: 'goal_setup_stepB',
      goal_draft: {
        category: goal_category!,
        priority: goal_priority!,
        start_date: goal_start_date!,
        end_date: goal_end_date!
      },
      actions,
      success_criteria,
      stop_criteria,
      if_then_plans,
      confidence
    }
  }
}

export function parseTodayPlan(payload: unknown): ParseResult<TodayPlanOutput> {
  if (!isRecord(payload)) return { ok: false, violations: ['payload_not_object'] }
  const violations: string[] = []

  const type = asTrimmedString(payload.type)
  if (type !== 'today_plan') violations.push('type_must_be_today_plan')

  const recommendations: TodayPlanOutput['recommendations'] = []
  if (Array.isArray(payload.recommendations)) {
    for (const item of payload.recommendations) {
      if (!isRecord(item)) continue
      const kindRaw = asTrimmedString(item.kind)
      const kind = kindRaw === 'core' || kindRaw === 'alt' ? kindRaw : null
      const goal_id = asTrimmedString(item.goal_id) ?? null
      const reason = asTrimmedString(item.reason)
      if (!kind || !reason) continue

      const variants: TodayPlanOutput['recommendations'][number]['variants'] = []
      if (Array.isArray(item.variants)) {
        for (const v of item.variants) {
          if (!isRecord(v)) continue
          const minutesRaw = asNumber(v.minutes)
          const minutes = minutesRaw === 5 || minutesRaw === 10 || minutesRaw === 20 ? minutesRaw : null
          const title = asTrimmedString(v.title)
          const first_step = asTrimmedString(v.first_step)
          const definition_of_done = asTrimmedString(v.definition_of_done)
          if (!minutes || !title || !first_step || !definition_of_done) continue
          if (!isExecutableTitle(title)) continue
          if (!isShortSentence(first_step, 30)) continue
          variants.push({ minutes, title, first_step, definition_of_done })
        }
      }

      const has5 = variants.some(v => v.minutes === 5)
      const has10 = variants.some(v => v.minutes === 10)
      const has20 = variants.some(v => v.minutes === 20)
      if (!has5 || !has10 || !has20) continue

      recommendations.push({ kind, goal_id, reason, variants })
      if (recommendations.length >= 3) break
    }
  }

  if (recommendations.length === 0) violations.push('recommendations_min_1')

  const confidence = normalizeConfidence(payload.confidence)

  if (violations.length) return { ok: false, violations }
  return { ok: true, value: { type: 'today_plan', recommendations, confidence } }
}

export function parseRescue(payload: unknown): ParseResult<RescueOutput> {
  if (!isRecord(payload)) return { ok: false, violations: ['payload_not_object'] }
  const violations: string[] = []

  const type = asTrimmedString(payload.type)
  if (type !== 'rescue') violations.push('type_must_be_rescue')

  const reasonRaw = asTrimmedString(payload.reason_tag)
  const reason_tag =
    reasonRaw === 'no_time' ||
    reasonRaw === 'too_hard' ||
    reasonRaw === 'anxiety' ||
    reasonRaw === 'unclear_next' ||
    reasonRaw === 'low_energy' ||
    reasonRaw === 'other'
      ? reasonRaw
      : null
  if (!reason_tag) violations.push('reason_tag_invalid')

  const minimalRaw = isRecord(payload.minimal_variant) ? payload.minimal_variant : null
  const minimal_minutes = minimalRaw ? asNumber(minimalRaw.minutes) : null
  const minutesOk = minimal_minutes === 5
  const title = minimalRaw ? asTrimmedString(minimalRaw.title) : null
  const first_step = minimalRaw ? asTrimmedString(minimalRaw.first_step) : null
  const definition_of_done = minimalRaw ? asTrimmedString(minimalRaw.definition_of_done) : null
  if (!minutesOk) violations.push('minimal_minutes_must_be_5')
  if (!title || !isExecutableTitle(title)) violations.push('minimal_title_invalid')
  if (!first_step || !isShortSentence(first_step, 30)) violations.push('minimal_first_step_invalid')
  if (!definition_of_done) violations.push('minimal_definition_of_done_required')

  const ifThenRaw = isRecord(payload.if_then) ? payload.if_then : null
  const iff = ifThenRaw ? asTrimmedString(ifThenRaw.if) : null
  const then = ifThenRaw ? asTrimmedString(ifThenRaw.then) : null
  if (!iff || !then) violations.push('if_then_required')

  const confidence = normalizeConfidence(payload.confidence)

  if (violations.length) return { ok: false, violations }

  return {
    ok: true,
    value: {
      type: 'rescue',
      reason_tag: reason_tag!,
      minimal_variant: {
        minutes: 5,
        title: title!,
        first_step: first_step!,
        definition_of_done: definition_of_done!
      },
      if_then: { if: iff!, then: then! },
      confidence
    }
  }
}

export function parseReview(payload: unknown): ParseResult<ReviewOutput> {
  if (!isRecord(payload)) return { ok: false, violations: ['payload_not_object'] }
  const violations: string[] = []

  const type = asTrimmedString(payload.type)
  if (type !== 'review') violations.push('type_must_be_review')

  const summary_sentence = asTrimmedString(payload.summary_sentence)
  if (!summary_sentence || !isShortSentence(summary_sentence, 30)) violations.push('summary_sentence_max_30')

  const detected_friction_tag = asTrimmedString(payload.detected_friction_tag) ?? null

  const tc = isRecord(payload.tomorrow_card) ? payload.tomorrow_card : null
  const risk = tc ? asTrimmedString(tc.risk) : null
  const dir = tc ? asTrimmedString(tc.suggested_core_action_direction) : null
  const it = tc && isRecord(tc.if_then) ? tc.if_then : null
  const iff = it ? asTrimmedString(it.if) : null
  const then = it ? asTrimmedString(it.then) : null

  if (!risk) violations.push('tomorrow_risk_required')
  if (!dir) violations.push('tomorrow_direction_required')
  if (!iff || !then) violations.push('tomorrow_if_then_required')

  const confidence = normalizeConfidence(payload.confidence)

  if (violations.length) return { ok: false, violations }

  return {
    ok: true,
    value: {
      type: 'review',
      summary_sentence: summary_sentence!,
      detected_friction_tag,
      tomorrow_card: {
        risk: risk!,
        if_then: { if: iff!, then: then! },
        suggested_core_action_direction: dir!
      },
      confidence
    }
  }
}

export function buildRepairPrompt(locale: 'en' | 'zh', violations: string[]) {
  const items = violations.slice(0, 12).map(v => `- ${v}`).join('\n')
  if (locale === 'zh') {
    return [
      '你上一条输出不符合产品硬规则，请你“只输出严格 JSON（不能有多余文本）”并修复以下问题：',
      items || '- (unknown)',
      '注意：不要添加多余字段；确保所有必填字段存在；分钟数/字数限制必须满足。'
    ].join('\n')
  }
  return [
    'Your previous output violated hard rules. Output STRICT JSON only (no extra text) and fix:',
    items || '- (unknown)',
    'Do not add extra fields. Ensure required fields exist and all constraints are satisfied.'
  ].join('\n')
}
