import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamAIChat, type StreamChatMessage } from '@/lib/ai/stream'
import { buildChatSystemPrompt } from '@/lib/chat/prompt'
import { getChatContext, getOpenActionsWithIds } from '@/lib/chat/context'
import { findReferencedOpenActions } from '@/lib/chat/action-dedup'
import type { ChatHistoryEntry, ChatStreamEvent } from '@/lib/chat/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_HISTORY = 20

function sse(data: ChatStreamEvent): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

function sseError(message: string): Response {
  return new Response(sse({ type: 'error', message }), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}

export async function POST(req: NextRequest) {
  let parsed: { message?: string; history?: ChatHistoryEntry[]; summary?: string; locale?: string }
  try {
    parsed = await req.json()
  } catch {
    return sseError('invalid_request')
  }

  const message = (parsed.message || '').trim()
  if (!message) return sseError('empty_message')

  const locale: 'zh' | 'en' = parsed.locale === 'en' ? 'en' : 'zh'
  const history = Array.isArray(parsed.history) ? parsed.history.slice(-MAX_HISTORY) : []
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return sseError('unauthenticated')

  let context
  try {
    context = await getChatContext(supabase, user.id, locale)
  } catch {
    return sseError('context_error')
  }

  // 读取用户已有的开放行动，用于在回复里识别被引用的行动（渲染引用卡）
  let openActions: Awaited<ReturnType<typeof getOpenActionsWithIds>> = []
  try {
    openActions = await getOpenActionsWithIds(supabase, user.id)
  } catch {
    // 降级：不生成引用卡，聊天主流程不受影响
  }

  const summaryMessage: StreamChatMessage | null = summary
    ? {
        role: 'system',
        content:
          locale === 'en'
            ? `【Conversation history summary】The following is a compressed summary of earlier turns (beyond the recent window) for background context:\n${summary}`
            : `【历史摘要】以下为本次对话更早轮次的压缩要点，供你理解背景（非当前提问）：\n${summary}`
      }
    : null

  const messages: StreamChatMessage[] = [
    { role: 'system', content: buildChatSystemPrompt({ context, locale }) },
    ...(summaryMessage ? [summaryMessage] : []),
    ...history.map((h) => ({ role: h.role, content: h.text })),
    { role: 'user', content: message }
  ]

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let full = ''
        for await (const delta of streamAIChat({ messages, signal: req.signal })) {
          full += delta
          controller.enqueue(new TextEncoder().encode(sse({ type: 'text', value: delta })))
        }
        // 回复完整后，识别其中被提及的用户已有开放行动，下发引用卡数据
        if (openActions.length) {
          const refs = findReferencedOpenActions(full, openActions)
          if (refs.length) {
            controller.enqueue(new TextEncoder().encode(sse({ type: 'references', actions: refs })))
          }
        }
        controller.enqueue(new TextEncoder().encode(sse({ type: 'done' })))
      } catch (e) {
        const message = e instanceof Error ? e.message : 'ai_error'
        controller.enqueue(new TextEncoder().encode(sse({ type: 'error', message })))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
