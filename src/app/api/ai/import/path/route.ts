import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPathFromDoc } from '@/lib/ai/importExtract'

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
  const docText = typeof input.docText === 'string' ? input.docText.trim() : ''
  const goalId = typeof input.goalId === 'string' ? input.goalId : undefined
  const locale = input.locale === 'zh' ? 'zh' : 'en'

  if (!docText) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  if (docText.length > 20000) {
    return NextResponse.json({ error: 'doc_too_long' }, { status: 413 })
  }

  // 若指定 goal，校验归属，避免越权吸收到他人路径
  if (goalId) {
    const { data: goal } = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!goal) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const plan = await extractPathFromDoc(docText, locale)
    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
