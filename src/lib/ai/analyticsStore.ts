import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

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

function isoDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function isMissingRelationError(message: string | undefined) {
  const text = (message || '').toLowerCase()
  return text.includes('does not exist') || text.includes('relation') || text.includes('schema cache')
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
}): Promise<AIRecentRecommendationRow[]> {
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
    .select(
      'id, scene, strategy_version, prompt_version, model, confidence, status, fallback_used, created_at, ai_recommendation_outcomes(adopted, completed, option_selected, feedback_label)'
    )
    .eq('user_id', userId)
    .gte('created_at', since || '1970-01-01T00:00:00.000Z')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (scene) {
    fallbackQuery = fallbackQuery.eq('scene', scene)
  }

  const fallback = await fallbackQuery

  if (fallback.error) throw fallback.error

  return ((fallback.data || []) as Array<Record<string, unknown>>).map((row) => {
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
