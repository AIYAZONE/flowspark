import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiReview } from '@/lib/ai/phase2a'

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
  const today = typeof input.today === 'string' ? input.today : ''
  const score = typeof input.score === 'number' && Number.isFinite(input.score) ? input.score : null
  const answers = (input.answers && typeof input.answers === 'object') ? (input.answers as Record<string, unknown>) : {}
  if (!today) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const coercedAnswers: Record<string, string> = {}
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === 'string') coercedAnswers[k] = v
  }

  try {
    const result = await aiReview({ locale, today, score, answers: coercedAnswers })
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

