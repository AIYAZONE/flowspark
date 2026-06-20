import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeEventPayload } from '@/lib/eventPayload'

export const runtime = 'nodejs'

const ALLOWED_EVENT_NAMES = new Set([
  'ai_goal_setup_click',
  'ai_goal_setup_stepA_success',
  'ai_goal_setup_stepA_need_more',
  'ai_goal_setup_stepB_success',
  'ai_goal_setup_apply',
  'ai_today_plan_click',
  'ai_today_plan_suggested',
  'ai_today_plan_apply',
  'ai_today_plan_dismiss',
  'ai_rescue_click',
  'ai_rescue_apply',
  'ai_review_click',
  'ai_review_generated',
  'ai_review_dismiss',
  'ai_weekly_insight_view',
  'ai_weekly_insight_generate',
  'ai_weekly_insight_open_report',
  'dashboard_viewed',
  'today_viewed',
  'ai_today_plan_exposed',
  'ai_review_exposed',
  'streak_risk_banner_exposed',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
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

  if (!isRecord(body)) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || !ALLOWED_EVENT_NAMES.has(name)) {
    return NextResponse.json({ error: 'invalid_event' }, { status: 400 })
  }

  const meta = sanitizeEventPayload(body.meta, { maxStringLen: 200 }) ?? null
  const event = {
    name,
    ts: new Date().toISOString(),
    meta
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('ai_recent_events')
    .eq('id', user.id)
    .maybeSingle()

  const current = Array.isArray((profile as unknown as { ai_recent_events?: unknown })?.ai_recent_events)
    ? ((profile as unknown as { ai_recent_events: unknown[] }).ai_recent_events)
    : []

  const next = [...current, event].slice(-60)

  const { error } = await supabase
    .from('user_profiles')
    .update({ ai_recent_events: next, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
