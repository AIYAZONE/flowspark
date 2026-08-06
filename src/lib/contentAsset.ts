import { createClient } from '@/lib/supabase/server'

// 通用内容资产树（AI 自动生成 / 归类，用户零操作）。
// 核心能力：
//  - resolveFolderPath：给定路径名数组（如 ["01-总纲与战略","视频号定位"]），
//    AI 不需要知道 folder id，后端自动逐层查找/创建，返回叶节点 folder id。
//  - upsertContentAssets：把 AI 提取的 0~N 条资产直接挂到对应路径下。

export type ContentAssetKind =
  | 'idea'
  | 'script'
  | 'note'
  | 'data'
  | 'strategy'
  | 'tool'
  | 'other'

export type ContentAssetStatus =
  | 'captured'
  | 'refined'
  | 'approved'
  | 'produced'
  | 'published'
  | 'archived'

export interface ContentFolder {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  sort_order: number
  path: string
  created_at: string
  updated_at: string
}

export interface ContentAsset {
  id: string
  user_id: string
  folder_id: string | null
  kind: ContentAssetKind
  title: string
  summary: string | null
  body_markdown: string | null
  status: ContentAssetStatus
  source: string
  chat_session_id: string | null
  created_at: string
  updated_at: string
}

export interface ContentAssetInput {
  kind?: ContentAssetKind
  title: string
  summary?: string | null
  body_markdown?: string | null
  status?: ContentAssetStatus
  source?: string
  chat_session_id?: string | null
  // AI 提供的路径名数组（从根到叶），如 ["01-总纲与战略","视频号定位"]
  path?: string[]
}

// ── 文件夹树 ────────────────────────────────────────────────────────────────

// 把路径名数组解析为已存在的 folder id，逐层自动创建缺失节点。
// 返回叶节点 folder id（供资产挂载）。
export async function resolveFolderPath(
  pathNames: string[],
  sortOrder = 0,
): Promise<string | null> {
  const names = (pathNames ?? []).map((n) => n.trim()).filter(Boolean)
  if (names.length === 0) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let parentId: string | null = null
  let accumulated: string = ''

  for (const name of names) {
    // 查找当前层是否已存在同名子节点
    const { data: found } = (await supabase
      .from('content_folders')
      .select('id, path')
      .eq('user_id', user.id)
      .is('parent_id', parentId)
      .eq('name', name)
      .maybeSingle()) as { data: { id: string; path: string } | null }
    const existing = found

    if (existing) {
      parentId = existing.id
      accumulated = existing.path
      continue
    }

    // 不存在则创建
    const nextParent: string | null = parentId
    const newPath: string = accumulated ? `${accumulated}/${nextParent}` : ''
    const { data: created, error } = (await supabase
      .from('content_folders')
      .insert({
        user_id: user.id,
        parent_id: parentId,
        name,
        sort_order: sortOrder,
        path: newPath,
        updated_at: new Date().toISOString(),
      })
      .select('id, path')
      .single()) as { data: { id: string; path: string } | null; error: unknown }
    if (error || !created) return parentId // 尽量挂到已有的最近节点
    parentId = created.id
    accumulated = created.path
  }

  return parentId
}

// 读取整棵树（按 path 排序，前端无需递归）
export async function listContentFolders(): Promise<ContentFolder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_folders')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) return []
  return (data ?? []) as ContentFolder[]
}

// ── 资产 ────────────────────────────────────────────────────────────────────

// 批量 upsert AI 提取的资产：先按 path 解析 folder，再写入资产。
export async function upsertContentAssets(
  inputs: ContentAssetInput[],
): Promise<ContentAsset[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || inputs.length === 0) return []

  const now = new Date().toISOString()
  const rows: Array<Omit<ContentAsset, 'id' | 'created_at' | 'updated_at'>> = []

  for (const input of inputs) {
    const folderId = input.path?.length
      ? await resolveFolderPath(input.path)
      : null
    rows.push({
      user_id: user.id,
      folder_id: folderId,
      kind: input.kind ?? 'idea',
      title: input.title,
      summary: input.summary ?? null,
      body_markdown: input.body_markdown ?? null,
      status: input.status ?? 'captured',
      source: input.source ?? 'chat',
      chat_session_id: input.chat_session_id ?? null,
    })
  }

  const { data, error } = await supabase
    .from('content_assets')
    .insert(
      rows.map((r) => ({ ...r, updated_at: now })),
    )
    .select('*')
  if (error) return []
  return (data ?? []) as ContentAsset[]
}

export async function listContentAssets(
  folderId?: string | null,
): Promise<ContentAsset[]> {
  const supabase = await createClient()
  let query = supabase
    .from('content_assets')
    .select('*')
    .order('updated_at', { ascending: false })
  if (folderId) query = query.eq('folder_id', folderId)
  const { data, error } = await query
  if (error) return []
  return (data ?? []) as ContentAsset[]
}

// 读取「树 + 资产」聚合，供 Brand Studio 通用视图使用。
export interface ContentTreeView {
  folders: ContentFolder[]
  assets: ContentAsset[]
}

export async function getContentTreeView(): Promise<ContentTreeView> {
  const [folders, assets] = await Promise.all([
    listContentFolders(),
    listContentAssets(),
  ])
  return { folders, assets }
}
