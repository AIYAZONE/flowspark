import { NextResponse } from 'next/server'
import { planWeeklyInsight } from '@/lib/ai/coachOrchestrator'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let locale: 'zh' | 'en' = 'en'
  try {
    const body = await req.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      locale = (body as Record<string, unknown>).locale === 'zh' ? 'zh' : 'en'
    }
  } catch {
  }

  try {
    const response = await planWeeklyInsight({
      supabase,
      userId: user.id,
      locale,
    })
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'operation_failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
