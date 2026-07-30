import { callAIChatJSON } from '@/lib/ai/client'
import { safeParseJSON } from '@/lib/ai/json'

export type ActionLinkSuggestion = {
  targetId: string
  title: string
  reason: string
  linkType: 'related' | 'precedes'
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeLinkType(value: unknown): 'related' | 'precedes' {
  return value === 'precedes' ? 'precedes' : 'related'
}

// 仅做"建议"：读 source + 候选行动，让 LLM 判断哪些明显属于同一件事 / 应前后承接。
// 返回的建议由调用方决定是否真正建链（AI 绝不改任何数据）。
export async function suggestActionLinksAI(params: {
  source: { id: string; title: string; description?: string | null }
  candidates: Array<{ id: string; title: string }>
  locale: 'zh' | 'en'
}): Promise<ActionLinkSuggestion[]> {
  if (params.candidates.length === 0) return []

  const system =
    params.locale === 'zh'
      ? [
          '你是任务管理产品里负责"关联建议"的模块。',
          '只输出严格 JSON 数组，不要 markdown 或解释文字。',
          '数组每个元素字段：targetId(用候选的 id)、title(对应候选的 title，原样返回)、linkType("related" 或 "precedes")、reason(中文，一句话说明为什么该关联)。',
          '只建议确实属于同一件事、或明显应前后承接的行动；不确定就不要建议。最多 8 条。'
        ].join('\n')
      : [
          'You are the link-suggestion module of a task-management product.',
          'Output STRICT JSON array only. No markdown or extra text.',
          'Each element: targetId(use a candidate id), title(the candidate title, verbatim), linkType("related" or "precedes"), reason(one English sentence why it should be linked).',
          'Only suggest actions that are genuinely the same effort or clearly sequential. Do not guess. Max 8.'
        ].join('\n')

  const user = [
    'Source action (the one being viewed):',
    JSON.stringify({
      id: params.source.id,
      title: params.source.title,
      description: params.source.description ?? ''
    }),
    '',
    'Candidate actions (pick targetId from these ids):',
    JSON.stringify(params.candidates)
  ].join('\n')

  try {
    const raw = await callAIChatJSON({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2
    })
    const parsed = safeParseJSON(raw)
    if (!Array.isArray(parsed)) return []

    const ids = new Set(params.candidates.map((c) => c.id))
    const titleById = new Map(params.candidates.map((c) => [c.id, c.title]))

    return parsed
      .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && !Array.isArray(p))
      .filter((p) => typeof p.targetId === 'string' && ids.has(p.targetId))
      .map((p) => ({
        targetId: p.targetId as string,
        title: titleById.get(p.targetId as string) ?? '',
        reason: asString(p.reason),
        linkType: normalizeLinkType(p.linkType)
      }))
      .slice(0, 8)
  } catch {
    return []
  }
}
