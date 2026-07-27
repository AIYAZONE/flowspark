import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamAIChat, type StreamChatMessage } from '@/lib/ai/stream'
import { buildChatSystemPrompt } from '@/lib/chat/prompt'
import { getChatContext } from '@/lib/chat/context'
import type { ChatHistoryEntry, ChatStreamEvent } from '@/lib/chat/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_HISTORY = 10

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
  let parsed: { message?: string; history?: ChatHistoryEntry[]; locale?: string }
  try {
    parsed = await req.json()
  } catch {
    return sseError('invalid_request')
  }

  const message = (parsed.message || '').trim()
  if (!message) return sseError('empty_message')

  const locale: 'zh' | 'en' = parsed.locale === 'en' ? 'en' : 'zh'
  const history = Array.isArray(parsed.history) ? parsed.history.slice(-MAX_HISTORY) : []

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return sseError('unauthenticated')

  let context
  try {
    context = await getChatContext(supabase, user.id)
  } catch {
    return sseError('context_error')
  }

  const messages: StreamChatMessage[] = [
    { role: 'system', content: buildChatSystemPrompt({ context, locale }) },
    ...history.map((h) => ({ role: h.role, content: h.text })),
    { role: 'user', content: message }
  ]

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamAIChat({ messages, signal: req.signal })) {
          controller.enqueue(new TextEncoder().encode(sse({ type: 'text', value: delta })))
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
