import type { ChatHistoryEntry } from './types'

/**
 * 客户端侧对"超出历史窗口"的旧轮次做确定性压缩，作为长期背景回传给服务端。
 *
 * 设计对齐 `system-memory/summarized.ts` 的思路（对溢出内容做轻量摘要而非丢弃），
 * 但作用在 chat 的 `ChatHistoryEntry` 上，且不调用 LLM：仅截取要点并截断，
 * 保证请求体积有界、行为可预测。
 */

const SUMMARY_OVERFLOW_CAP = 10 // 最多摘要约 10 轮溢出内容
const PER_TURN_CHAR_CAP = 120 // 每条轮次最多保留 120 字

export function buildChatSummary(overflow: ChatHistoryEntry[]): string | null {
  if (!overflow.length) return null
  const capped = overflow.slice(-SUMMARY_OVERFLOW_CAP)
  const lines = capped.map((e) => {
    const who = e.role === 'user' ? '用户' : '助手'
    const text = e.text.length > PER_TURN_CHAR_CAP ? `${e.text.slice(0, PER_TURN_CHAR_CAP)}…` : e.text
    return `${who}：${text}`
  })
  return lines.join('\n')
}
