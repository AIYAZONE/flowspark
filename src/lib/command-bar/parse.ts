import type { ParsedUserCommand } from './types.ts'

function splitFirstIntent(rawText: string) {
  const text = rawText.trim()
  if (!text) return { first: '', rest: null as string | null }

  const separators = ['，', ',', '；', ';', '。', '.', '然后', '顺便', '另外']
  for (const sep of separators) {
    const idx = text.indexOf(sep)
    if (idx > 0 && idx < text.length - 1) {
      const first = text.slice(0, idx).trim()
      const rest = text.slice(idx + sep.length).trim()
      const cleanedRest = rest.replace(/^(顺便|另外|然后|再|并且|而且)/u, '').trim()
      if (first) return { first, rest: cleanedRest || null }
    }
  }
  return { first: text, rest: null }
}

function includesAny(text: string, words: string[]) {
  const t = text.toLowerCase()
  return words.some((w) => t.includes(w))
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text))
}

function isCurrentTaskReviewIntent(text: string) {
  const normalized = text.trim().toLowerCase()

  if (includesAny(normalized, [
    '我现在有什么任务',
    '现在有什么任务',
    '我现在有什么action',
    '我有哪些任务',
    '有哪些任务',
    '当前任务',
    '现在任务',
    '待办',
    'todo',
    'what tasks do i have',
    'what do i have',
    'current tasks',
  ])) {
    return true
  }

  return matchesAny(normalized, [
    /(?:我)?现在(?:能|可以)?(?:先)?(?:该|应该)?(?:做|干|推进|处理|开始).{0,4}(?:什么|啥|哪一项|哪个)/u,
    /(?:我)?下一步(?:能|可以)?(?:该|应该)?(?:做|干|推进|处理).{0,4}(?:什么|啥|哪一项|哪个)/u,
    /接下来(?:我)?(?:能|可以)?(?:该|应该)?(?:做|干|推进|处理).{0,4}(?:什么|啥|哪一项|哪个)/u,
    /现在(?:先)?(?:做|干|推进|处理).{0,4}(?:什么|啥|哪一项|哪个)/u,
    /what should i do(?: now| next)?/u,
    /what do i do next/u,
  ])
}

function isMainPathReviewIntent(text: string) {
  const normalized = text.trim().toLowerCase()

  if (includesAny(normalized, [
    '今天主线是什么',
    '现在主线是什么',
    '当前主线是什么',
    '核心是什么',
    '现在最重要的是什么',
    '最重要的是什么',
    '现在优先哪个',
    '现在优先做哪个',
    '当前优先级是什么',
    'main path',
    'top priority',
    'highest priority',
  ])) {
    return true
  }

  return matchesAny(normalized, [
    /(?:今天|现在|当前)?(?:主线|核心|重点|优先级).{0,4}(?:是什么|是啥|哪个|哪条)/u,
    /(?:现在|当前|今天)?最重要.{0,4}(?:是什么|是啥|哪个|哪条)/u,
    /(?:现在|当前|今天|接下来)?优先.{0,4}(?:推进|做|处理).{0,4}(?:哪个|哪条|哪一项)/u,
    /接下来(?:我)?(?:该|应该)?推进(?:哪个|哪条)/u,
    /which path should i prioritize/u,
    /what is the main path/u,
  ])
}

function isCapabilityIntent(text: string) {
  const normalized = text.trim().toLowerCase()

  if (includesAny(normalized, [
    '你能干什么',
    '你可以干什么',
    '你能做什么',
    '你可以做什么',
    '你能帮我做什么',
    '你可以帮我做什么',
    'what can you do',
    'how can you help',
  ])) {
    return true
  }

  return matchesAny(normalized, [
    /你(?:能|可以).{0,6}(?:干什么|做什么|帮我做什么)/u,
    /你(?:都)?(?:能|可以)帮我.{0,8}(?:什么|哪些事)/u,
  ])
}

function isCreateActionIntent(text: string) {
  const normalized = text.trim().toLowerCase()

  if (includesAny(normalized, [
    '创建行动',
    '新建行动',
    '新增行动',
    '加一个行动',
    '创建 action',
    'create action',
    'add action',
  ])) {
    return true
  }

  return matchesAny(normalized, [
    /(?:帮我|给我|想)?(?:创建|新建|新增|添加|加一个).{0,6}(?:行动|action)/u,
    /(?:能|可以).{0,6}(?:帮我)?(?:创建|新建|新增|添加).{0,6}(?:行动|action)/u,
  ])
}

export function parseUserCommand(rawText: string): ParsedUserCommand {
  const { first, rest } = splitFirstIntent(rawText)
  const mentionsCore = includesAny(first, ['核心', 'main thread', 'core'])
  const asksCapabilities = isCapabilityIntent(first)
  const asksCreateAction = isCreateActionIntent(first)
  const asksMainPath = isMainPathReviewIntent(first)
  const asksCurrentTasks = isCurrentTaskReviewIntent(first)

  const kind =
    asksCapabilities
      ? 'ask_capabilities'
      : asksCreateAction
      ? 'create_action_request'
      : asksMainPath
      ? 'review_main_path'
      : asksCurrentTasks
      ? 'review_current_tasks'
      : includesAny(first, ['完成', '做完', '搞定', 'done', 'finished'])
      ? 'complete_action'
      : mentionsCore
        ? 'set_today_core'
        : includesAny(first, ['推进', '往前', '下一步', 'push'])
          ? 'push_next_step'
          : 'unknown'

  return {
    rawText,
    firstIntentText: first,
    followupText: rest,
    kind,
    mentionsCore,
    isMultiIntent: Boolean(rest),
  }
}
