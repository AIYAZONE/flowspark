import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAIChatJSON } from '@/lib/ai/client'
import type { ChatHistoryEntry, ChatIdeaDraft } from '@/lib/chat/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type IdeaExtraction =
  | { hasIdea: false }
  | { hasIdea: true; draft: ChatIdeaDraft }

const EXTRACTION_SYSTEM_PROMPT = `你是 FlowSpark 系统对话的「IP 选题提取器」。给定一个用户与系统内核的对话，判断用户是否在讨论自己的个人 IP / 自媒体内容，并是否产出了值得沉淀的一条内容选题。

只输出 JSON，不要任何解释。两种结果之一：
- 如果没有明确的内容选题产出：{"hasIdea": false}
- 如果有明确选题产出：{"hasIdea": true, "draft": {"kind": "idea", "title": string, "angle": string | null, "hook": string | null, "notes": string | null}}

规则：
- title：这条内容选题的标题（中文，简洁）。
- angle：内容切入角度 / 观点（可为 null）。
- hook：开头钩子 / 吸引人的一句话（可为 null）。
- notes：内容要点或正文片段（可为 null）。
- 不要凭空捏造；只有在对话中确实产出了一条可沉淀的选题时才返回 hasIdea: true。
- 闲聊、纯问答、没有具体选题时返回 hasIdea: false。`

function parseIdeaExtraction(raw: string): IdeaExtraction {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    if (obj.hasIdea !== true) return { hasIdea: false }
    const draft = obj.draft as Record<string, unknown> | undefined
    if (!draft || typeof draft.title !== 'string' || !draft.title.trim()) return { hasIdea: false }
    return {
      hasIdea: true,
      draft: {
        kind: 'idea',
        title: String(draft.title).trim(),
        angle: typeof draft.angle === 'string' ? draft.angle.trim() || null : null,
        hook: typeof draft.hook === 'string' ? draft.hook.trim() || null : null,
        notes: typeof draft.notes === 'string' ? draft.notes.trim() || null : null,
      },
    }
  } catch {
    return { hasIdea: false }
  }
}

export async function POST(req: NextRequest) {
  let parsed: { transcript?: ChatHistoryEntry[]; locale?: string }
  try {
    parsed = await req.json()
  } catch {
    return Response.json({ hasIdea: false }, { status: 200 })
  }

  const transcript = Array.isArray(parsed.transcript) ? parsed.transcript.slice(-12) : []
  if (transcript.length === 0) return Response.json({ hasIdea: false }, { status: 200 })

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ hasIdea: false }, { status: 200 })

  const locale: 'zh' | 'en' = parsed.locale === 'en' ? 'en' : 'zh'

  const messages = [
    { role: 'system' as const, content: EXTRACTION_SYSTEM_PROMPT },
    ...transcript.map((t) => ({
      role: 'user' as const,
      content: t.role === 'assistant' ? `系统：${t.text}` : `用户：${t.text}`
    })),
    {
      role: 'user' as const,
      content: locale === 'en' ? 'Decide whether to extract a content idea. Output JSON only.' : '判断是否需要提取内容选题，仅输出 JSON。'
    }
  ]

  try {
    const raw = await callAIChatJSON({ messages, temperature: 0.1 })
    const result = parseIdeaExtraction(raw)
    if (result.hasIdea && result.draft?.title) {
      return Response.json({ hasIdea: true, draft: result.draft }, { status: 200 })
    }
    return Response.json({ hasIdea: false }, { status: 200 })
  } catch {
    return Response.json({ hasIdea: false }, { status: 200 })
  }
}
