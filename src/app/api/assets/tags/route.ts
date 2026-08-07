import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ContentAsset } from '@/lib/contentAsset'

export const runtime = 'nodejs'

// 标签聚合 + 按标签检索资产。支撑「创作者维度视图」。
// Query:
//   ?tag=视频号       -> 返回带该标签的资产列表（goals + content_assets）
//   无参数            -> 返回全量标签计数（跨 goals / assets）
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const tag = new URL(req.url).searchParams.get('tag')?.trim()
  if (tag) {
    const { data: goalRows } = await supabase
      .from('goals')
      .select('id,title,category,status,tags')
      .eq('owner_id', user.id)
      .contains('tags', [tag])
    const { data: assetRows } = await supabase
      .from('content_assets')
      .select('*')
      .eq('user_id', user.id)
      .contains('tags', [tag])
      .order('updated_at', { ascending: false })

    return NextResponse.json({
      tag,
      goals: goalRows ?? [],
      assets: (assetRows ?? []) as ContentAsset[]
    })
  }

  // 全量标签计数
  const { data: goals } = await supabase
    .from('goals')
    .select('tags')
    .eq('owner_id', user.id)
  const { data: assets } = await supabase
    .from('content_assets')
    .select('tags')
    .eq('user_id', user.id)

  const counts = new Map<string, { goals: number; assets: number }>()
  const bump = (key: string, kind: 'goals' | 'assets') => {
    const cur = counts.get(key) ?? { goals: 0, assets: 0 }
    cur[kind] += 1
    counts.set(key, cur)
  }
  for (const g of (goals ?? []) as Array<{ tags: string[] | null }>) {
    for (const t of g.tags ?? []) bump(t, 'goals')
  }
  for (const a of (assets ?? []) as Array<{ tags: string[] | null }>) {
    for (const t of a.tags ?? []) bump(t, 'assets')
  }

  const tags = Array.from(counts.entries())
    .map(([name, c]) => ({ name, ...c, total: c.goals + c.assets }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({ tags })
}
