import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatFeedbackReason } from './types.ts'

export type ChatFeedbackSummary = {
  downCount: number
  upCount: number
  topReasons: Array<{ reason: ChatFeedbackReason; count: number }>
  customCount: number
}

const REASON_HINTS: Record<ChatFeedbackReason, { zh: string; en: string }> = {
  too_verbose: {
    zh: '回答更简洁直接，减少铺垫与套话',
    en: 'be more concise and direct, cut filler and preamble'
  },
  not_relevant: {
    zh: '更贴合该用户真实的路径与待推进行动，避免泛泛而谈',
    en: 'stay relevant to this user’s actual paths and pending actions; avoid generic advice'
  },
  inaccurate: {
    zh: '严格基于上下文真实数据，不要臆测或编造',
    en: 'stick strictly to real context data; do not guess or fabricate'
  },
  want_specific: {
    zh: '给出更具体、可立即执行的下一步，而非原则性建议',
    en: 'give concrete, immediately actionable next steps instead of principles'
  }
}

export const CHAT_FEEDBACK_REASONS: ChatFeedbackReason[] = [
  'too_verbose',
  'not_relevant',
  'inaccurate',
  'want_specific'
]

/**
 * 聚合用户近 N 天（默认 14）的聊天反馈，得到负反馈数与高频负反馈原因。
 * 用于闭环：在生成下一条回答时把改进指令注入 system prompt。
 * 失败时返回空聚合（不抛错，主流程降级）。
 */
export async function getChatFeedbackSummary(
  supabase: SupabaseClient,
  userId: string,
  opts?: { days?: number; limit?: number }
): Promise<ChatFeedbackSummary> {
  const days = opts?.days ?? 14
  const limit = opts?.limit ?? 200
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('chat_feedback')
    .select('rating, reason, reason_text')
    .eq('user_id', userId)
    .gte('created_at', since)
    .limit(limit)

  if (error || !data) return { downCount: 0, upCount: 0, topReasons: [], customCount: 0 }

  let downCount = 0
  let upCount = 0
  let customCount = 0
  const reasonCounts = new Map<ChatFeedbackReason, number>()
  for (const row of data as Array<{ rating: string; reason: string | null; reason_text: string | null }>) {
    if (row.rating === 'down') {
      downCount++
      if (row.reason) {
        const key = row.reason as ChatFeedbackReason
        reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1)
      } else if (row.reason_text && row.reason_text.trim()) {
        customCount++
      }
    } else if (row.rating === 'up') {
      upCount++
    }
  }

  const topReasons = [...reasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, CHAT_FEEDBACK_REASONS.length)
    .map(([reason, count]) => ({ reason, count }))

  return { downCount, upCount, topReasons, customCount }
}

/**
 * 根据反馈聚合生成"改进指令"文本，注入 system prompt 让 AI 自适应。
 * 仅当近 14 天负反馈 ≥ 2 才返回非空（避免噪声）；无显著信号时返回空串。
 */
export function buildFeedbackDirective(
  summary: ChatFeedbackSummary | null,
  locale: 'zh' | 'en'
): string {
  if (!summary || summary.downCount < 2) return ''

  const hints = summary.topReasons.map((r) => REASON_HINTS[r.reason][locale])
  if (locale === 'zh') {
    const reasons = hints.length ? `常见原因：${hints.join('；')}。` : ''
    const custom = summary.customCount > 0 ? `另有 ${summary.customCount} 条"没帮助"附带了自由文本说明。` : ''
    return (
      `用户反馈改进：用户近期对 ${summary.downCount} 条回答点了"没帮助"。${reasons}${custom}` +
      `请在本次回答中针对性改进以上方面，而不是泛泛而谈。`
    )
  }
  const reasons = hints.length ? `Common reasons: ${hints.join('; ')}.` : ''
  const custom = summary.customCount > 0 ? `Additionally, ${summary.customCount} unhelpful marks included free-text notes.` : ''
  return (
    `User feedback to improve: the user marked ${summary.downCount} recent answers as unhelpful. ${reasons}${custom}` +
    `Please improve this answer accordingly—avoid generic responses.`
  )
}
