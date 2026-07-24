import { callAIChatJSON } from '../ai/client.ts'
import { generateWithSingleRepair } from '../ai/phase2aQuality.ts'
import { buildChatAgentMessages } from './prompt.ts'
import { parseChatAgentUnderstanding, type ChatAgentSurface, type ChatAgentUnderstanding } from './schemas.ts'

export async function aiChatUnderstand(params: {
  locale: 'zh' | 'en'
  userText: string
  sourcePage: ChatAgentSurface
  goals: Array<{
    id: string
    title: string
    priority: string | null
    start_date: string | null
    end_date: string | null
  }>
  openActions: Array<{
    id: string
    title: string
    goalId: string | null
    goalTitle: string | null
    priority: string | null
    type: string | null
  }>
  recentTurns: Array<{
    userText: string
    assistantText: string
    state: string
    sourcePage: ChatAgentSurface
  }>
}): Promise<ChatAgentUnderstanding> {
  const messages = buildChatAgentMessages(params)
  return generateWithSingleRepair({
    locale: params.locale,
    messages,
    call: (nextMessages) => callAIChatJSON({ messages: nextMessages, temperature: 0.15, timeoutMs: 10000 }),
    parse: parseChatAgentUnderstanding,
  })
}
