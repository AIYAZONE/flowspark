'use server'

import {
  createPersona,
  updatePersona,
  deletePersona,
  listPersona,
  mergePersonaInto,
  findDuplicatePersona,
  type PersonaCategory,
  type PersonaConfidence,
  type PersonaInput,
  type UserPersona,
} from '@/lib/persona'

export async function savePersona(
  input: PersonaInput & { id?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (input.id) {
      const { id, ...patch } = input
      await updatePersona(id, patch)
    } else {
      await createPersona(input)
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'operation_failed' }
  }
}

export async function removePersona(id: string): Promise<{ ok: boolean; error?: string }> {
  const ok = await deletePersona(id)
  return ok ? { ok: true } : { ok: false, error: 'operation_failed' }
}

export async function refreshPersona(): Promise<{ items: Awaited<ReturnType<typeof listPersona>> }> {
  const items = await listPersona()
  return { items }
}

/**
 * 手动合并两条个人记忆：把 source 合并进 target 并删除 source（冲突/合并，原则 A 闭环）。
 */
export async function mergePersona(
  targetId: string,
  sourceId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (targetId === sourceId) return { ok: false, error: 'same_target' }
  try {
    const items = await listPersona()
    const target = items.find((i) => i.id === targetId)
    const source = items.find((i) => i.id === sourceId)
    if (!target || !source) return { ok: false, error: 'not_found' }
    const merged = await mergePersonaInto(target, source)
    if (!merged) return { ok: false, error: 'merge_failed' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'operation_failed' }
  }
}

/**
 * 复盘闭环：把一条「本周学到的」洞察沉淀进个人记忆。
 * category 固定 reflection，source 标记 manual；若同类别下已有语义相近条目则合并更新（复用 #3 合并逻辑）。
 */
export async function saveReviewLearning(input: {
  title: string
  detail?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.title?.trim()) return { ok: false, error: 'title_required' }
  try {
    const dup = await findDuplicatePersona({
      category: 'reflection',
      title: input.title.trim(),
      detail: input.detail ?? null,
    })
    if (dup) {
      await updatePersona(dup.match.id, {
        detail:
          input.detail && input.detail.length >= (dup.match.detail?.length ?? 0)
            ? input.detail
            : dup.match.detail,
        source: 'manual',
        confidence: 'medium',
      })
      return { ok: true }
    }
    const created = await createPersona({
      category: 'reflection',
      title: input.title.trim(),
      detail: input.detail ?? null,
      source: 'manual',
      confidence: 'medium',
    })
    if (!created) return { ok: false, error: 'create_failed' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'operation_failed' }
  }
}
