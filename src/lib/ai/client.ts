export type AIProvider = 'deepseek' | 'openai'

export type ChatMessage = { role: 'system' | 'user'; content: string }

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
  return process.env.AI_API_KEY || (provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY)
}

function getBaseUrl(provider: AIProvider) {
  return (
    process.env.AI_BASE_URL ||
    (provider === 'deepseek'
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
      : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'))
  )
}

function getModel(provider: AIProvider) {
  return (
    process.env.AI_MODEL ||
    (provider === 'deepseek'
      ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
      : (process.env.OPENAI_MODEL || 'gpt-4o-mini'))
  )
}

export async function callAIChatJSON(opts: {
  messages: ChatMessage[]
  temperature?: number
  timeoutMs?: number
}): Promise<string> {
  const provider = getProvider()
  const apiKey = getApiKey(provider)
  if (!apiKey) throw new Error('missing_ai_key')

  const endpoint = joinUrl(getBaseUrl(provider), '/chat/completions')
  const model = getModel(provider)
  const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.2
  const timeoutMs =
    typeof opts.timeoutMs === 'number'
      ? opts.timeoutMs
      : (process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : 12000)

  const makeBody = (withResponseFormat: boolean) => {
    const body: Record<string, unknown> = {
      model,
      temperature,
      stream: false,
      messages: opts.messages
    }
    if (withResponseFormat && provider === 'openai') {
      body.response_format = { type: 'json_object' }
    }
    return body
  }

  const call = async (withResponseFormat: boolean) => {
    const controller = new AbortController()
    const timeoutId = Number.isFinite(timeoutMs) && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null
    try {
      return await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(makeBody(withResponseFormat)),
        signal: controller.signal
      })
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw new Error('ai_timeout')
      throw e
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  let response = await call(true)
  if (!response.ok) {
    response = await call(false)
  }
  if (!response.ok) throw new Error('ai_provider_error')

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('empty_ai_response')
  return content
}
