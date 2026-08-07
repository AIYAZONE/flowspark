import { createClient } from '@/lib/supabase/server'
import { getContentTreeView, getCreatorDimensions } from '@/lib/contentAsset'

// 视频号个人IP专项：选题库（content_ideas）与内容日历（content_calendar）最小版数据访问层。
// 仅服务「你自己」这一个账号，所有查询经 RLS（user_id = auth.uid()）隔离，不写入任何示例数据。

export type ContentIdeaStatus =
  | 'idea'
  | 'approved'
  | 'produced'
  | 'published'
  | 'archived'

export interface ContentIdea {
  id: string
  user_id: string
  title: string
  angle: string | null
  hook: string | null
  notes: string | null
  raw_markdown: string | null
  status: ContentIdeaStatus
  persona_check_score: number | null
  source: string | null
  created_at: string
  updated_at: string
}

export interface ContentIdeaInput {
  title: string
  angle?: string | null
  hook?: string | null
  notes?: string | null
  raw_markdown?: string | null
  status?: ContentIdeaStatus
  source?: string | null
}

export interface ContentCalendarEntry {
  id: string
  user_id: string
  idea_id: string | null
  planned_date: string
  platform: string
  status: 'planned' | 'published' | 'skipped'
  note: string | null
  created_at: string
  updated_at: string
}

export interface ContentCalendarInput {
  idea_id?: string | null
  planned_date: string
  platform?: string
  status?: 'planned' | 'published' | 'skipped'
  note?: string | null
}

function touch(): { updated_at: string } {
  return { updated_at: new Date().toISOString() }
}

// ── 选题库 ────────────────────────────────────────────────────────────────

export async function listContentIdeas(): Promise<ContentIdea[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_ideas')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) return []
  return (data ?? []) as ContentIdea[]
}

export async function createContentIdea(
  input: ContentIdeaInput,
): Promise<ContentIdea | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('content_ideas')
    .insert({
      user_id: user.id,
      title: input.title,
      angle: input.angle ?? null,
      hook: input.hook ?? null,
      notes: input.notes ?? null,
      raw_markdown: input.raw_markdown ?? null,
      status: input.status ?? 'idea',
      source: input.source ?? null,
      ...touch(),
    })
    .select('*')
    .single()
  if (error) return null
  return data as ContentIdea
}

export async function updateContentIdea(
  id: string,
  patch: Partial<ContentIdeaInput> & { persona_check_score?: number | null },
): Promise<ContentIdea | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_ideas')
    .update({ ...patch, ...touch() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return null
  return data as ContentIdea
}

export async function deleteContentIdea(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from('content_ideas').delete().eq('id', id)
  return !error
}

// ── 内容日历 ──────────────────────────────────────────────────────────────

export async function listContentCalendar(
  from?: string,
  to?: string,
): Promise<ContentCalendarEntry[]> {
  const supabase = await createClient()
  let query = supabase
    .from('content_calendar')
    .select('*')
    .order('planned_date', { ascending: true })
  if (from) query = query.gte('planned_date', from)
  if (to) query = query.lte('planned_date', to)
  const { data, error } = await query
  if (error) return []
  return (data ?? []) as ContentCalendarEntry[]
}

export async function createCalendarEntry(
  input: ContentCalendarInput,
): Promise<ContentCalendarEntry | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('content_calendar')
    .insert({
      user_id: user.id,
      idea_id: input.idea_id ?? null,
      planned_date: input.planned_date,
      platform: input.platform ?? 'weixin_channels',
      status: input.status ?? 'planned',
      note: input.note ?? null,
      ...touch(),
    })
    .select('*')
    .single()
  if (error) return null
  return data as ContentCalendarEntry
}

export async function updateCalendarEntry(
  id: string,
  patch: Partial<ContentCalendarInput>,
): Promise<ContentCalendarEntry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_calendar')
    .update({ ...patch, ...touch() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return null
  return data as ContentCalendarEntry
}

export async function deleteCalendarEntry(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from('content_calendar').delete().eq('id', id)
  return !error
}

// ── 只读聚合：把选题与日历按 idea_id 关联，供工作台视图使用 ─────────────────

export interface BrandStudioView {
  ideas: ContentIdea[]
  calendar: ContentCalendarEntry[]
  folders: import('@/lib/contentAsset').ContentFolder[]
  assets: import('@/lib/contentAsset').ContentAsset[]
  dimensions: import('@/lib/contentAsset').CreatorDimension[]
}

export async function getBrandStudioView(): Promise<BrandStudioView> {
  const [ideas, calendar, tree, dimensions] = await Promise.all([
    listContentIdeas(),
    listContentCalendar(),
    getContentTreeView(),
    getCreatorDimensions(),
  ])
  return {
    ideas,
    calendar,
    folders: tree.folders,
    assets: tree.assets,
    dimensions,
  }
}
