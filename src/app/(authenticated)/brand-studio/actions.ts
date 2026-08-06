'use server'

import {
  createContentIdea,
  updateContentIdea,
  deleteContentIdea,
  createCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry,
  getBrandStudioView,
  type ContentIdeaInput,
  type ContentCalendarInput,
} from '@/lib/contentBrand'
import type { ParsedIdeaDraft } from '@/lib/parseTraeMarkdown'

export async function saveContentIdea(
  input: Partial<ContentIdeaInput> & { id?: string; persona_check_score?: number | null },
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!input.id && !input.title?.trim()) return { ok: false, error: 'title_required' }
    if (input.id) {
      const { id, ...patch } = input
      const updated = await updateContentIdea(id, patch)
      if (!updated) return { ok: false, error: 'update_failed' }
    } else {
      const created = await createContentIdea({
        title: input.title!,
        angle: input.angle ?? null,
        hook: input.hook ?? null,
        notes: input.notes ?? null,
        raw_markdown: input.raw_markdown ?? null,
        status: input.status,
        source: input.source ?? null,
      })
      if (!created) return { ok: false, error: 'create_failed' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'operation_failed' }
  }
}

export async function removeContentIdea(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const ok = await deleteContentIdea(id)
  return ok ? { ok: true } : { ok: false, error: 'operation_failed' }
}

// 批量导入选题草稿（来自 Trae Work 导出的 zip 解析结果）。
// 每条带 source 标记出处；user_id 由 createContentIdea 内部取当前登录用户，RLS 隔离。
export async function importContentIdeas(
  drafts: ParsedIdeaDraft[],
): Promise<{ ok: boolean; imported: number; error?: string }> {
  try {
    let imported = 0
    const lengths: number[] = []
    for (const d of drafts) {
      if (!d.title?.trim()) continue
      const created = await createContentIdea({
        title: d.title.trim(),
        angle: d.angle ?? null,
        hook: d.hook ?? null,
        notes: d.notes ?? null,
        raw_markdown: d.rawMarkdown ?? null,
        status: d.status,
        source: d.source ?? null,
      })
      if (created) {
        imported++
        lengths.push(d.rawMarkdown?.length ?? 0)
      }
    }
    // 导入日志：计数 + 每条原文长度，便于核对无丢失
    const totalChars = lengths.reduce((s, n) => s + n, 0)
    const avg = lengths.length ? Math.round(totalChars / lengths.length) : 0
    const min = lengths.length ? Math.min(...lengths) : 0
    const max = lengths.length ? Math.max(...lengths) : 0
    console.log(
      `[importContentIdeas] 导入完成 共 ${imported} 条 | 原文总字数 ${totalChars} | 平均 ${avg} | 最短 ${min} | 最长 ${max} 字`,
    )
    return { ok: true, imported }
  } catch {
    return { ok: false, imported: 0, error: 'operation_failed' }
  }
}

export async function saveCalendarEntry(
  input: ContentCalendarInput & { id?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!input.planned_date) return { ok: false, error: 'date_required' }
    if (input.id) {
      const { id, ...patch } = input
      const updated = await updateCalendarEntry(id, patch)
      if (!updated) return { ok: false, error: 'update_failed' }
    } else {
      const created = await createCalendarEntry(input)
      if (!created) return { ok: false, error: 'create_failed' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'operation_failed' }
  }
}

export async function removeCalendarEntry(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const ok = await deleteCalendarEntry(id)
  return ok ? { ok: true } : { ok: false, error: 'operation_failed' }
}

export async function refreshBrandStudio(): Promise<{
  ideas: Awaited<ReturnType<typeof getBrandStudioView>>['ideas']
  calendar: Awaited<ReturnType<typeof getBrandStudioView>>['calendar']
}> {
  const view = await getBrandStudioView()
  return { ideas: view.ideas, calendar: view.calendar }
}
