import { planWeeklyInsight } from '@/lib/ai/coachOrchestrator'
import type { WeeklyInsightOutput } from '@/lib/ai/types'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type WeeklyInsightRecord = {
  recommendationId: string
  createdAt: string
  output: WeeklyInsightOutput
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseWeeklyInsightOutput(payload: unknown): WeeklyInsightOutput | null {
  if (!isRecord(payload)) return null
  const type = asString(payload.type)
  const summary = asString(payload.summary)
  const momentum = payload.momentum
  const recommendation = asString(payload.recommendation)
  if (type !== 'weekly_insight' || !summary || !recommendation) return null
  if (momentum !== 'high' && momentum !== 'medium' && momentum !== 'low' && momentum !== 'unknown') {
    return null
  }

  const strongestTimeBucket = asString(payload.strongestTimeBucket)
  const topFriction = asString(payload.topFriction)
  const confidence = payload.confidence === 'low' || payload.confidence === 'medium' || payload.confidence === 'high'
    ? payload.confidence
    : undefined

  return {
    type: 'weekly_insight',
    summary,
    momentum,
    strongestTimeBucket,
    topFriction,
    recommendation,
    confidence,
  }
}

function isoDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export async function getLatestWeeklyInsight(params: {
  supabase: SupabaseServerClient
  userId: string
}) : Promise<WeeklyInsightRecord | null> {
  const { supabase, userId } = params
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('id, created_at, output_payload')
    .eq('user_id', userId)
    .eq('scene', 'weekly_insight')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const output = parseWeeklyInsightOutput((data as Record<string, unknown>).output_payload)
  if (!output) return null

  return {
    recommendationId: String((data as Record<string, unknown>).id || ''),
    createdAt: String((data as Record<string, unknown>).created_at || ''),
    output,
  }
}

export async function getOrCreateWeeklyInsight(params: {
  supabase: SupabaseServerClient
  userId: string
  locale: 'zh' | 'en'
}) : Promise<WeeklyInsightRecord | null> {
  const { supabase, userId, locale } = params
  const latest = await getLatestWeeklyInsight({ supabase, userId })
  if (latest && latest.createdAt >= isoDaysAgo(7)) {
    return latest
  }

  const generated = await planWeeklyInsight({
    supabase,
    userId,
    locale,
  })

  if (!generated.data || !generated.recommendationId) return latest

  return {
    recommendationId: generated.recommendationId,
    createdAt: new Date().toISOString(),
    output: generated.data,
  }
}
