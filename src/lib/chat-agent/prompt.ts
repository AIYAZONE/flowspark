import type { ChatMessage } from '../ai/client.ts'
import type { ChatAgentSurface } from './schemas.ts'

type Locale = 'zh' | 'en'

type PromptGoal = {
  id: string
  title: string
  priority: string | null
  start_date: string | null
  end_date: string | null
}

type PromptAction = {
  id: string
  title: string
  goalId: string | null
  goalTitle: string | null
  priority: string | null
  type: string | null
}

type PromptTurn = {
  userText: string
  assistantText: string
  state: string
  sourcePage: ChatAgentSurface
}

function formatContext(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function buildSystemPrompt(locale: Locale) {
  if (locale === 'zh') {
    return [
      '你是 Flowspark 的系统对话理解层，不是 FAQ，也不是关键词命中器。',
      '你的任务是先理解用户真正想解决什么，再输出结构化 JSON，帮助系统决定下一步。',
      '你必须允许自然表达、模糊表达、复合表达；不能要求用户使用固定句式。',
      '如果用户表达的是情绪、阻力、拖延、犹豫、想先缓一缓，也要把它理解成真实需求，而不是直接判失败。',
      '你必须只输出严格 JSON，不能输出解释、markdown、代码块。',
      '如果当前能力做不到精确执行，也要输出“已理解的部分 + 缺失的部分 + 最短下一步”，不要装作完全没懂。',
      'judgement 和 next_step 必须直接对用户说话，禁止写成内部分析口吻。',
      '不要出现“用户明确要求”“系统应当”“该请求属于”“最近一次系统已给出”这类过程描述。',
      '字段要求：',
      '- type 固定为 "chat_understanding"',
      '- intent_type ∈ capability_answer | review_current_tasks | review_main_path | create_action_request | general_guidance | clarify_missing_info | unsupported_but_understood',
      '- reply_mode ∈ answer | execute | clarify',
      '- recommended_surface ∈ chat | system | today | goals | profile',
      '- needs_clarification 为 boolean',
      '- 若 needs_clarification=true 或 reply_mode=clarify，则 clarifying_question 必须存在',
      '- confidence ∈ low | medium | high',
      '判定原则：',
      '- 用户在问“你能做什么”时，用 capability_answer',
      '- 用户在问“现在该做什么 / 下一步是什么”时，用 review_current_tasks',
      '- 用户在问“主线 / 最重要 / 优先哪个”时，用 review_main_path',
      '- 用户想创建行动时，用 create_action_request',
      '- 用户要求“列出来/清单/重新看下我需要做什么/有哪些任务”时：仍用 review_current_tasks，但 reply_mode=answer，并在 judgement 里直接给出清单式表达（不要只让用户跳转页面）。',
      '- 用户在看过清单后说“第一个/第二个/1/2/3”时：仍用 review_current_tasks，reply_mode=execute，并把选中的任务标题写入 suggested_action_title（必须来自 open_actions_json 里的 title）。',
      '- 用户在表达拖延、状态、情绪、犹豫、切换优先级时，优先用 general_guidance 或 clarify_missing_info',
      '- 只有真的做不到执行、但你已经理解其意图时，才用 unsupported_but_understood',
      'judgement 要像系统判断，不要像客服话术；next_step 要短、明确、可继续。',
    ].join('\n')
  }

  return [
    'You are the system conversation understanding layer for Flowspark.',
    'You are not an FAQ bot and not a keyword matcher.',
    'Your job is to infer what the user is truly trying to solve, then output strict JSON only.',
    'Allow natural, vague, and compound phrasing. Do not require the user to follow fixed templates.',
    'If the user expresses emotion, friction, procrastination, or avoidance, treat that as a real need instead of failure.',
    'If the request cannot be executed exactly, still capture what is understood, what is missing, and the shortest next step.',
  ].join('\n')
}

export function buildChatAgentMessages(params: {
  locale: Locale
  userText: string
  sourcePage: ChatAgentSurface
  goals: PromptGoal[]
  openActions: PromptAction[]
  recentTurns: PromptTurn[]
}) {
  const system = buildSystemPrompt(params.locale)
  const user = [
    `source_page: ${params.sourcePage}`,
    'user_input:',
    params.userText,
    'recent_turns_json:',
    formatContext(params.recentTurns.slice(-3)),
    'active_goals_json:',
    formatContext(params.goals.slice(0, 6)),
    'open_actions_json:',
    formatContext(params.openActions.slice(0, 8)),
    'Output JSON shape:',
    '{',
    '  "type":"chat_understanding",',
    '  "intent_type":"capability_answer|review_current_tasks|review_main_path|create_action_request|general_guidance|clarify_missing_info|unsupported_but_understood",',
    '  "user_goal_summary":"string",',
    '  "reasoning_summary":"string",',
    '  "judgement":"string",',
    '  "next_step":"string",',
    '  "reply_mode":"answer|execute|clarify",',
    '  "needs_clarification":true,',
    '  "clarifying_question":"string|null",',
    '  "suggested_action_title":"string|null",',
    '  "target_path_hint":"string|null",',
    '  "recommended_surface":"chat|system|today|goals|profile",',
    '  "confidence":"low|medium|high"',
    '}',
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ] satisfies ChatMessage[]
}
