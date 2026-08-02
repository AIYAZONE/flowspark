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

/** 合并相似度阈值：同类别下相似度达到该值视为「同一信息的不同表述」，做合并更新而非重复插入 */
export const PERSONA_MERGE_THRESHOLD = 0.4

const CONFIDENCE_RANK: Record<PersonaConfidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
}

/** 取更高的置信度等级 */
export function higherConfidence(
  a: PersonaConfidence,
  b: PersonaConfidence,
): PersonaConfidence {
  return CONFIDENCE_RANK[a] >= CONFIDENCE_RANK[b] ? a : b
}

/**
 * 文本归一化：小写、去标点与空白，统一中英文符号，便于做相似度比较。
 */
function normalizePersonaText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[，。、；：！？,.!?;:()（）"'“”‘’《》<>\[\]【】\-_/\\|]/g, '')
}

/**
 * 最长公共子串长度（用于衡量「共享了多长的一段连续表述」）。
 */
function longestCommonSubstringLength(a: string, b: string): number {
  if (!a || !b) return 0
  const dp = new Array(b.length + 1).fill(0)
  let max = 0
  for (let i = 1; i <= a.length; i++) {
    let prev = 0
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev + 1
        if (dp[j] > max) max = dp[j]
      } else {
        dp[j] = 0
      }
      prev = tmp
    }
  }
  return max
}

/**
 * 计算两段文本的语义相似度（0~1）。
 * 中文走字符 bi-gram Jaccard，英文走单词集合 Jaccard；再叠加最长公共子串比例，
 * 以更好捕捉「只差一两个修饰词的同一表述」。纯确定性算法，无外部依赖。
 */
export function personaTextSimilarity(a: string, b: string): number {
  const na = normalizePersonaText(a)
  const nb = normalizePersonaText(b)
  if (!na || !nb) return 0
  if (na === nb) return 1

  const hasCJK = (s: string) => /[一-鿿]/.test(s)
  const aCJK = hasCJK(na)
  const bCJK = hasCJK(nb)

  const charBigrams = (s: string): Set<string> => {
    const set = new Set<string>()
    if (s.length === 1) {
      set.add(s)
      return set
    }
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
    return set
  }
  const words = (s: string): Set<string> =>
    new Set(s.split(/[^a-z0-9]+/).filter(Boolean))

  const jaccard = (x: Set<string>, y: Set<string>): number => {
    if (x.size === 0 || y.size === 0) return 0
    let inter = 0
    for (const v of x) if (y.has(v)) inter++
    return inter / (x.size + y.size - inter)
  }

  const charSim = jaccard(charBigrams(na), charBigrams(nb))
  const wordSim = jaccard(words(na), words(nb))
  const lcsRatio =
    longestCommonSubstringLength(na, nb) / Math.min(na.length, nb.length)

  if (aCJK && bCJK) return Math.max(charSim, lcsRatio * 0.9)
  if (!aCJK && !bCJK) return Math.max(wordSim, lcsRatio * 0.9)
  // 中英混合：综合
  return Math.max((charSim + wordSim) / 2, lcsRatio * 0.9)
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
 * 在同类别下查找与输入「语义相近」的已有个人记忆（用于合并而非重复插入）。
 * 优先精确匹配 title；未命中则按文本相似度（阈值 PERSONA_MERGE_THRESHOLD）取最佳匹配。
 * 返回最佳匹配的条目与相似度，无命中返回 null。
 */
export async function findDuplicatePersona(
  input: PersonaInput,
): Promise<{ match: UserPersona; similarity: number } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sameCategory } = await supabase
    .from('user_persona')
    .select('*')
    .eq('user_id', user.id)
    .eq('category', input.category)

  const candidates = (sameCategory ?? []) as UserPersona[]
  if (candidates.length === 0) return null

  // 1) 精确匹配
  const exact = candidates.find((c) => c.title === input.title)
  if (exact) return { match: exact, similarity: 1 }

  // 2) 相似度匹配：title 与 detail 综合比较，取最高分
  let best: UserPersona | null = null
  let bestScore = 0
  for (const c of candidates) {
    const titleSim = personaTextSimilarity(input.title, c.title)
    const detailSim = input.detail && c.detail
      ? personaTextSimilarity(input.detail, c.detail)
      : 0
    const score = Math.max(titleSim, detailSim * 0.9)
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  if (best && bestScore >= PERSONA_MERGE_THRESHOLD) {
    return { match: best, similarity: bestScore }
  }
  return null
}

/**
 * 把 src 合并进 target：保留更详细的 detail、取更高置信度、合并 source 标记，
 * 然后删除 src（避免重复）。返回合并后的 target。
 */
export async function mergePersonaInto(
  target: UserPersona,
  src: UserPersona,
): Promise<UserPersona | null> {
  const mergedDetail =
    (src.detail?.length ?? 0) > (target.detail?.length ?? 0)
      ? src.detail
      : target.detail
  const sources = new Set([target.source, src.source])
  const mergedSource: PersonaSource =
    target.source === 'manual' || src.source === 'manual' ? 'manual' : target.source
  const mergedConfidence = higherConfidence(target.confidence, src.confidence)
  const updated = await updatePersona(target.id, {
    detail: mergedDetail,
    confidence: mergedConfidence,
    source: sources.size > 1 ? mergedSource : target.source,
  })
  if (!updated) return null
  await deletePersona(src.id)
  return updated
}

/**
 * chat 自动沉淀入口（原则 A）：把对话中识别出的「关于用户个人的陈述」写入个人记忆。
 * 若同类别+相近表述已存在，则合并更新而非重复插入（semantic merge）。
 * 合并策略：保留更长/更详细的 detail，置信度取更高等级，source 标记 chat。
 */
export async function recordPersonaFromChat(
  input: PersonaInput,
): Promise<UserPersona | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const dup = await findDuplicatePersona(input)
  if (dup) {
    const { data, error } = await supabase
      .from('user_persona')
      .update({
        title: input.title,
        detail:
          input.detail && input.detail.length >= (dup.match.detail?.length ?? 0)
            ? input.detail
            : dup.match.detail,
        source: 'chat',
        confidence: input.confidence
          ? higherConfidence(input.confidence, dup.match.confidence)
          : dup.match.confidence,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dup.match.id)
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
