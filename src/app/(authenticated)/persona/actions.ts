'use server'

import {
  createPersona,
  updatePersona,
  deletePersona,
  listPersona,
  mergePersonaInto,
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
