import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
])

type JSONValue = string | number | boolean | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toJSONValue(value: unknown): JSONValue | undefined {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 200)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value
  return undefined
}

function sanitizeMeta(meta: unknown): Record<string, JSONValue> | null {
  if (!isRecord(meta)) return null
  const out: Record<string, JSONValue> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (!k || k.length > 60) continue
    const val = toJSONValue(v)
    if (val === undefined) continue
    out[k] = val
  }
  return Object.keys(out).length ? out : null
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

  const meta = sanitizeMeta(body.meta)
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

