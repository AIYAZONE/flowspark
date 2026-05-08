import { NextResponse } from 'next/server'
import { markRecommendationAdopted } from '@/lib/ai/recommendationStore'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function isOptionSelected(value: unknown): value is '5m' | '10m' | '20m' {
  return value === '5m' || value === '10m' || value === '20m'
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const input =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  const optionSelected = input?.optionSelected
  const actionId = typeof input?.actionId === 'string' ? input.actionId : null

  if (!isOptionSelected(optionSelected)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  try {
    await markRecommendationAdopted({
      supabase,
      recommendationId: id,
      userId: user.id,
      optionSelected,
      actionId
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }
}
