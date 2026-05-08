import type { createClient } from '@/lib/supabase/server'
import type {
  CoachConfidence,
  CoachScene,
  RecommendationQuality,
  RecommendationStrategySummary,
} from '@/lib/ai/types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type JSONPrimitive = string | number | boolean | null
type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue }

type RecommendationStatus =
  | 'generated'
  | 'adopted'
  | 'completed'
  | 'dismissed'
  | 'expired'
  | 'failed'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toJSONValue(value: unknown): JSONValue {
  if (value === undefined) return null
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(item => toJSONValue(item))
  }
  if (isRecord(value)) {
    const out: Record<string, JSONValue> = {}
    for (const [key, item] of Object.entries(value)) {
      out[key] = toJSONValue(item)
    }
    return out
  }
  return String(value)
}

function isMissingColumnError(error: { code?: string | null; message?: string | null } | null | undefined) {
  const text = (error?.message || '').toLowerCase()
  return error?.code === '42703' || text.includes('column') || text.includes('schema cache')
}

async function updateRecommendationStatus(params: {
  supabase: SupabaseServerClient
  recommendationId: string
  userId: string
  status: RecommendationStatus
}) {
  const { supabase, recommendationId, userId, status } = params
  const { error } = await supabase
    .from('ai_recommendations')
    .update({ status })
    .eq('id', recommendationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function createRecommendation(params: {
  supabase: SupabaseServerClient
  userId: string
  scene: CoachScene
  strategyVersion: string
  promptVersion: string
  model: string
  inputSummary?: unknown
  outputPayload: unknown
  confidence?: CoachConfidence
  fallbackUsed?: boolean
  qualityLabels?: RecommendationQuality | null
  strategySummary?: RecommendationStrategySummary | null
}) {
  const {
    supabase,
    userId,
    scene,
    strategyVersion,
    promptVersion,
    model,
    inputSummary,
    outputPayload,
    confidence,
    fallbackUsed = false,
    qualityLabels = null,
    strategySummary = null,
  } = params

  const baseInsert = {
    user_id: userId,
    scene,
    strategy_version: strategyVersion,
    prompt_version: promptVersion,
    model,
    input_summary: inputSummary == null ? null : toJSONValue(inputSummary),
    output_payload: toJSONValue(outputPayload),
    confidence: confidence ?? null,
    fallback_used: fallbackUsed,
    status: 'generated' as const,
  }

  let { data, error } = await supabase
    .from('ai_recommendations')
    .insert({
      ...baseInsert,
      quality_labels: qualityLabels == null ? null : toJSONValue(qualityLabels),
      strategy_summary: strategySummary == null ? null : toJSONValue(strategySummary),
    })
    .select('id')
    .single()

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('ai_recommendations')
      .insert(baseInsert)
      .select('id')
      .single()

    data = fallback.data
    error = fallback.error
  }

  if (error) throw error
  if (!data?.id) {
    throw new Error('Failed to create ai_recommendation record')
  }
  return data.id as string
}

export async function markRecommendationAdopted(params: {
  supabase: SupabaseServerClient
  recommendationId: string
  userId: string
  optionSelected: '5m' | '10m' | '20m'
  actionId?: string | null
}) {
  const { supabase, recommendationId, userId, optionSelected, actionId = null } = params

  const { error } = await supabase
    .from('ai_recommendation_outcomes')
    .upsert(
      {
        recommendation_id: recommendationId,
        user_id: userId,
        action_id: actionId,
        adopted: true,
        option_selected: optionSelected
      },
      { onConflict: 'recommendation_id' }
    )

  if (error) throw error
  await updateRecommendationStatus({
    supabase,
    recommendationId,
    userId,
    status: 'adopted'
  })
}

export async function markRecommendationDismissed(params: {
  supabase: SupabaseServerClient
  recommendationId: string
  userId: string
  feedbackLabel?: string | null
}) {
  const { supabase, recommendationId, userId, feedbackLabel = 'dismiss' } = params

  const { error } = await supabase
    .from('ai_recommendation_outcomes')
    .upsert(
      {
        recommendation_id: recommendationId,
        user_id: userId,
        adopted: false,
        feedback_label: feedbackLabel
      },
      { onConflict: 'recommendation_id' }
    )

  if (error) throw error
  await updateRecommendationStatus({
    supabase,
    recommendationId,
    userId,
    status: 'dismissed'
  })
}

export async function setRecommendationCompletion(params: {
  supabase: SupabaseServerClient
  recommendationId: string
  userId: string
  completed: boolean
  completionMinutes?: number | null
}) {
  const { supabase, recommendationId, userId, completed, completionMinutes = null } = params

  const { error } = await supabase
    .from('ai_recommendation_outcomes')
    .upsert(
      {
        recommendation_id: recommendationId,
        user_id: userId,
        adopted: true,
        completed,
        completion_minutes: completed ? completionMinutes : null
      },
      { onConflict: 'recommendation_id' }
    )

  if (error) throw error
  await updateRecommendationStatus({
    supabase,
    recommendationId,
    userId,
    status: completed ? 'completed' : 'adopted'
  })
}
