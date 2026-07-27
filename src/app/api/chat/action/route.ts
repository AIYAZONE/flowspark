import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAIChatJSON } from '@/lib/ai/client'
import { parseActionExtraction } from '@/lib/chat/action-extractor'
import type { ChatHistoryEntry } from '@/lib/chat/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EXTRACTION_SYSTEM_PROMPT = `你是 FlowSpark 系统对话的「行动提取器」。给定一个用户与系统内核的对话，判断用户是否明确想要创建一条新的「目标 / 路径」或「行动 / 待办」来推进自己的人生路径。

只输出 JSON，不要任何解释。两种结果之一：
- 如果没有明确的创建意图：{"hasAction": false}
- 如果有明确创建意图：{"hasAction": true, "draft": {"kind": "goal" | "action", "title": string, "goalHint": string | null, "reason": string | null}}

规则：
- kind 为 "goal" 表示新的长期方向 / 路径；为 "action" 表示具体的下一步行动。
- title 必须是简洁、可执行的短语（中文）。
- goalHint：如果该行动归属于用户已有的某个目标，填该目标标题的关键片段；否则 null。
- reason：一句话说明为什么建议记录这条（可为 null）。
- 不要凭空捏造；只有在对话中确实存在明确创建意图时才返回 hasAction: true。`

export async function POST(req: NextRequest) {
  let parsed: { transcript?: ChatHistoryEntry[]; locale?: string }
  try {
    parsed = await req.json()
  } catch {
    return Response.json({ hasAction: false }, { status: 200 })
  }

  const transcript = Array.isArray(parsed.transcript) ? parsed.transcript.slice(-12) : []
  if (transcript.length === 0) return Response.json({ hasAction: false }, { status: 200 })

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ hasAction: false }, { status: 200 })

  const locale: 'zh' | 'en' = parsed.locale === 'en' ? 'en' : 'zh'

  const messages = [
    { role: 'system' as const, content: EXTRACTION_SYSTEM_PROMPT },
    ...transcript.map((t) => ({
      role: 'user' as const,
      content: t.role === 'assistant' ? `系统：${t.text}` : `用户：${t.text}`
    })),
    {
      role: 'user' as const,
      content: locale === 'en' ? 'Decide whether to extract an action. Output JSON only.' : '判断是否需要提取行动，仅输出 JSON。'
    }
  ]

  try {
    const raw = await callAIChatJSON({ messages, temperature: 0.1 })
    const { hasAction, draft } = parseActionExtraction(raw)
    if (hasAction && draft) {
      return Response.json({ hasAction: true, draft }, { status: 200 })
    }
    return Response.json({ hasAction: false }, { status: 200 })
  } catch {
    return Response.json({ hasAction: false }, { status: 200 })
  }
}
