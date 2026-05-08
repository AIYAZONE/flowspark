import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type AIMetricRow = {
  scene?: string
  strategy_version?: string
  prompt_version?: string
  model?: string
  recommendation_count: number
  adopted_count: number
  completed_count: number
  dismissed_count: number
  adoption_rate: number
  completion_rate: number
  fallback_rate: number
  avg_confidence_score: number | null
}

export type AIRecentRecommendationRow = {
  recommendation_id: string
  scene: string
  strategy_version: string
  prompt_version: string
  model: string
  confidence: string | null
  status: string
  fallback_used: boolean
  adopted: boolean | null
  completed: boolean | null
  option_selected: string | null
  feedback_label: string | null
  created_at: string
}

type MetricsQueryOptions = {
  days?: number
  scene?: string
}

export type AIRecommendationDetailRow = AIRecentRecommendationRow & {
  input_summary: unknown
  output_payload: unknown
  completion_minutes: number | null
}

function isoDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function isMissingRelationError(message: string | undefined) {
  const text = (message || '').toLowerCase()
  return text.includes('does not exist') || text.includes('relation') || text.includes('schema cache')
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toMetricRow(value: Record<string, unknown>): AIMetricRow {
  return {
    scene: typeof value.scene === 'string' ? value.scene : undefined,
    strategy_version: typeof value.strategy_version === 'string' ? value.strategy_version : undefined,
    prompt_version: typeof value.prompt_version === 'string' ? value.prompt_version : undefined,
    model: typeof value.model === 'string' ? value.model : undefined,
    recommendation_count: toNumber(value.recommendation_count),
    adopted_count: toNumber(value.adopted_count),
    completed_count: toNumber(value.completed_count),
    dismissed_count: toNumber(value.dismissed_count),
    adoption_rate: toNumber(value.adoption_rate),
    completion_rate: toNumber(value.completion_rate),
    fallback_rate: toNumber(value.fallback_rate),
    avg_confidence_score:
      typeof value.avg_confidence_score === 'number' && Number.isFinite(value.avg_confidence_score)
        ? value.avg_confidence_score
        : null,
  }
}

function groupRows(rows: AIRecentRecommendationRow[], keyFn: (row: AIRecentRecommendationRow) => string) {
  const map = new Map<string, AIMetricRow>()
  for (const row of rows) {
    const key = keyFn(row)
    const current = map.get(key) || {
      recommendation_count: 0,
      adopted_count: 0,
      completed_count: 0,
      dismissed_count: 0,
      adoption_rate: 0,
      completion_rate: 0,
      fallback_rate: 0,
      avg_confidence_score: null,
      scene: row.scene,
      strategy_version: row.strategy_version,
      prompt_version: row.prompt_version,
      model: row.model,
    }
    current.recommendation_count += 1
    current.adopted_count += row.adopted ? 1 : 0
    current.completed_count += row.completed ? 1 : 0
    current.dismissed_count += row.status === 'dismissed' || row.feedback_label === 'dismiss' || row.feedback_label === 'close_result' ? 1 : 0
    current.fallback_rate += row.fallback_used ? 1 : 0
    const score = row.confidence === 'high' ? 3 : row.confidence === 'medium' ? 2 : row.confidence === 'low' ? 1 : null
    if (score != null) {
      current.avg_confidence_score = (current.avg_confidence_score ?? 0) + score
    }
    map.set(key, current)
  }

  return [...map.values()].map(row => ({
    ...row,
    adoption_rate: row.recommendation_count ? row.adopted_count / row.recommendation_count : 0,
    completion_rate: row.recommendation_count ? row.completed_count / row.recommendation_count : 0,
    fallback_rate: row.recommendation_count ? row.fallback_rate / row.recommendation_count : 0,
    avg_confidence_score:
      row.avg_confidence_score == null || row.recommendation_count === 0
        ? null
        : Number((row.avg_confidence_score / row.recommendation_count).toFixed(2)),
  }))
}

function mapRecentRow(row: Record<string, unknown>): AIRecentRecommendationRow {
  return {
    recommendation_id: String(row.recommendation_id || row.id || ''),
    scene: String(row.scene || ''),
    strategy_version: String(row.strategy_version || ''),
    prompt_version: String(row.prompt_version || ''),
    model: String(row.model || ''),
    confidence: typeof row.confidence === 'string' ? row.confidence : null,
    status: String(row.status || ''),
    fallback_used: Boolean(row.fallback_used),
    adopted: typeof row.adopted === 'boolean' ? row.adopted : null,
    completed: typeof row.completed === 'boolean' ? row.completed : null,
    option_selected: typeof row.option_selected === 'string' ? row.option_selected : null,
    feedback_label: typeof row.feedback_label === 'string' ? row.feedback_label : null,
    created_at: String(row.created_at || ''),
  }
}

export async function getRecentRecommendations(params: {
  supabase: SupabaseServerClient
  userId: string
  limit?: number
  days?: number
  scene?: string
}) : Promise<AIRecentRecommendationRow[]> {
  const { supabase, userId, limit = 20, days, scene } = params
  const since = typeof days === 'number' && days > 0 ? isoDaysAgo(days) : null
  let recentQuery = supabase
    .from('ai_recommendation_recent_view')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (since) {
    recentQuery = recentQuery.gte('created_at', since)
  }
  if (scene) {
    recentQuery = recentQuery.eq('scene', scene)
  }

  const { data, error } = await recentQuery

  if (!error && data) {
    return (data as Record<string, unknown>[]).map(mapRecentRow)
  }

  if (error && !isMissingRelationError(error.message)) throw error

  let fallbackQuery = supabase
    .from('ai_recommendations')
    .select('id, scene, strategy_version, prompt_version, model, confidence, status, fallback_used, created_at, ai_recommendation_outcomes(adopted, completed, option_selected, feedback_label)')
    .eq('user_id', userId)
    .gte('created_at', since || '1970-01-01T00:00:00.000Z')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (scene) {
    fallbackQuery = fallbackQuery.eq('scene', scene)
  }

  const fallback = await fallbackQuery

  if (fallback.error) throw fallback.error

  return ((fallback.data || []) as Array<Record<string, unknown>>).map(row => {
    const outcomes = Array.isArray(row.ai_recommendation_outcomes)
      ? (row.ai_recommendation_outcomes as Array<Record<string, unknown>>)
      : []
    const outcome = outcomes[0] || {}
    return {
      recommendation_id: String(row.id || ''),
      scene: String(row.scene || ''),
      strategy_version: String(row.strategy_version || ''),
      prompt_version: String(row.prompt_version || ''),
      model: String(row.model || ''),
      confidence: typeof row.confidence === 'string' ? row.confidence : null,
      status: String(row.status || ''),
      fallback_used: Boolean(row.fallback_used),
      adopted: typeof outcome.adopted === 'boolean' ? outcome.adopted : null,
      completed: typeof outcome.completed === 'boolean' ? outcome.completed : null,
      option_selected: typeof outcome.option_selected === 'string' ? outcome.option_selected : null,
      feedback_label: typeof outcome.feedback_label === 'string' ? outcome.feedback_label : null,
      created_at: String(row.created_at || ''),
    }
  })
}

export async function getAISceneMetrics(params: {
  supabase: SupabaseServerClient
  userId: string
  options?: MetricsQueryOptions
}): Promise<AIMetricRow[]> {
  const { supabase, userId, options } = params
  const recent = await getRecentRecommendations({
    supabase,
    userId,
    limit: 400,
    days: options?.days,
    scene: options?.scene,
  })
  return groupRows(recent, row => row.scene).sort((a, b) => b.recommendation_count - a.recommendation_count)
}

export async function getAIStrategyMetrics(params: {
  supabase: SupabaseServerClient
  userId: string
  options?: MetricsQueryOptions
}): Promise<AIMetricRow[]> {
  const { supabase, userId, options } = params
  const recent = await getRecentRecommendations({
    supabase,
    userId,
    limit: 400,
    days: options?.days,
    scene: options?.scene,
  })
  return groupRows(recent, row => `${row.scene}:${row.strategy_version}:${row.prompt_version}`)
    .sort((a, b) => b.recommendation_count - a.recommendation_count)
}

export async function getAIModelMetrics(params: {
  supabase: SupabaseServerClient
  userId: string
  options?: MetricsQueryOptions
}): Promise<AIMetricRow[]> {
  const { supabase, userId, options } = params
  const recent = await getRecentRecommendations({
    supabase,
    userId,
    limit: 400,
    days: options?.days,
    scene: options?.scene,
  })
  return groupRows(recent, row => `${row.scene}:${row.model}`).sort((a, b) => b.recommendation_count - a.recommendation_count)
}

export async function getRecommendationDetail(params: {
  supabase: SupabaseServerClient
  userId: string
  recommendationId: string
}): Promise<AIRecommendationDetailRow | null> {
  const { supabase, userId, recommendationId } = params
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select(`
      id,
      scene,
      strategy_version,
      prompt_version,
      model,
      confidence,
      status,
      fallback_used,
      input_summary,
      output_payload,
      created_at,
      ai_recommendation_outcomes (
        adopted,
        completed,
        option_selected,
        feedback_label,
        completion_minutes
      )
    `)
    .eq('id', recommendationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const outcomes = Array.isArray(data.ai_recommendation_outcomes)
    ? (data.ai_recommendation_outcomes as Array<Record<string, unknown>>)
    : []
  const outcome = outcomes[0] || {}
  const recent = mapRecentRow({
    ...data,
    recommendation_id: data.id,
    adopted: outcome.adopted,
    completed: outcome.completed,
    option_selected: outcome.option_selected,
    feedback_label: outcome.feedback_label,
  })

  return {
    ...recent,
    input_summary: data.input_summary ?? null,
    output_payload: data.output_payload ?? null,
    completion_minutes:
      typeof outcome.completion_minutes === 'number' && Number.isFinite(outcome.completion_minutes)
        ? outcome.completion_minutes
        : null,
  }
}

export async function getAISceneDetail(params: {
  supabase: SupabaseServerClient
  userId: string
  scene: string
  days?: number
}) {
  const { supabase, userId, scene, days } = params
  const [sceneMetrics, strategyMetrics, modelMetrics, recentRecommendations] = await Promise.all([
    getAISceneMetrics({ supabase, userId, options: { days, scene } }),
    getAIStrategyMetrics({ supabase, userId, options: { days, scene } }),
    getAIModelMetrics({ supabase, userId, options: { days, scene } }),
    getRecentRecommendations({ supabase, userId, limit: 40, days, scene }),
  ])

  return {
    summary: sceneMetrics[0] || {
      scene,
      recommendation_count: 0,
      adopted_count: 0,
      completed_count: 0,
      dismissed_count: 0,
      adoption_rate: 0,
      completion_rate: 0,
      fallback_rate: 0,
      avg_confidence_score: null,
    },
    strategyMetrics,
    modelMetrics,
    recentRecommendations,
  }
}
