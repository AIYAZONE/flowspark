import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiTodayPlan } from '@/lib/ai/phase2a'

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
  const goals = Array.isArray(input.goals) ? input.goals : []
  const recent_context = (input.recent_context && typeof input.recent_context === 'object') ? (input.recent_context as Record<string, unknown>) : undefined

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
    const result = await aiTodayPlan({
      locale,
      today,
      goals: coercedGoals,
      recent_context: recent_context as never
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

