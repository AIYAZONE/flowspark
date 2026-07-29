import type { SupabaseClient } from '@supabase/supabase-js'
import { queryWithOwnershipFallback } from '../ownership.ts'

export type OpenActionRef = { id: string; title: string }

/**
 * 归一化行动标题用于去重比较：转小写、去除所有空白、去除常见中英文标点。
 */
export function normalizeActionTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[「」""''‘’()（）[\]【】{}.,，。、；;:：!！?？'’·\-_/]/g, '')
    .trim()
}

/**
 * 返回用户所有未完成的开放行动（含带日期约束、今天不可执行的），用于落库前去重，
 * 避免把用户已有的行动再新建一条重复。
 */
export async function listAllOpenActions(
  supabase: SupabaseClient,
  userId: string
): Promise<OpenActionRef[]> {
  const { data } = await queryWithOwnershipFallback({
    execute: (col) =>
      supabase
        .from('actions')
        .select('id,title,completed')
        .eq(col, userId)
  })
  const rows = (data ?? []) as Array<{ id: string; title: string | null; completed: boolean | null }>
  return rows.filter((a) => !a.completed).map((a) => ({ id: a.id, title: a.title ?? '' }))
}

/**
 * 在用户所有开放行动中查找与给定标题重复的项。
 * 命中条件：归一化后完全相等，或一个归一化字符串包含另一个且较短者长度 ≥ 4。
 * 命中返回已存在行动引用，否则返回 null。
 *
 * 仅对"未完成"的行动去重：已完成（completed）的行动视为可合法重新创建，不去重。
 */
export async function findDuplicateOpenAction(
  supabase: SupabaseClient,
  userId: string,
  title: string
): Promise<OpenActionRef | null> {
  const norm = normalizeActionTitle(title)
  if (!norm) return null

  const open = await listAllOpenActions(supabase, userId)
  for (const a of open) {
    const en = normalizeActionTitle(a.title)
    if (!en) continue
    const isExact = en === norm
    const isSubstring =
      en.length >= 4 && norm.length >= 4 && (en.includes(norm) || norm.includes(en))
    if (isExact || isSubstring) return a
  }
  return null
}
