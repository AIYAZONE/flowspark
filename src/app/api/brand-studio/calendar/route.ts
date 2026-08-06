import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listContentCalendar } from '@/lib/contentBrand'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const calendar = await listContentCalendar()
  return NextResponse.json({ ok: true, data: calendar }, { status: 200 })
}
