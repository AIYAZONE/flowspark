type ActionType = 'core' | 'maintenance' | 'learning' | 'review' | 'rest'
type ActionPriority = 'high' | 'medium' | 'low'

export interface AIBreakdownInput {
  goalTitle: string
  goalDescription?: string
  startDate: string
  endDate: string
  locale?: 'en' | 'zh'
}

export interface AIBreakdownActionDraft {
  title: string
  description?: string
  type: ActionType
  priority: ActionPriority
  start_date: string
  end_date: string
  estimated_minutes?: number
}

type AIProvider = 'deepseek' | 'openai'

function isISODateYYYYMMDD(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function normalizeType(value: unknown): ActionType | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'core') return 'core'
  if (v === 'maintenance') return 'maintenance'
  if (v === 'learning') return 'learning'
  if (v === 'review') return 'review'
  if (v === 'rest') return 'rest'
  return null
}

function normalizePriority(value: unknown): ActionPriority | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'high') return 'high'
  if (v === 'medium') return 'medium'
  if (v === 'low') return 'low'
  return null
}

function coerceEstimatedMinutes(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value)
  if (typeof value === 'string') {
    const n = Number.parseInt(value, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return undefined
}

function safeParseJSON(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const sliced = text.slice(start, end + 1)
      return JSON.parse(sliced)
    }
    throw new Error('invalid_json')
  }
}

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, '')
  return `${base}${path}`
}

function parseActions(payload: unknown, fallbackRange: { start: string; end: string }): AIBreakdownActionDraft[] {
  if (!payload || typeof payload !== 'object') return []

  const actionsValue = (payload as { actions?: unknown }).actions
  if (!Array.isArray(actionsValue)) return []

  const result: AIBreakdownActionDraft[] = []

  for (const item of actionsValue) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>

    const title = typeof obj.title === 'string' ? obj.title.trim() : ''
    if (!title) continue

    const type = normalizeType(obj.type) ?? 'core'
    const priority = normalizePriority(obj.priority) ?? 'medium'
    const start_date = isISODateYYYYMMDD(obj.start_date) ? obj.start_date : fallbackRange.start
    const end_date = isISODateYYYYMMDD(obj.end_date) ? obj.end_date : fallbackRange.end
    const description = typeof obj.description === 'string' ? obj.description.trim() : undefined
    const estimated_minutes = coerceEstimatedMinutes(obj.estimated_minutes ?? obj.estimated_time ?? obj.estimatedTime)

    result.push({
      title,
      description,
      type,
      priority,
      start_date,
      end_date,
      estimated_minutes
    })
  }

  return result.slice(0, 20)
}

function buildSystemPrompt(locale: 'en' | 'zh') {
  if (locale === 'zh') {
    return [
      '你是一个产品化的“目标拆解器”。',
      '你必须只输出严格 JSON（不能有多余文本、不能用 markdown）。',
      '输出格式：{ "actions": Action[] }',
      'Action 字段：title(string,必填), description(string,可选), type(one of core|maintenance|learning|review|rest), priority(one of high|medium|low), start_date(YYYY-MM-DD), end_date(YYYY-MM-DD), estimated_minutes(number,可选).',
      '要求：每个 action 可在 5-20 分钟内完成；标题要具体可执行；尽量覆盖整个日期范围；返回 6-10 个 action。'
    ].join('\n')
  }

  return [
    'You are a product-grade goal breakdown assistant.',
    'You must output STRICT JSON only (no extra text, no markdown).',
    'Output format: { "actions": Action[] }',
    'Action fields: title(string,required), description(string,optional), type(one of core|maintenance|learning|review|rest), priority(one of high|medium|low), start_date(YYYY-MM-DD), end_date(YYYY-MM-DD), estimated_minutes(number,optional).',
    'Constraints: each action should take 5-20 minutes; titles must be concrete and executable; cover the full date range; return 6-10 actions.'
  ].join('\n')
}

function buildUserPrompt(input: AIBreakdownInput) {
  const goalDescription = (input.goalDescription || '').trim()
  return [
    `Goal title: ${input.goalTitle}`,
    goalDescription ? `Goal description: ${goalDescription}` : '',
    `Date range: ${input.startDate} to ${input.endDate}`
  ]
    .filter(Boolean)
    .join('\n')
}

export async function breakdownGoalToActions(input: AIBreakdownInput): Promise<AIBreakdownActionDraft[]> {
  const locale: 'en' | 'zh' = input.locale === 'zh' ? 'zh' : 'en'

  if (!input.goalTitle?.trim()) throw new Error('missing_fields')
  if (!isISODateYYYYMMDD(input.startDate) || !isISODateYYYYMMDD(input.endDate)) throw new Error('invalid_date_range')
  if (input.endDate < input.startDate) throw new Error('invalid_date_range')

  const provider: AIProvider =
    (process.env.AI_PROVIDER as AIProvider | undefined) ||
    (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'openai')

  const apiKey =
    process.env.AI_API_KEY ||
    (provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY)
  if (!apiKey) throw new Error('missing_ai_key')

  const baseUrl =
    process.env.AI_BASE_URL ||
    (provider === 'deepseek'
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
      : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'))

  const model =
    process.env.AI_MODEL ||
    (provider === 'deepseek'
      ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
      : (process.env.OPENAI_MODEL || 'gpt-4o-mini'))

  const endpoint =
    provider === 'deepseek'
      ? joinUrl(baseUrl, '/chat/completions')
      : joinUrl(baseUrl, '/chat/completions')

  const messages = [
    { role: 'system', content: buildSystemPrompt(locale) },
    { role: 'user', content: buildUserPrompt(input) }
  ]

  const makeBody = (withResponseFormat: boolean) => {
    const body: Record<string, unknown> = {
      model,
      temperature: 0.2,
      stream: false,
      messages
    }

    if (withResponseFormat && provider === 'openai') {
      body.response_format = { type: 'json_object' }
    }

    return body
  }

  const call = async (withResponseFormat: boolean) => {
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(makeBody(withResponseFormat))
    })
  }

  let response = await call(true)
  if (!response.ok) {
    response = await call(false)
  }

  if (!response.ok) throw new Error('ai_provider_error')

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('empty_ai_response')

  const payload = safeParseJSON(content)
  const actions = parseActions(payload, { start: input.startDate, end: input.endDate })
  if (actions.length === 0) throw new Error('invalid_ai_output')
  return actions
}
