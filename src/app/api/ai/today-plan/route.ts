import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiTodayPlan } from '@/lib/ai/phase2a'

export const runtime = 'nodejs'

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
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

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const locale = input.locale === 'zh' ? 'zh' : 'en'
  const today = typeof input.today === 'string' ? input.today : ''
  const goals = Array.isArray(input.goals) ? input.goals : []
  const requestedRecentContext = (input.recent_context && typeof input.recent_context === 'object') ? (input.recent_context as Record<string, unknown>) : undefined

  if (!today || goals.length === 0) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const coercedGoals = goals
    .filter(g => g && typeof g === 'object')
    .map(g => {
      const obj = g as Record<string, unknown>
      return {
        id: typeof obj.id === 'string' ? obj.id : '',
        title: typeof obj.title === 'string' ? obj.title : '',
        priority: typeof obj.priority === 'string' ? obj.priority : null,
        start_date: typeof obj.start_date === 'string' ? obj.start_date : null,
        end_date: typeof obj.end_date === 'string' ? obj.end_date : null,
        success_criteria: typeof obj.success_criteria === 'string' ? obj.success_criteria : null,
        stop_criteria: typeof obj.stop_criteria === 'string' ? obj.stop_criteria : null
      }
    })
    .filter(g => g.id && g.title)

  if (coercedGoals.length === 0) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  try {
    const sinceDate = isoDateNDaysAgo(7)
    const sinceTs = isoTimestampNDaysAgo(7)

    const [{ data: recentActions }, { data: recentScores }, { data: profile }] = await Promise.all([
      supabase
        .from('actions')
        .select('type, completed, created_at, updated_at')
        .eq('user_id', user.id)
        .or(`created_at.gte.${sinceTs},updated_at.gte.${sinceTs}`)
        .limit(200),
      supabase
        .from('daily_scores')
        .select('score_date, score')
        .eq('user_id', user.id)
        .gte('score_date', sinceDate)
        .order('score_date', { ascending: true })
        .limit(14),
      supabase
        .from('user_profiles')
        .select('ai_recent_events')
        .eq('id', user.id)
        .maybeSingle()
    ])

    const coreCreated7d = (recentActions || []).filter(a => a.type === 'core' && typeof a.created_at === 'string' && a.created_at >= sinceTs).length
    const coreCompleted7d = (recentActions || []).filter(a => a.type === 'core' && a.completed === true && typeof a.updated_at === 'string' && a.updated_at >= sinceTs).length
    const completionRate7d = coreCreated7d > 0 ? Math.min(1, coreCompleted7d / coreCreated7d) : null

    const scores = (recentScores || []).map(s => typeof s.score === 'number' ? s.score : null).filter((s): s is number => typeof s === 'number')
    const dailyScoreAvg7d = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null

    const momentum_bucket =
      coreCompleted7d >= 4 ? 'high'
        : coreCompleted7d >= 2 ? 'medium'
          : coreCreated7d >= 1 ? 'low'
            : 'unknown'

    const recentEvents = Array.isArray((profile as unknown as { ai_recent_events?: unknown })?.ai_recent_events)
      ? ((profile as unknown as { ai_recent_events: unknown[] }).ai_recent_events)
      : []

    const frictionCounts = new Map<string, number>()
    for (const e of recentEvents) {
      if (!e || typeof e !== 'object') continue
      const evt = e as Record<string, unknown>
      const ts = asString(evt.ts)
      if (ts && ts < sinceTs) continue
      const name = asString(evt.name) || ''
      const meta = (evt.meta && typeof evt.meta === 'object' && !Array.isArray(evt.meta)) ? (evt.meta as Record<string, unknown>) : null
      if (!meta) continue
      if (name === 'ai_rescue_apply') {
        const reason = asString(meta.reason)
        if (reason) frictionCounts.set(reason, (frictionCounts.get(reason) || 0) + 1)
      }
      if (name === 'ai_review_generated') {
        const friction = asString(meta.friction)
        if (friction) frictionCounts.set(friction, (frictionCounts.get(friction) || 0) + 1)
      }
    }

    const likely_frictions = [...frictionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k)

    const derivedRecentContext = {
      completion_rate_7d: completionRate7d,
      core_created_7d: coreCreated7d,
      core_completed_7d: coreCompleted7d,
      daily_score_avg_7d: dailyScoreAvg7d,
      momentum_bucket,
      likely_frictions: likely_frictions.length ? likely_frictions : null
    }

    const result = await aiTodayPlan({
      locale,
      today,
      goals: coercedGoals,
      recent_context: { ...(requestedRecentContext ?? {}), ...derivedRecentContext } as never
    })
    return NextResponse.json({ result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    const status =
      message === 'missing_fields' || message === 'invalid_json'
        ? 400
        : message === 'missing_ai_key'
          ? 500
          : 502
    return NextResponse.json({ error: message }, { status })
  }
}
