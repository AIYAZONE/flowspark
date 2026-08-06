import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planBrandCheck } from '@/lib/ai/coachOrchestrator'
import { listPersona } from '@/lib/persona'

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
  const draft = typeof input.draft === 'string' ? input.draft.trim() : ''
  if (!draft) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  // 人设基准：复用已沉淀的 user_persona
  const personaItems = await listPersona()
  const persona = personaItems.map((p) => ({ title: p.title, detail: p.detail ?? null }))

  try {
    const response = await planBrandCheck({
      supabase,
      userId: user.id,
      locale,
      draft,
      persona,
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
