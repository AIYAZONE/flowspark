import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function isMissingRelationError(message: string | undefined) {
  const text = (message || '').toLowerCase()
  return text.includes('does not exist') || text.includes('relation') || text.includes('schema cache')
}

type SnapshotSummary = {
  completionRate7d: number | null
  completionRate30d: number | null
  scoreAvg7d: number | null
  momentumBucket: 'high' | 'medium' | 'low' | 'unknown'
}

function isoDateNDaysAgo(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function isoTimestampNDaysAgo(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function summarizeBehavior(params: {
  recentActions: Array<{
    type?: string | null
    completed?: boolean | null
    created_at?: string | null
    updated_at?: string | null
  }>
  recentScores: Array<{ score?: number | null }>
}): SnapshotSummary & {
  actionsCreated7d: number
  actionsCompleted7d: number
} {
  const { recentActions, recentScores } = params
  const sinceTs7 = isoTimestampNDaysAgo(7)
  const sinceTs30 = isoTimestampNDaysAgo(30)

  const coreCreated7d = recentActions.filter(
    a => a.type === 'core' && typeof a.created_at === 'string' && a.created_at >= sinceTs7
  ).length
  const coreCompleted7d = recentActions.filter(
    a => a.type === 'core' && a.completed === true && typeof a.updated_at === 'string' && a.updated_at >= sinceTs7
  ).length
  const coreCreated30d = recentActions.filter(
    a => a.type === 'core' && typeof a.created_at === 'string' && a.created_at >= sinceTs30
  ).length
  const coreCompleted30d = recentActions.filter(
    a => a.type === 'core' && a.completed === true && typeof a.updated_at === 'string' && a.updated_at >= sinceTs30
  ).length

  const completionRate7d = coreCreated7d > 0 ? Math.min(1, coreCompleted7d / coreCreated7d) : null
  const completionRate30d = coreCreated30d > 0 ? Math.min(1, coreCompleted30d / coreCreated30d) : null
  const validScores = recentScores
    .map(row => (typeof row.score === 'number' ? row.score : null))
    .filter((score): score is number => typeof score === 'number')
  const scoreAvg7d = validScores.length
    ? Math.round((validScores.reduce((sum, score) => sum + score, 0) / validScores.length) * 10) / 10
    : null

  const momentumBucket =
    coreCompleted7d >= 4 ? 'high'
    : coreCompleted7d >= 2 ? 'medium'
    : coreCreated7d >= 1 ? 'low'
    : 'unknown'

  return {
    completionRate7d,
    completionRate30d,
    scoreAvg7d,
    momentumBucket,
    actionsCreated7d: coreCreated7d,
    actionsCompleted7d: coreCompleted7d,
  }
}

export async function getBehaviorSnapshotSummary(params: {
  supabase: SupabaseServerClient
  userId: string
}): Promise<SnapshotSummary> {
  const { supabase, userId } = params
  const today = new Date().toISOString().slice(0, 10)

  const { data: snapshotRow, error: snapshotError } = await supabase
    .from('user_behavior_daily_snapshots')
    .select('completion_rate, momentum_bucket, daily_score')
    .eq('user_id', userId)
    .eq('snapshot_date', today)
    .maybeSingle()

  if (!snapshotError && snapshotRow) {
    return {
      completionRate7d: (snapshotRow.completion_rate as number | null) ?? null,
      completionRate30d: null,
      scoreAvg7d: (snapshotRow.daily_score as number | null) ?? null,
      momentumBucket:
        (snapshotRow.momentum_bucket as SnapshotSummary['momentumBucket'] | null) ?? 'unknown',
    }
  }

  const sinceTs30 = isoTimestampNDaysAgo(30)
  const sinceDate7 = isoDateNDaysAgo(7)

  const [{ data: recentActions }, { data: recentScores }] = await Promise.all([
    supabase
      .from('actions')
      .select('type, completed, created_at, updated_at')
      .eq('user_id', userId)
      .or(`created_at.gte.${sinceTs30},updated_at.gte.${sinceTs30}`)
      .limit(500),
    supabase
      .from('daily_scores')
      .select('score_date, score')
      .eq('user_id', userId)
      .gte('score_date', sinceDate7)
      .order('score_date', { ascending: true })
      .limit(14),
  ])

  const summary = summarizeBehavior({
    recentActions: (recentActions || []) as Array<{
      type?: string | null
      completed?: boolean | null
      created_at?: string | null
      updated_at?: string | null
    }>,
    recentScores: (recentScores || []) as Array<{ score?: number | null }>,
  })

  return {
    completionRate7d: summary.completionRate7d,
    completionRate30d: summary.completionRate30d,
    scoreAvg7d: summary.scoreAvg7d,
    momentumBucket: summary.momentumBucket,
  }
}

export async function upsertBehaviorSnapshot(params: {
  supabase: SupabaseServerClient
  userId: string
  snapshotDate: string
}) {
  const { supabase, userId, snapshotDate } = params
  const sinceTs30 = isoTimestampNDaysAgo(30)
  const sinceDate7 = isoDateNDaysAgo(7)

  const [{ data: recentActions }, { data: recentScores }] = await Promise.all([
    supabase
      .from('actions')
      .select('type, completed, created_at, updated_at')
      .eq('user_id', userId)
      .or(`created_at.gte.${sinceTs30},updated_at.gte.${sinceTs30}`)
      .limit(500),
    supabase
      .from('daily_scores')
      .select('score_date, score')
      .eq('user_id', userId)
      .gte('score_date', sinceDate7)
      .order('score_date', { ascending: true })
      .limit(14),
  ])

  const summary = summarizeBehavior({
    recentActions: (recentActions || []) as Array<{
      type?: string | null
      completed?: boolean | null
      created_at?: string | null
      updated_at?: string | null
    }>,
    recentScores: (recentScores || []) as Array<{ score?: number | null }>,
  })

  const { error } = await supabase.from('user_behavior_daily_snapshots').upsert(
    {
      user_id: userId,
      snapshot_date: snapshotDate,
      actions_created: summary.actionsCreated7d,
      actions_completed: summary.actionsCompleted7d,
      core_actions_completed: summary.actionsCompleted7d,
      completion_rate: summary.completionRate7d,
      daily_score: summary.scoreAvg7d == null ? null : Math.round(summary.scoreAvg7d),
      momentum_bucket: summary.momentumBucket,
      active_time_bucket: null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,snapshot_date' }
  )

  if (error && !isMissingRelationError(error.message)) {
    throw error
  }
}
