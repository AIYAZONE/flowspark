import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPersonaFromDoc, saveImportedPersona } from '@/lib/ai/importExtract'

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
  const locale = input.locale === 'zh' ? 'zh' : 'en'

  if (!docText) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  if (docText.length > 20000) {
    return NextResponse.json({ error: 'doc_too_long' }, { status: 413 })
  }

  try {
    const items = await extractPersonaFromDoc(docText, locale)
    if (items.length === 0) {
      return NextResponse.json({ ok: true, saved: 0, items: [] }, { status: 200 })
    }
    const saved = await saveImportedPersona(items)
    return NextResponse.json({ ok: true, saved, items }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
