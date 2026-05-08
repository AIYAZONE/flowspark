import { callAIChatJSON } from '@/lib/ai/client'
import type { CoachContext, WeeklyInsightOutput } from '@/lib/ai/types'

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null
}

function normalizeConfidence(value: unknown): WeeklyInsightOutput['confidence'] {
  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined
}

function parseWeeklyInsight(payload: unknown): WeeklyInsightOutput | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const row = payload as Record<string, unknown>
  const summary = asString(row.summary)
  const recommendation = asString(row.recommendation)
  const momentum = row.momentum
  if (!summary || !recommendation) return null
  if (momentum !== 'high' && momentum !== 'medium' && momentum !== 'low' && momentum !== 'unknown') {
    return null
  }

  return {
    type: 'weekly_insight',
    summary,
    momentum,
    strongestTimeBucket: asString(row.strongestTimeBucket),
    topFriction: asString(row.topFriction),
    recommendation,
    confidence: normalizeConfidence(row.confidence),
  }
}

function buildFallbackInsight(context: CoachContext): WeeklyInsightOutput {
  const topFriction = context.frictions[0]?.reasonTag ?? null
  const strongestTimeBucket = context.profile.preferredTimeBucket ?? null
  const momentum = context.behavior.momentumBucket ?? 'unknown'

  const summaryByLocale = context.identity.locale === 'zh'
    ? `最近一周你的行动动量为${momentum === 'high' ? '高' : momentum === 'medium' ? '中' : momentum === 'low' ? '低' : '未知'}。`
    : `Your momentum over the last week is ${momentum}.`

  const recommendationByLocale = context.identity.locale === 'zh'
    ? topFriction === 'no_time'
      ? '下周优先给自己预留固定 10 分钟窗口，并把核心行动压缩到可立即开始。'
      : '下周继续保持单日单核心行动，优先选择低摩擦、可见结果快的任务。'
    : topFriction === 'no_time'
      ? 'Reserve a fixed 10-minute window next week and shrink the core action to something you can start instantly.'
      : 'Keep one core action per day next week and favor low-friction tasks with fast visible output.'

  return {
    type: 'weekly_insight',
    summary: summaryByLocale,
    momentum,
    strongestTimeBucket,
    topFriction,
    recommendation: recommendationByLocale,
    confidence: 'low',
  }
}

export async function aiWeeklyInsight(params: {
  context: CoachContext
}): Promise<{ output: WeeklyInsightOutput; fallbackUsed: boolean }> {
  const { context } = params
  const locale = context.identity.locale
  const system = locale === 'zh'
    ? [
        '你是一个产品化的周度 AI 教练模块。',
        '你必须只输出严格 JSON，不要输出 markdown 或解释文字。',
        '输出字段：summary、momentum、strongestTimeBucket、topFriction、recommendation、confidence。',
        'summary 要简短明确；recommendation 要是一条下周最值得执行的节奏建议。',
      ].join('\n')
    : [
        'You are a product-grade weekly AI coach module.',
        'Output STRICT JSON only. No markdown or extra text.',
        'Output fields: summary, momentum, strongestTimeBucket, topFriction, recommendation, confidence.',
        'Keep summary concise and make recommendation one practical next-week rhythm suggestion.',
      ].join('\n')

  const user = [
    'Weekly coach context JSON:',
    JSON.stringify(context, null, 2),
  ].join('\n')

  try {
    const raw = await callAIChatJSON({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    const parsed = parseWeeklyInsight(JSON.parse(raw))
    if (!parsed) {
      return { output: buildFallbackInsight(context), fallbackUsed: true }
    }
    return { output: parsed, fallbackUsed: false }
  } catch {
    return { output: buildFallbackInsight(context), fallbackUsed: true }
  }
}
