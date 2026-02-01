import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { breakdownGoalToActions } from '@/lib/ai/breakdown'

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
  const goalTitle = typeof input.goalTitle === 'string' ? input.goalTitle : ''
  const goalDescription = typeof input.goalDescription === 'string' ? input.goalDescription : undefined
  const startDate = typeof input.startDate === 'string' ? input.startDate : ''
  const endDate = typeof input.endDate === 'string' ? input.endDate : ''
  const locale = input.locale === 'zh' ? 'zh' : 'en'

  try {
    const actions = await breakdownGoalToActions({
      goalTitle,
      goalDescription,
      startDate,
      endDate,
      locale
    })

    return NextResponse.json({ actions }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    const status =
      message === 'missing_fields' || message === 'invalid_date_range' || message === 'invalid_json'
        ? 400
        : message === 'missing_ai_key'
          ? 500
          : 502
    return NextResponse.json({ error: message }, { status })
  }
}
