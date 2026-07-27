// Streaming companion to src/lib/ai/client.ts (which is JSON-only).
// Kept fully independent so the existing callAIChatJSON stays untouched.

export type StreamChatRole = 'system' | 'user' | 'assistant'
export type StreamChatMessage = { role: StreamChatRole; content: string }

type AIProvider = 'deepseek' | 'openai'

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, '')
  return `${base}${path}`
}

function getProvider(): AIProvider {
  const envProvider = process.env.AI_PROVIDER
  if (envProvider === 'deepseek' || envProvider === 'openai') return envProvider
  return process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'openai'
}

function getApiKey(provider: AIProvider) {
  return (
    process.env.AI_API_KEY ||
    (provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY)
  )
}

function getBaseUrl(provider: AIProvider) {
  return (
    process.env.AI_BASE_URL ||
    (provider === 'deepseek'
      ? process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
      : process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1')
  )
}

function getConfiguredAIModel(provider: AIProvider) {
  const resolvedProvider = provider
  return (
    process.env.AI_MODEL ||
    (resolvedProvider === 'deepseek'
      ? process.env.DEEPSEEK_MODEL || 'deepseek-chat'
      : process.env.OPENAI_MODEL || 'gpt-4o-mini')
  )
}

/**
 * Splits an accumulated SSE text buffer into individual `data:` payloads,
 * returning the parsed payloads plus the trailing incomplete remainder so the
 * caller can preserve it across chunk boundaries.
 */
export function splitSSEEvents(buffer: string): { events: string[]; rest: string } {
  const events: string[] = []
  let rest = buffer
  let sep: number
  while ((sep = rest.indexOf('\n\n')) >= 0) {
    const chunk = rest.slice(0, sep)
    rest = rest.slice(sep + 2)
    for (const line of chunk.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data:')) {
        events.push(trimmed.slice(5).trim())
      }
    }
  }
  return { events, rest }
}

/**
 * Yields incremental text deltas from a streamed chat completion.
 * Compatible with DeepSeek and OpenAI (OpenAI-compatible SSE).
 */
export async function* streamAIChat(opts: {
  messages: StreamChatMessage[]
  temperature?: number
  timeoutMs?: number
  signal?: AbortSignal
}): AsyncGenerator<string> {
  const provider = getProvider()
  const apiKey = getApiKey(provider)
  if (!apiKey) throw new Error('missing_ai_key')

  const endpoint = joinUrl(getBaseUrl(provider), '/chat/completions')
  const model = getConfiguredAIModel(provider)
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.6
  const timeoutMs =
    typeof opts.timeoutMs === 'number'
      ? opts.timeoutMs
      : process.env.AI_TIMEOUT_MS
        ? Number(process.env.AI_TIMEOUT_MS)
        : 12000

  const controller = new AbortController()
  const timeoutId =
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null

  const onExternalAbort = () => controller.abort()
  if (opts.signal) opts.signal.addEventListener('abort', onExternalAbort)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature,
        stream: true,
        messages: opts.messages
      }),
      signal: controller.signal
    })

    if (!response.ok || !response.body) {
      throw new Error('ai_provider_error')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
          buffer += decoder.decode(value, { stream: true })

          const { events, rest } = splitSSEEvents(buffer)
          buffer = rest

          for (const payload of events) {
            if (!payload || payload === '[DONE]') continue
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>
              }
              const delta = json.choices?.[0]?.delta?.content
              if (typeof delta === 'string' && delta.length > 0) {
                yield delta
              }
            } catch {
              // Ignore malformed / partial SSE payloads.
            }
          }
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('ai_timeout')
    throw e
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    if (opts.signal) opts.signal.removeEventListener('abort', onExternalAbort)
  }
}
