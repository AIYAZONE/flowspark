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
  'ai_tomorrow_handoff_exposed',
  'ai_tomorrow_handoff_click',
  'ai_tomorrow_handoff_dismiss',
  'ai_weekly_insight_view',
  'ai_weekly_insight_generate',
  'ai_weekly_insight_open_report',
  'dashboard_viewed',
  'today_viewed',
  'ai_today_plan_exposed',
  'ai_review_exposed',
  'streak_risk_banner_exposed',
  'streak_recovery_offer_exposed',
  'streak_recovery_click',
  'streak_recovery_success',
  'streak_recovery_blocked',
  'shield_badge_click',
  'continuity_priority_cta_click',
])

const EVENT_META_DEFAULTS: Partial<Record<string, Record<string, string>>> = {
  ai_today_plan_click: {
    scene: 'today_plan',
  },
  ai_today_plan_suggested: {
    scene: 'today_plan',
  },
  ai_today_plan_apply: {
    scene: 'today_plan',
  },
  ai_today_plan_dismiss: {
    scene: 'today_plan',
  },
  ai_review_click: {
    source: 'dashboard',
    scene: 'review',
  },
  ai_review_generated: {
    source: 'dashboard',
    scene: 'review',
  },
  ai_review_dismiss: {
    source: 'dashboard',
    scene: 'review',
  },
  ai_tomorrow_handoff_exposed: {
    source: 'today',
    scene: 'tomorrow_handoff',
  },
  ai_tomorrow_handoff_click: {
    source: 'today',
    scene: 'tomorrow_handoff',
  },
  ai_tomorrow_handoff_dismiss: {
    source: 'today',
    scene: 'tomorrow_handoff',
  },
  ai_review_exposed: {
    source: 'dashboard',
    scene: 'review',
  },
  ai_weekly_insight_view: {
    source: 'dashboard',
    scene: 'weekly_insight',
  },
  ai_weekly_insight_generate: {
    source: 'dashboard',
    scene: 'weekly_insight',
  },
  ai_weekly_insight_open_report: {
    source: 'dashboard',
    scene: 'weekly_insight',
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function withEventMetaDefaults(name: string, meta: ReturnType<typeof sanitizeEventPayload>) {
  const defaults = EVENT_META_DEFAULTS[name]
  if (!defaults) return meta ?? null

  const nextMeta: Record<string, string | number | boolean | null> = {
    ...(meta ?? {}),
  }

  for (const [key, value] of Object.entries(defaults)) {
    const current = nextMeta[key]
    if (typeof current === 'string' && current.trim()) continue
    nextMeta[key] = value
  }

  return Object.keys(nextMeta).length > 0 ? nextMeta : null
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

  const meta = withEventMetaDefaults(
    name,
    sanitizeEventPayload(body.meta, { maxStringLen: 200 })
  )
  const { error } = await supabase
    .rpc('append_ai_feedback_event', {
      p_name: name,
      p_meta: meta,
      p_ts: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
