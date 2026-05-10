import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setRecommendationFeedbackLabel } from '@/lib/ai/recommendationStore'

export const runtime = 'nodejs'

const ALLOWED = new Set([
  'useful',
  'no_time',
  'not_fit',
  'not_fit_goal',
  'not_fit_action',
  'not_fit_tone',
  'too_hard',
  'already_planned',
  'other',
])

function readLabel(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const input = body as Record<string, unknown>
  const label =
    (typeof input.feedback_label === 'string' ? input.feedback_label : null)
    ?? (typeof input.feedbackLabel === 'string' ? input.feedbackLabel : null)
  const trimmed = (label || '').trim()
  return trimmed ? trimmed : null
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const { data: owned } = await supabase
    .from('ai_recommendations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!owned?.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const label = readLabel(body)
  if (!label || !ALLOWED.has(label)) {
    return NextResponse.json({ error: 'invalid_label' }, { status: 400 })
  }

  try {
    await setRecommendationFeedbackLabel({
      supabase,
      recommendationId: id,
      userId: user.id,
      feedbackLabel: label,
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }
}
