import { callAIChatJSON } from '@/lib/ai/client'
import { buildPersonaSummary, recordPersonaFromChat, type PersonaInput } from '@/lib/persona'
import type { PersonaCategory } from '@/lib/persona-types'
import type { PathPlanResult } from '@/lib/ai/pathPlan'

const CATEGORIES: PersonaCategory[] = [
  'strength',
  'value',
  'experience',
  'aspiration',
  'aversion',
  'context',
]

const EXTRACT_PERSONA_PROMPT = (locale: 'zh' | 'en') => `你是一位信息抽取专家。用户会粘贴/上传一份他在「其他 AI 工具或文档」里已经做过的人生规划、自我剖析或知识库资料。

你的任务：从资料中抽取一切「关于用户本人的、可长期复用」的个人信息，归到以下 6 类之一，输出结构化 JSON。
- strength 优势：能力、擅长、特质
- value 价值观：看重什么、原则、信念
- experience 经历：做过的事、背景、履历
- aspiration 想成为的人：目标身份、向往的状态
- aversion 抗拒点：反感、排斥、雷区
- context 背景上下文：年龄阶段、职业、环境等客观背景

输出要求（JSON-only，不要解释）：
{
  "items": [
    { "category": "strength|value|experience|aspiration|aversion|context", "title": "简短标签（≤20字）", "detail": "展开说明", "confidence": "low|medium|high" }
  ]
}
规则：
- 只抽关于「用户本人」的信息；纯目标执行/方法论不要抽进来（那是路径，不是人设）。
- 每条 title 要精炼可独立成卡片；detail 补充上下文。
- 若某类无内容则不输出该类。
- 语言跟随资料（${locale === 'zh' ? '中文' : 'English'}）。
`

const EXTRACT_PATH_PROMPT = (locale: 'zh' | 'en', personaSummary: string) => `你是一位资深人生规划师与多领域专家。用户已经在他处（其他 AI 工具/文档）做过一份人生规划，现在要把它「吸收」进本系统的一条路径，而不是从头重做。

你的任务是：把用户粘贴/上传的「已有规划文档」解析成本系统的 5 层路径结构（定位卡 + 策略支柱 + 里程碑 + 关键结果），尽量忠实还原原文，不要臆造。

【用户个人记忆（作为背景参考，不要重复抽取为人设）】
${personaSummary}

输出要求（JSON-only，不要解释）：
{
  "positioning": {
    "persona": "人设一句话",
    "oneLiner": "定位标语",
    "threePieces": { "who": "你是谁", "forWhom": "为谁", "solves": "解决什么" },
    "audience": "受众画像"
  },
  "pillars": [ { "title": "内容支柱名", "rationale": "为什么" } ],
  "milestones": [
    { "title": "阶段名", "target_date": "YYYY-MM-DD 或 null", "key_results": [ { "title": "KR 描述", "target": "量化目标" } ] }
  ],
  "assumptions": [ "原文缺失、由你推断填补的部分" ]
}
规则：
- 忠实还原：文档里已有的内容直接转写，不要改写风格或加戏。
- 文档没有定位卡时，基于文档内容推断并填入 assumptions。
- milestones 3-4 个，含可量化 KR；原文没有日期则填 null。
- 语言跟随资料（${locale === 'zh' ? '中文' : 'English'}）。
`

/** 从已有规划/自我剖析文档中抽取个人记忆条目 */
export async function extractPersonaFromDoc(
  docText: string,
  locale: 'zh' | 'en' = 'zh',
): Promise<PersonaInput[]> {
  const messages = [
    { role: 'system' as const, content: EXTRACT_PERSONA_PROMPT(locale) },
    {
      role: 'user' as const,
      content: `【待抽取资料】\n${docText.slice(0, 16000)}`,
    },
  ]

  const raw = await callAIChatJSON({ messages, temperature: 0.2, timeoutMs: 20000 })
  const parsed = parseItems(raw)
  return parsed.map((p) => ({
    category: p.category,
    title: p.title,
    detail: p.detail,
    confidence: p.confidence,
    source: 'import' as const,
  }))
}

/** 从已有规划文档中抽取 5 层路径结构 */
export async function extractPathFromDoc(
  docText: string,
  locale: 'zh' | 'en' = 'zh',
): Promise<PathPlanResult> {
  const personaSummary = await buildPersonaSummary()
  const messages = [
    { role: 'system' as const, content: EXTRACT_PATH_PROMPT(locale, personaSummary) },
    {
      role: 'user' as const,
      content: `【已有规划文档】\n${docText.slice(0, 16000)}`,
    },
  ]

  const first = await callAIChatJSON({ messages, temperature: 0.2, timeoutMs: 20000 })
  const parsedFirst = parsePath(first)
  if (parsedFirst) return parsedFirst

  const repaired = await callAIChatJSON({
    messages: [
      ...messages,
      {
        role: 'user',
        content: '你的输出不是合法 JSON 或缺少必填字段。请只输出符合最初要求的结构化 JSON，不要任何解释。',
      },
    ],
    temperature: 0.2,
    timeoutMs: 20000,
  })
  const parsedSecond = parsePath(repaired)
  if (!parsedSecond) throw new Error('invalid_ai_output')
  return parsedSecond
}

/** 把抽取出的个人记忆批量落写（带软去重，source='import'） */
export async function saveImportedPersona(items: PersonaInput[]): Promise<number> {
  let saved = 0
  for (const it of items) {
    const r = await recordPersonaFromChat({
      category: it.category,
      title: it.title,
      detail: it.detail,
      confidence: it.confidence ?? 'medium',
      source: 'import',
    })
    if (r) saved += 1
  }
  return saved
}

function parseItems(text: unknown): {
  category: PersonaCategory
  title: string
  detail: string
  confidence: 'low' | 'medium' | 'high'
}[] {
  const raw =
    typeof text === 'string'
      ? (() => {
          try {
            return JSON.parse(text)
          } catch {
            return null
          }
        })()
      : text
  if (!raw || typeof raw !== 'object') return []
  const arr = (raw as Record<string, unknown>).items
  if (!Array.isArray(arr)) return []
  return arr
    .filter(
      (p) =>
        p &&
        typeof p === 'object' &&
        typeof (p as Record<string, unknown>).title === 'string' &&
        CATEGORIES.includes((p as Record<string, unknown>).category as PersonaCategory),
    )
    .map((p) => {
      const o = p as Record<string, unknown>
      return {
        category: o.category as PersonaCategory,
        title: (o.title as string).slice(0, 120),
        detail: typeof o.detail === 'string' ? (o.detail as string).slice(0, 2000) : '',
        confidence: (o.confidence === 'low' || o.confidence === 'high' ? o.confidence : 'medium') as
          | 'low'
          | 'medium'
          | 'high',
      }
    })
}

function parsePath(text: unknown): PathPlanResult | null {
  const raw =
    typeof text === 'string'
      ? (() => {
          try {
            return JSON.parse(text)
          } catch {
            return null
          }
        })()
      : text
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const pos = r.positioning as Record<string, unknown> | undefined
  const tp = pos?.threePieces as Record<string, unknown> | undefined
  if (
    !pos ||
    typeof pos.persona !== 'string' ||
    typeof pos.oneLiner !== 'string' ||
    !tp ||
    typeof tp.who !== 'string' ||
    typeof tp.forWhom !== 'string' ||
    typeof tp.solves !== 'string' ||
    typeof pos.audience !== 'string'
  ) {
    return null
  }
  const pillars = Array.isArray(r.pillars)
    ? (r.pillars as Record<string, unknown>[])
        .filter((p) => typeof p.title === 'string')
        .map((p) => ({ title: p.title as string, rationale: (p.rationale as string) ?? '' }))
    : []
  const milestones = Array.isArray(r.milestones)
    ? (r.milestones as Record<string, unknown>[])
        .filter((m) => typeof m.title === 'string')
        .map((m) => ({
          title: m.title as string,
          target_date: typeof m.target_date === 'string' ? m.target_date : null,
          key_results: Array.isArray(m.key_results)
            ? (m.key_results as Record<string, unknown>[])
                .filter((kr) => typeof kr.title === 'string')
                .map((kr) => ({
                  title: kr.title as string,
                  target: typeof kr.target === 'string' ? kr.target : '',
                }))
            : [],
        }))
    : []
  const assumptions = Array.isArray(r.assumptions)
    ? (r.assumptions as unknown[]).filter((a) => typeof a === 'string') as string[]
    : []
  return {
    positioning: {
      persona: pos.persona,
      oneLiner: pos.oneLiner,
      threePieces: { who: tp.who, forWhom: tp.forWhom, solves: tp.solves },
      audience: pos.audience,
    },
    pillars,
    milestones,
    personaUpdates: [],
    assumptions,
  }
}
