import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type GrowthProfile = {
  primaryGoalArea: string | null
  preferredTimeBucket: string | null
  motivationStyle: string | null
  difficultyTolerance: string | null
  riskOfDropout: string | null
  currentStage: string | null
  summary: string | null
}

function isMissingRelationError(message: string | undefined) {
  const text = (message || '').toLowerCase()
  return text.includes('does not exist') || text.includes('relation') || text.includes('schema cache')
}

export async function getGrowthProfile(params: {
  supabase: SupabaseServerClient
  userId: string
}): Promise<GrowthProfile> {
  const { supabase, userId } = params
  const { data, error } = await supabase
    .from('user_growth_profiles')
    .select(
      [
        'primary_goal_area',
        'preferred_time_bucket',
        'motivation_style',
        'difficulty_tolerance',
        'risk_of_dropout',
        'current_stage',
        'summary',
      ].join(',')
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (!isMissingRelationError(error.message)) {
      console.error('getGrowthProfile failed', error)
    }
    return {
      primaryGoalArea: null,
      preferredTimeBucket: null,
      motivationStyle: null,
      difficultyTolerance: null,
      riskOfDropout: null,
      currentStage: null,
      summary: null,
    }
  }

  const row = (data || null) as Record<string, unknown> | null
  return {
    primaryGoalArea: (row?.primary_goal_area as string | null) ?? null,
    preferredTimeBucket: (row?.preferred_time_bucket as string | null) ?? null,
    motivationStyle: (row?.motivation_style as string | null) ?? null,
    difficultyTolerance: (row?.difficulty_tolerance as string | null) ?? null,
    riskOfDropout: (row?.risk_of_dropout as string | null) ?? null,
    currentStage: (row?.current_stage as string | null) ?? null,
    summary: (row?.summary as string | null) ?? null,
  }
}

export async function upsertGrowthProfileSummary(params: {
  supabase: SupabaseServerClient
  userId: string
  summary: string
  riskOfDropout?: string | null
  currentStage?: string | null
}) {
  const { supabase, userId, summary, riskOfDropout = null, currentStage = null } = params
  const { error } = await supabase.from('user_growth_profiles').upsert(
    {
      user_id: userId,
      summary,
      risk_of_dropout: riskOfDropout,
      current_stage: currentStage,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error && !isMissingRelationError(error.message)) {
    throw error
  }
}
