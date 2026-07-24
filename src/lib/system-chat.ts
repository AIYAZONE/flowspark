export type SystemChatSource = 'system' | 'today' | 'profile'
export type SystemChatLocale = 'zh' | 'en'

export function buildSystemChatHref(params: {
  source?: SystemChatSource
  prefill?: string | null
}) {
  const searchParams = new URLSearchParams()
  if (params.source) searchParams.set('source', params.source)
  if (params.prefill) searchParams.set('prefill', params.prefill)
  const query = searchParams.toString()
  return query ? `/chat?${query}` : '/chat'
}

export function getSystemChatSourceCopy(params: {
  source?: string | null
  locale: SystemChatLocale
}) {
  const { source, locale } = params

  if (source === 'today') {
    return locale === 'zh'
      ? {
          eyebrow: '来自今日',
          title: '继续推进今天这一步',
          body: '这里是唯一的系统对话场。你可以直接问系统现在该推进什么，或把今天卡住的地方说出来。',
        }
      : {
          eyebrow: 'From Today',
          title: 'Continue today’s next step',
          body: 'This is the only place for system conversation. Ask what to push now or describe where today is stuck.',
        }
  }

  if (source === 'profile') {
    return locale === 'zh'
      ? {
          eyebrow: '来自自我',
          title: '继续做你的状态分析',
          body: '这里是唯一的系统对话场。你可以直接让系统分析你最近怎么了，或继续上一轮判断。',
        }
      : {
          eyebrow: 'From You',
          title: 'Continue your self analysis',
          body: 'This is the only place for system conversation. Ask for a state analysis or continue the previous read.',
        }
  }

  return locale === 'zh'
    ? {
        eyebrow: '系统对话',
        title: '在这里直接和系统对话',
        body: '输入和回答会始终留在同一页里。你可以直接问下一步、做分析，或继续上一轮对话。',
      }
    : {
        eyebrow: 'System Chat',
        title: 'Talk to the system here',
        body: 'Input and replies stay on the same page. Ask for the next step, analysis, or continue the previous turn.',
      }
}
