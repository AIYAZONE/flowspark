import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listContentIdeas } from '@/lib/contentBrand'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const ideas = await listContentIdeas()
  return NextResponse.json({ ok: true, data: ideas }, { status: 200 })
}
