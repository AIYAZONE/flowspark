import { callAIChatJSON } from '@/lib/ai/client'
import { generateWithSingleRepair } from '@/lib/ai/phase2aQuality'
import type {
  GoalBriefInput,
  GoalSetupStepAOutput,
  GoalSetupStepBOutput,
  RescueOutput,
  ReviewOutput,
  TodayPlanOutput
} from '@/lib/ai/phase2aSchemas'
import {
  parseGoalSetupStepA,
  parseGoalSetupStepB,
  parseRescue,
  parseReview,
  parseTodayPlan
} from '@/lib/ai/phase2aSchemas'

type Locale = 'en' | 'zh'

function jsonOnlyRule(locale: Locale) {
  if (locale === 'zh') {
    return [
      '你是一个“产品化”的 AI 功能模块。',
      '你必须只输出严格 JSON（不能有多余文本、不能用 markdown、不能包裹代码块）。',
      '如果信息不足或无法满足硬规则，你必须按 schema 返回 need_more_info 或将 confidence=low，并保持结构可解析。'
    ].join('\n')
  }
  return [
    'You are a product-grade AI module.',
    'You must output STRICT JSON only (no extra text, no markdown, no code fences).',
    'If context is insufficient, follow the schema and keep output parseable.'
  ].join('\n')
}

function formatContext(context: unknown) {
  return JSON.stringify(context, null, 2)
}

export async function aiGoalSetupStepA(opts: { brief: GoalBriefInput; locale: Locale }): Promise<GoalSetupStepAOutput> {
  const system = [
    jsonOnlyRule(opts.locale),
    'Schema: GoalSetupStepAOutput',
    'Output JSON shape:',
    '{',
    '  "type":"goal_setup_stepA",',
    '  "understanding":{"goal_summary":"string","key_constraints":["string"],"likely_failure_reasons":["string"],"leverage_point":"string"},',
    '  "clarifying_questions":[{"id":"q1","question":"string","type":"single_choice|short_text","options":["string"],"required":true}],',
    '  "need_more_info":{"blocking":false,"missing":["string"],"message":"string"},',
    '  "confidence":"low|medium|high"',
    '}',
    'Hard rules:',
    '- Default 2-3 clarifying_questions with low-friction single_choice/short_text.',
    '- If blocking=true: clarifying_questions must be [], missing must be 2-3 items.',
    '- understanding.goal_summary must be specific and readable.',
    '- No actions list in StepA.'
  ].join('\n')

  const user = [
    'GoalBrief (context JSON):',
    formatContext(opts.brief),
    'Task:',
    '- Produce understanding + 2-3 clarifying questions.',
    '- If key info missing, set need_more_info.blocking=true and list 2-3 minimal missing items.'
  ].join('\n')

  return generateWithSingleRepair({
    locale: opts.locale,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    call: (messages) => callAIChatJSON({ messages }),
    parse: parseGoalSetupStepA
  })
}

export async function aiGoalSetupStepB(opts: {
  brief: GoalBriefInput
  answers: Record<string, string>
  locale: Locale
}): Promise<GoalSetupStepBOutput> {
  const system = [
    jsonOnlyRule(opts.locale),
    'Schema: GoalSetupStepBOutput',
    'Output JSON shape:',
    '{',
    '  "type":"goal_setup_stepB",',
    '  "actions":[{"title":"string","why":"string","definition_of_done":"string","estimated_minutes":10,"action_type":"core|maintenance|learning|review|rest","priority":"high|medium|low|null"}],',
    '  "success_criteria":[{"type":"outcome|process","text":"string"}],',
    '  "stop_criteria":[{"type":"resource|direction","text":"string"}],',
    '  "if_then_plans":[{"if":"string","then":"string","minimal_action_minutes":5}],',
    '  "confidence":"low|medium|high"',
    '}',
    'Hard rules:',
    '- actions length 6-10; if insufficient info, 3-5 allowed only with confidence=low.',
    '- each action estimated_minutes must be 5-20, title executable (verb + object), definition_of_done verifiable.',
    '- success_criteria must include at least 1 outcome and 1 process, total >=2.',
    '- stop_criteria must include at least 1 resource and 1 direction, total >=2.',
    '- if_then_plans length 1-2; minimal_action_minutes must be 5-10.'
  ].join('\n')

  const user = [
    'GoalBrief (context JSON):',
    formatContext(opts.brief),
    'Clarifying answers (JSON):',
    formatContext(opts.answers),
    'Task:',
    '- Generate draft actions + criteria + if-then plans.'
  ].join('\n')

  return generateWithSingleRepair({
    locale: opts.locale,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    call: (messages) => callAIChatJSON({ messages }),
    parse: parseGoalSetupStepB
  })
}

export async function aiTodayPlan(opts: {
  locale: Locale
  today: string
  goals: Array<{
    id: string
    title: string
    priority?: string | null
    start_date?: string | null
    end_date?: string | null
    success_criteria?: string | null
    stop_criteria?: string | null
  }>
  recent_context?: {
    completion_rate_7d?: number | null
    likely_frictions?: string[] | null
  }
}): Promise<TodayPlanOutput> {
  const system = [
    jsonOnlyRule(opts.locale),
    'Schema: TodayPlanOutput',
    'Output JSON shape:',
    '{',
    '  "type":"today_plan",',
    '  "recommendations":[{',
    '    "kind":"core|alt",',
    '    "goal_id":"string|null",',
    '    "reason":"string",',
    '    "variants":[',
    '      {"minutes":5,"title":"string","first_step":"string","definition_of_done":"string"},',
    '      {"minutes":10,"title":"string","first_step":"string","definition_of_done":"string"},',
    '      {"minutes":20,"title":"string","first_step":"string","definition_of_done":"string"}',
    '    ]',
    '  }],',
    '  "confidence":"low|medium|high"',
    '}',
    'Hard rules:',
    '- recommendations: 1 core + up to 2 alt.',
    '- core goal_id must be one of provided goal ids unless you truly cannot decide.',
    '- variants must include 5/10/20 with same intent at different granularity.',
    '- first_step must be 1 sentence <= 30 chars (Chinese) / <= 30 chars overall.',
    '- titles executable (verb + object).'
  ].join('\n')

  const user = [
    `Today: ${opts.today}`,
    'Candidate goals (JSON):',
    formatContext(opts.goals),
    'Recent context (optional JSON):',
    formatContext(opts.recent_context ?? {}),
    'Task:',
    '- Pick ONE best core action for today and provide 5/10/20 variants.',
    '- Provide up to two alternative options (kind=alt).'
  ].join('\n')

  return generateWithSingleRepair({
    locale: opts.locale,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    call: (messages) => callAIChatJSON({ messages }),
    parse: parseTodayPlan
  })
}

export async function aiRescue(opts: {
  locale: Locale
  reason_tag: RescueOutput['reason_tag']
  action: { id: string; title: string; description?: string | null }
  goal: { id: string; title: string }
}): Promise<RescueOutput> {
  const system = [
    jsonOnlyRule(opts.locale),
    'Schema: RescueOutput',
    'Output JSON shape:',
    '{',
    '  "type":"rescue",',
    '  "reason_tag":"no_time|too_hard|anxiety|unclear_next|low_energy|other",',
    '  "minimal_variant":{"minutes":5,"title":"string","first_step":"string","definition_of_done":"string"},',
    '  "if_then":{"if":"string","then":"string"},',
    '  "confidence":"low|medium|high"',
    '}',
    'Hard rules:',
    '- minimal_variant.minutes must be 5.',
    '- minimal_variant must be executable and can be finished in 5-10 minutes.',
    '- first_step <= 30 chars.'
  ].join('\n')

  const user = [
    'Goal (JSON):',
    formatContext(opts.goal),
    'Current action (JSON):',
    formatContext(opts.action),
    `Reason tag: ${opts.reason_tag}`,
    'Task: Provide a 5-minute minimal version + if-then + first step.'
  ].join('\n')

  return generateWithSingleRepair({
    locale: opts.locale,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    call: (messages) => callAIChatJSON({ messages }),
    parse: parseRescue
  })
}

export async function aiReview(opts: {
  locale: Locale
  today: string
  score: number | null
  answers: Record<string, string>
}): Promise<ReviewOutput> {
  const system = [
    jsonOnlyRule(opts.locale),
    'Schema: ReviewOutput',
    'Output JSON shape:',
    '{',
    '  "type":"review",',
    '  "summary_sentence":"string",',
    '  "detected_friction_tag":"string|null",',
    '  "tomorrow_card":{',
    '    "risk":"string",',
    '    "if_then":{"if":"string","then":"string"},',
    '    "suggested_core_action_direction":"string"',
    '  },',
    '  "confidence":"low|medium|high"',
    '}',
    'Hard rules:',
    '- summary_sentence <= 30 chars.',
    '- tomorrow_card.if_then.then must be a minimal action, not pressure.',
    '- Keep output short and actionable.'
  ].join('\n')

  const user = [
    `Today: ${opts.today}`,
    `Score: ${opts.score == null ? 'null' : String(opts.score)}`,
    'Answers (JSON):',
    formatContext(opts.answers),
    'Task: Summarize today in one sentence and provide a tomorrow anti-fail card.'
  ].join('\n')

  return generateWithSingleRepair({
    locale: opts.locale,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    call: (messages) => callAIChatJSON({ messages }),
    parse: parseReview
  })
}

