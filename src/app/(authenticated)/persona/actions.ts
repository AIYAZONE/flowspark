'use server'

import {
  createPersona,
  updatePersona,
  deletePersona,
  listPersona,
  type PersonaCategory,
  type PersonaConfidence,
  type PersonaInput,
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
