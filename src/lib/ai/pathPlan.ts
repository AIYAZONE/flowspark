import { callAIChatJSON } from '@/lib/ai/client'
import { buildPersonaSummary, recordPersonaFromChat, type PersonaCategory } from '@/lib/persona'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PathPlanMilestone {
  title: string
  target_date: string | null // YYYY-MM-DD 或 null
  key_results: { title: string; target: string }[]
}

export interface PathPlanResult {
  positioning: {
    persona: string // 人设一句话，如 "知识型IP"
    oneLiner: string // 定位标语
    threePieces: { who: string; forWhom: string; solves: string } // 人设三件套
    audience: string // 受众画像
  }
  pillars: { title: string; rationale: string }[]
  milestones: PathPlanMilestone[]
  // 诊断式补全的人设，回写 user_persona（原则 A）
  personaUpdates: {
    category: PersonaCategory
    title: string
    detail: string
    confidence: 'low' | 'medium' | 'high'
  }[]
  assumptions: string[] // 信息不足时的假设标注
}

const PATH_PLAN_PROMPT = (locale: 'zh' | 'en', personaSummary: string) => `你是一位资深的人生规划师与多领域专家（原则 B：面对具体目标时，你以该领域的全能大咖人格给出可执行方案，敢给结论、敢拍板）。

用户正在创建/规划一条「人生路径」（goal）。你的任务是基于用户的【个人记忆】与对话，生成一份结构化的定位与执行方案。

【个人记忆（已沉淀的用户人设，务必作为推导原料）】
${personaSummary}

输出要求（严格遵守 JSON-only，不要解释）：
{
  "positioning": {
    "persona": "人设一句话，如 '知识型IP·经典共读'",
    "oneLiner": "定位标语，一句能对外说的标签",
    "threePieces": { "who": "你是谁", "forWhom": "为谁", "solves": "解决什么" },
    "audience": "受众画像描述"
  },
  "pillars": [ { "title": "内容支柱名", "rationale": "为什么是这个支柱" } ],   // 3 个左右
  "milestones": [
    { "title": "阶段名", "target_date": "YYYY-MM-DD 或 null", "key_results": [ { "title": "KR 描述", "target": "量化目标，如 发布12条视频" } ] }
  ],   // 3-4 个阶段，含可量化 KR
  "personaUpdates": [   // 在本次对话中识别出的、可补全用户人设的信息（原则 A）
    { "category": "strength|value|experience|aspiration|aversion|context", "title": "简短标签", "detail": "展开说明", "confidence": "low|medium|high" }
  ],
  "assumptions": [ "信息不足时做的假设，如 '未确认内容形式，暂按口播处理'" ]
}

规则：
- 若个人记忆为空或不足，先基于目标做合理假设并填入 assumptions，最多做 3 轮诊断（由调用方控制轮次）。
- personaUpdates 只写「关于用户本人的、可长期复用」的信息；纯目标执行信息不要写。
- 语言跟随用户对话（${locale === 'zh' ? '中文' : 'English'}）。
`

export async function planPath(
  supabase: SupabaseClient,
  input: {
    locale: 'zh' | 'en'
    goalId?: string
    goalTitle: string
    goalDescription?: string | null
    conversation: { role: 'user' | 'assistant'; content: string }[]
  },
): Promise<PathPlanResult> {
  const personaSummary = await buildPersonaSummary()

  // 路径 → chat 联动：读取该 goal 已有的定位卡作为上下文，避免重复生成
  let existingContext = ''
  if (input.goalId) {
    const { data: goal } = await supabase
      .from('goals')
      .select('positioning')
      .eq('id', input.goalId)
      .maybeSingle()
    if (goal?.positioning) {
      existingContext = `\n【该路径已有的定位卡（如存在，请在此基础上迭代而非重复）】\n${JSON.stringify(goal.positioning)}`
    }
  }

  const messages = [
    { role: 'system' as const, content: PATH_PLAN_PROMPT(input.locale, personaSummary) },
    {
      role: 'user' as const,
      content: `目标标题：${input.goalTitle}\n目标描述：${input.goalDescription ?? '（无）'}${existingContext}`,
    },
    ...input.conversation.map((m) => ({ role: m.role, content: m.content })),
  ]

  const call = (m: typeof messages) => callAIChatJSON(m as never)

  const first = await call(messages)
  const parsedFirst = parsePathPlan(first)
  let plan: PathPlanResult
  if (parsedFirst) {
    plan = parsedFirst
  } else {
    // 一次 repair 重试
    const repaired = await call([
      ...messages,
      {
        role: 'user',
        content:
          '你的输出不是合法 JSON 或缺少必填字段。请只输出符合最初要求的结构化 JSON，不要任何解释。',
      },
    ] as never)
    const parsedSecond = parsePathPlan(repaired)
    if (!parsedSecond) throw new Error('invalid_ai_output')
    plan = parsedSecond
  }

  // 原则 A：把诊断式补全的人设落写进个人记忆
  for (const p of plan.personaUpdates ?? []) {
    await recordPersonaFromChat({
      category: p.category,
      title: p.title,
      detail: p.detail,
      confidence: p.confidence,
    })
  }

  return plan
}

function parsePathPlan(text: unknown): PathPlanResult | null {
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
  const personaUpdates = Array.isArray(r.personaUpdates)
    ? (r.personaUpdates as Record<string, unknown>[])
        .filter((p) => typeof p.title === 'string' && typeof p.category === 'string')
        .map((p) => ({
          category: p.category as PathPlanResult['personaUpdates'][number]['category'],
          title: p.title as string,
          detail: typeof p.detail === 'string' ? p.detail : '',
          confidence: (typeof p.confidence === 'string' ? p.confidence : 'medium') as
            | 'low'
            | 'medium'
            | 'high',
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
    personaUpdates,
    assumptions,
  }
}
