import { NextResponse } from 'next/server'
import { markRecommendationDismissed } from '@/lib/ai/recommendationStore'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  let feedbackLabel: string | null = 'dismiss'
  try {
    const body = (await req.json()) as unknown
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const input = body as Record<string, unknown>
      feedbackLabel = typeof input.feedbackLabel === 'string' ? input.feedbackLabel : 'dismiss'
    }
  } catch {
  }

  try {
    await markRecommendationDismissed({
      supabase,
      recommendationId: id,
      userId: user.id,
      feedbackLabel
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }
}
