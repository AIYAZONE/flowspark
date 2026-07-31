import { createClient } from '@/lib/supabase/server'
import type {
  PersonaCategory,
  PersonaConfidence,
  PersonaSource,
  UserPersona,
} from '@/lib/persona-types'
import { PERSONA_CATEGORY_LABELS } from '@/lib/persona-types'
export type {
  PersonaCategory,
  PersonaConfidence,
  PersonaSource,
  UserPersona,
} from '@/lib/persona-types'
export { PERSONA_CATEGORY_LABELS, PERSONA_CONFIDENCE_LABELS } from '@/lib/persona-types'

export interface PersonaInput {
  category: PersonaCategory
  title: string
  detail?: string | null
  source?: PersonaSource
  confidence?: PersonaConfidence
}

/** 列出当前用户全部个人记忆 */
export async function listPersona(): Promise<UserPersona[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_persona')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as UserPersona[]
}

/** 手动新增一条个人记忆（页面编辑入口，原则 A） */
export async function createPersona(input: PersonaInput): Promise<UserPersona | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_persona')
    .insert({
      user_id: user.id,
      category: input.category,
      title: input.title,
      detail: input.detail ?? null,
      source: input.source ?? 'manual',
      confidence: input.confidence ?? 'medium',
    })
    .select('*')
    .single()
  if (error) return null
  return data as UserPersona
}

/** 更新一条个人记忆（页面编辑入口） */
export async function updatePersona(
  id: string,
  patch: Partial<PersonaInput>,
): Promise<UserPersona | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_persona')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return null
  return data as UserPersona
}

/** 删除一条个人记忆（页面编辑入口） */
export async function deletePersona(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from('user_persona').delete().eq('id', id)
  return !error
}

/**
 * chat 自动沉淀入口（原则 A）：把对话中识别出的「关于用户个人的陈述」写入个人记忆。
 * 若同类别+相近标题已存在，则更新而非重复插入（soft dedupe）。
 */
export async function recordPersonaFromChat(
  input: PersonaInput,
): Promise<UserPersona | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('user_persona')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', input.category)
    .eq('title', input.title)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('user_persona')
      .update({
        detail: input.detail ?? existing.detail,
        source: 'chat',
        confidence: input.confidence ?? (existing.confidence as PersonaConfidence),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) return null
    return data as UserPersona
  }

  return createPersona({ ...input, source: 'chat' })
}

/** 生成给 AI 用的个人记忆摘要文案（双向联动：规划对话注入） */
export async function buildPersonaSummary(): Promise<string> {
  const items = await listPersona()
  if (items.length === 0) return '（暂无个人记忆，规划时请先通过对话补全人设）'
  const grouped = items.reduce<Record<string, UserPersona[]>>((acc, it) => {
    ;(acc[it.category] ??= []).push(it)
    return acc
  }, {})
  return Object.entries(grouped)
    .map(([cat, list]) => {
      const label = PERSONA_CATEGORY_LABELS[cat as PersonaCategory] ?? cat
      const lines = list.map((i) => `- ${i.title}${i.detail ? `（${i.detail}）` : ''}`)
      return `【${label}】\n${lines.join('\n')}`
    })
    .join('\n')
}
