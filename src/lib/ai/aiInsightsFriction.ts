type FeedbackLike = {
  feedback_label: string | null
}

export type AIFrictionCount = {
  key: string
  count: number
}

export function normalizeFeedbackLabel(label: string | null | undefined) {
  const value = (label || '').trim()
  if (!value) return null
  if (value === 'dismiss' || value === 'close_result') return null
  if (value === 'useful') return null
  if (value.startsWith('not_fit')) return 'not_fit'
  return value
}

export function computeTopFrictionFromFeedback(params: {
  recent: FeedbackLike[]
  topN?: number
}) {
  const topN = typeof params.topN === 'number' && params.topN > 0 ? params.topN : 3
  const counts = new Map<string, number>()
  for (const item of params.recent) {
    const key = normalizeFeedbackLabel(item.feedback_label)
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const entries: AIFrictionCount[] = [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total: entries.reduce((sum, item) => sum + item.count, 0),
    top: entries.slice(0, topN),
  }
}

