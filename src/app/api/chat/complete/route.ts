import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAIChatJSON } from '@/lib/ai/client'
import { getOpenActionsWithIds } from '@/lib/chat/context'
import { parseCompleteExtraction } from '@/lib/chat/complete-extractor'
import type { ChatHistoryEntry } from '@/lib/chat/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ hasComplete: false }, { status: 200 })

  let body: { transcript?: unknown; locale?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ hasComplete: false }, { status: 200 })
  }

  const transcript = Array.isArray(body.transcript) ? (body.transcript as ChatHistoryEntry[]).slice(-12) : []
  if (transcript.length === 0) return Response.json({ hasComplete: false }, { status: 200 })

  const openActions = await getOpenActionsWithIds(supabase, user.id)
  if (openActions.length === 0) return Response.json({ hasComplete: false }, { status: 200 })

  const candidateList = openActions.map((a) => `- id: ${a.id} | 标题: ${a.title}`).join('\n')

  const messages = [
    {
      role: 'system' as const,
      content: `你是 FlowSpark 系统的"完成检测"模块。下面是一段用户与系统的对话，以及该用户当前【未完成】的行动清单（带 id）。

你的任务：判断用户在这一轮里是否明确表示某条【未完成】行动已经被他完成 / 做完 / 搞定了。
- 如果命中：从清单里选出最匹配的那一条，返回它的 id 与标题，并简短说明为什么判断他完成了（reason）。
- 如果没命中（比如只是泛泛说"都做完了"但无法对应到具体条目，或只是在问推荐），返回 hasComplete: false。
- 绝对不要编造清单里不存在的 id；只从下面的清单里选。
- 只输出 JSON，不要任何额外文字。

未完成行动清单：
${candidateList}

输出格式：
{"hasComplete": boolean, "actionId": string|null, "title": string|null, "reason": string|null}`
    },
    ...transcript.map((t) => ({
      role: 'user' as const,
      content: t.role === 'assistant' ? `系统：${t.text}` : `用户：${t.text}`
    }))
  ]

  try {
    const raw = await callAIChatJSON({ messages, temperature: 0.1 })
    const { hasComplete, draft } = parseCompleteExtraction(raw)
    if (hasComplete && draft) {
      return Response.json({ hasComplete: true, draft }, { status: 200 })
    }
    return Response.json({ hasComplete: false }, { status: 200 })
  } catch {
    return Response.json({ hasComplete: false }, { status: 200 })
  }
}
