import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planPath } from '@/lib/ai/pathPlan'

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
  const locale = input.locale === 'zh' ? 'zh' : 'en'
  const goalTitle = typeof input.goalTitle === 'string' ? input.goalTitle : ''
  const goalDescription = typeof input.goalDescription === 'string' ? input.goalDescription : null
  const goalId = typeof input.goalId === 'string' ? input.goalId : undefined
  const conversation = Array.isArray(input.conversation)
    ? (input.conversation as { role: 'user' | 'assistant'; content: string }[]).filter(
        (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
      )
    : []

  if (!goalTitle) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  try {
    const plan = await planPath(supabase, {
      locale,
      goalId,
      goalTitle,
      goalDescription,
      conversation,
    })
    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
