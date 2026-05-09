import type { createClient } from '@/lib/supabase/server'
import { getGrowthProfile } from '@/lib/userState'
import { getBehaviorSnapshotSummary } from '@/lib/snapshots'
import { getTodayInTZ } from '@/lib/time'
import type { CoachActionBrief, CoachContext, CoachScene } from '@/lib/ai/types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function isoTimestampNDaysAgo(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function normalizeLocale(locale: string | null | undefined): 'zh' | 'en' {
  return String(locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function isMissingRelationError(message: string | undefined) {
  const text = (message || '').toLowerCase()
  return text.includes('does not exist') || text.includes('relation') || text.includes('schema cache')
}

function normalizeActionRow(row: Record<string, unknown>): CoachActionBrief | null {
  const id = asString(row.id) || ''
  const title = asString(row.title) || ''
  if (!id || !title) return null
  const goal = row.goals && typeof row.goals === 'object' && !Array.isArray(row.goals)
    ? row.goals as Record<string, unknown>
    : null
  if ((asString(goal?.status) || '') === 'archived') return null
  return {
    id,
    title,
    description: asString(row.description),
    goalId: asString(row.goal_id),
    goalTitle: asString(goal?.title),
    type: asString(row.type),
    priority: asString(row.priority),
    completed: typeof row.completed === 'boolean' ? row.completed : false,
    startDate: asString(row.start_date),
    endDate: asString(row.end_date),
    updatedAt: asString(row.updated_at),
  }
}

function dedupeActions(actions: CoachActionBrief[], max: number) {
  const seen = new Set<string>()
  const out: CoachActionBrief[] = []
  for (const action of actions) {
    if (!action.id || seen.has(action.id)) continue
    seen.add(action.id)
    out.push(action)
    if (out.length >= max) break
  }
  return out
}

async function getRecentActions(params: {
  supabase: SupabaseServerClient
  userId: string
  timezone: string
}) {
  const { supabase, userId, timezone } = params
  const today = getTodayInTZ(timezone)
  const selectFields = 'id,title,description,goal_id,type,priority,completed,start_date,end_date,updated_at,goals(id,title,status)'

  let { data, error } = await supabase
    .from('actions')
    .select(selectFields)
    .eq('user_id', userId)
    .order('completed', { ascending: true })
    .order('updated_at', { ascending: false })
    .limit(30)

  if ((error || !data || data.length === 0) && (error?.code === '42703' || !data || data.length === 0)) {
    const fallback = await supabase
      .from('actions')
      .select(selectFields)
      .eq('owner_id', userId)
      .order('completed', { ascending: true })
      .order('updated_at', { ascending: false })
      .limit(30)
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    if (!isMissingRelationError(error.message)) {
      console.error('getRecentActions failed', error)
    }
    return {
      todayOpen: [] as CoachActionBrief[],
      overdueOpen: [] as CoachActionBrief[],
      recentCompleted: [] as CoachActionBrief[],
    }
  }

  const normalized = ((data || []) as Array<Record<string, unknown>>)
    .map(normalizeActionRow)
    .filter((row): row is CoachActionBrief => !!row)

  const todayOpen = normalized.filter(action => {
    if (action.completed) return false
    const start = action.startDate || ''
    const end = action.endDate || action.startDate || ''
    return !!start && start <= today && !!end && end >= today
  })

  const overdueOpen = normalized.filter(action => {
    if (action.completed) return false
    const base = action.endDate || action.startDate || ''
    return !!base && base < today
  })

  const recentCompleted = normalized.filter(action => {
    if (!action.completed) return false
    const updated = action.updatedAt || ''
    return !!updated
  })

  return {
    todayOpen: dedupeActions(todayOpen, 5),
    overdueOpen: dedupeActions(overdueOpen, 5),
    recentCompleted: dedupeActions(recentCompleted, 5),
  }
}

async function getRecentAI(params: {
  supabase: SupabaseServerClient
  userId: string
}) {
  const { supabase, userId } = params
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('scene, ai_recommendation_outcomes(adopted, completed)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) {
    console.error('getRecentAI failed', error)
    return [] as CoachContext['recentAI']
  }

  return ((data || []) as Array<{
    scene?: string | null
    ai_recommendation_outcomes?: Array<{ adopted?: boolean | null; completed?: boolean | null }> | null
  }>).map(row => ({
    scene: row.scene || 'unknown',
    adopted: row.ai_recommendation_outcomes?.[0]?.adopted ?? null,
    completed: row.ai_recommendation_outcomes?.[0]?.completed ?? null,
  }))
}

async function getStructuredFrictions(params: {
  supabase: SupabaseServerClient
  userId: string
}) {
  const { supabase, userId } = params
  const sinceTs = isoTimestampNDaysAgo(30)
  const { data, error } = await supabase
    .from('user_friction_events')
    .select('reason_tag, created_at')
    .eq('user_id', userId)
    .gte('created_at', sinceTs)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    if (!isMissingRelationError(error.message)) {
      console.error('getStructuredFrictions failed', error)
    }
    return null
  }

  const stats = new Map<string, { count: number; lastOccurredAt: string }>()
  for (const row of (data || []) as Array<{ reason_tag?: string | null; created_at?: string | null }>) {
    const reasonTag = row.reason_tag || ''
    const createdAt = row.created_at || new Date().toISOString()
    if (!reasonTag) continue
    const current = stats.get(reasonTag)
    if (!current) {
      stats.set(reasonTag, { count: 1, lastOccurredAt: createdAt })
      continue
    }
    current.count += 1
    if (createdAt > current.lastOccurredAt) current.lastOccurredAt = createdAt
  }

  return [...stats.entries()]
    .map(([reasonTag, value]) => ({
      reasonTag,
      count: value.count,
      lastOccurredAt: value.lastOccurredAt,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

async function getFallbackFrictionsFromRecentEvents(params: {
  supabase: SupabaseServerClient
  userId: string
}) {
  const { supabase, userId } = params
  const sinceTs = isoTimestampNDaysAgo(30)
  const { data, error } = await supabase
    .from('user_profiles')
    .select('ai_recent_events')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('getFallbackFrictionsFromRecentEvents failed', error)
    return [] as CoachContext['frictions']
  }

  const events = Array.isArray((data as { ai_recent_events?: unknown } | null)?.ai_recent_events)
    ? ((data as { ai_recent_events: unknown[] }).ai_recent_events)
    : []

  const frictionCounts = new Map<string, { count: number; lastOccurredAt: string }>()
  for (const event of events) {
    if (!event || typeof event !== 'object') continue
    const evt = event as Record<string, unknown>
    const ts = asString(evt.ts) || new Date().toISOString()
    if (ts < sinceTs) continue
    const name = asString(evt.name) || ''
    const meta = evt.meta && typeof evt.meta === 'object' && !Array.isArray(evt.meta)
      ? (evt.meta as Record<string, unknown>)
      : null
    if (!meta) continue

    let reasonTag: string | null = null
    if (name === 'ai_rescue_apply') {
      reasonTag = asString(meta.reason)
    } else if (name === 'ai_review_generated') {
      reasonTag = asString(meta.friction)
    }

    if (!reasonTag) continue
    const current = frictionCounts.get(reasonTag)
    if (!current) {
      frictionCounts.set(reasonTag, { count: 1, lastOccurredAt: ts })
      continue
    }
    current.count += 1
    if (ts > current.lastOccurredAt) current.lastOccurredAt = ts
  }

  return [...frictionCounts.entries()]
    .map(([reasonTag, value]) => ({
      reasonTag,
      count: value.count,
      lastOccurredAt: value.lastOccurredAt,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export async function buildCoachContext(params: {
  supabase: SupabaseServerClient
  userId: string
  scene: CoachScene
  locale: 'zh' | 'en'
  timezone?: string
  requestedActionContext?: CoachActionBrief[]
}) : Promise<CoachContext> {
  const { supabase, userId, locale, timezone = 'UTC', requestedActionContext = [] } = params

  const [{ data: profile }, { data: goals }, growthProfile, behavior, recentAI, frictions, recentActions] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('locale')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('goals')
      .select('id, title, priority, status, start_date, end_date, success_criteria, stop_criteria')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    getGrowthProfile({ supabase, userId }),
    getBehaviorSnapshotSummary({ supabase, userId }),
    getRecentAI({ supabase, userId }),
    getStructuredFrictions({ supabase, userId }),
    getRecentActions({ supabase, userId, timezone }),
  ])

  const fallbackFrictions = frictions ?? await getFallbackFrictionsFromRecentEvents({ supabase, userId })
  const requestedOpen = requestedActionContext.filter(action => !action.completed)
  const actionContext = {
    todayOpen: dedupeActions([...requestedOpen, ...recentActions.todayOpen], 5),
    overdueOpen: dedupeActions(recentActions.overdueOpen, 5),
    recentCompleted: dedupeActions(recentActions.recentCompleted, 5),
    candidateActions: dedupeActions(
      [...requestedOpen, ...recentActions.todayOpen, ...recentActions.overdueOpen],
      5
    ),
  }

  return {
    identity: {
      userId,
      locale: normalizeLocale((profile as { locale?: string | null } | null)?.locale || locale),
      timezone,
    },
    profile: growthProfile,
    goals: ((goals || []) as Array<{
      id?: string
      title?: string
      priority?: string | null
      status?: string | null
      start_date?: string | null
      end_date?: string | null
      success_criteria?: string | null
      stop_criteria?: string | null
    }>).map(goal => ({
      id: goal.id || '',
      title: goal.title || '',
      priority: goal.priority ?? null,
      status: goal.status ?? null,
      startDate: goal.start_date ?? null,
      endDate: goal.end_date ?? null,
      successCriteria: goal.success_criteria ?? null,
      stopCriteria: goal.stop_criteria ?? null,
    })).filter(goal => goal.id && goal.title),
    behavior: {
      completionRate7d: behavior.completionRate7d,
      completionRate30d: behavior.completionRate30d,
      scoreAvg7d: behavior.scoreAvg7d,
      momentumBucket: behavior.momentumBucket,
      activeTimeBucket: behavior.activeTimeBucket,
    },
    frictions: fallbackFrictions,
    recentAI,
    actionContext,
  }
}
