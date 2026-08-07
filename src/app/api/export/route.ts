import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Privacy export endpoint (GDPR-style data portability).
 * Returns a single JSON bundle of everything the authenticated user owns.
 * No AI, no external calls — pure data aggregation behind RLS.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const userId = user.id

  const [
    persona,
    goals,
    actions,
    folders,
    assets,
    recommendations,
    outcomes,
    notifications,
    dailyScores,
    profile,
  ] = await Promise.all([
    supabase.from('user_persona').select('*').eq('user_id', userId),
    supabase.from('goals').select('*').eq('owner_id', userId),
    supabase.from('actions').select('*').eq('owner_id', userId),
    supabase.from('content_folders').select('*').eq('user_id', userId),
    supabase.from('content_assets').select('*').eq('user_id', userId),
    supabase.from('ai_recommendations').select('*').eq('user_id', userId),
    supabase
      .from('ai_recommendation_outcomes')
      .select('*')
      .eq('user_id', userId),
    supabase.from('user_notifications').select('*').eq('user_id', userId),
    supabase.from('daily_scores').select('*').eq('owner_id', userId),
    supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
  ])

  const bundle = {
    exportedAt: new Date().toISOString(),
    schemaVersion: '1',
    user: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
      lastSignInAt: user.last_sign_in_at ?? null,
    },
    profile: profile.data ?? null,
    persona: persona.data ?? [],
    goals: goals.data ?? [],
    actions: actions.data ?? [],
    contentFolders: folders.data ?? [],
    contentAssets: assets.data ?? [],
    aiRecommendations: recommendations.data ?? [],
    aiRecommendationOutcomes: outcomes.data ?? [],
    notifications: notifications.data ?? [],
    dailyScores: dailyScores.data ?? [],
  }

  const filename = `flowspark-export-${new Date().toISOString().slice(0, 10)}.json`
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
