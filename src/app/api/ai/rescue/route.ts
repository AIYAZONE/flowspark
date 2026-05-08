import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planRescue } from '@/lib/ai/coachOrchestrator'

export const runtime = 'nodejs'

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
  const reason_tag = typeof input.reason_tag === 'string' ? input.reason_tag : ''
  const action = (input.action && typeof input.action === 'object') ? (input.action as Record<string, unknown>) : null
  const goal = (input.goal && typeof input.goal === 'object') ? (input.goal as Record<string, unknown>) : null

  if (!reason_tag || !action || !goal) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const actionPayload = {
    id: typeof action.id === 'string' ? action.id : '',
    title: typeof action.title === 'string' ? action.title : '',
    description: typeof action.description === 'string' ? action.description : null
  }
  const goalPayload = {
    id: typeof goal.id === 'string' ? goal.id : '',
    title: typeof goal.title === 'string' ? goal.title : ''
  }

  if (!actionPayload.id || !actionPayload.title || !goalPayload.id || !goalPayload.title) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  try {
    const response = await planRescue({
      supabase,
      userId: user.id,
      locale,
      reasonTag: reason_tag as never,
      action: actionPayload,
      goal: goalPayload,
    })
    return NextResponse.json(response, { status: 200 })
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
