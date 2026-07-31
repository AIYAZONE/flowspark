import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordPathPlan } from '@/lib/chat/persistence'
import type { PathPlanResult } from '@/lib/ai/pathPlan'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const goalId = typeof input.goalId === 'string' ? input.goalId : ''
  const plan = input.plan as PathPlanResult | undefined

  if (!goalId || !plan) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  // 校验 goal 归属
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!goal) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const result = await recordPathPlan(supabase, user.id, { goalId, plan })
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 })

  return NextResponse.json({ ok: true }, { status: 200 })
}
