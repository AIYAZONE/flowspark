import type { CoachActionBrief } from '@/lib/ai/types'
import type { ReviewItem } from '@/lib/ai/phase2aSchemas'

type Locale = 'en' | 'zh'

export interface ReviewCandidates {
  goals: { id: string; title: string; status: string | null }[]
  actions: CoachActionBrief[]
}

// 从真实候选数据派生可操作周回顾项（无 AI 时也能产出 actionable 结果）
export function deriveFallbackReviewItems(
  candidates: ReviewCandidates | undefined,
  locale: Locale
): ReviewItem[] {
  if (!candidates) return []
  const now = Date.now()
  const isOverdue = (end?: string | null) => !!end && new Date(end).getTime() < now
  const items: ReviewItem[] = []
  for (const a of candidates.actions.slice(0, 10)) {
    if (items.length >= 6) break
    if (a.completed) continue
    if (a.priority === 'low') {
      items.push({
        goal_id: a.goalId ?? null,
        action_id: a.id,
        title: a.title,
        action_kind: 'archive',
        reason: locale === 'zh' ? '低优先级且长期未动，建议归档' : 'Low priority, untouched — consider archiving'
      })
    } else if (isOverdue(a.endDate)) {
      items.push({
        goal_id: a.goalId ?? null,
        action_id: a.id,
        title: a.title,
        action_kind: 'focus',
        reason: locale === 'zh' ? '已逾期，建议聚焦或重排' : 'Overdue — focus or reschedule'
      })
    }
  }
  if (items.length < 3) {
    for (const g of candidates.goals.slice(0, 10)) {
      if (items.length >= 6) break
      if (g.status === 'stuck') {
        items.push({
          goal_id: g.id,
          action_id: null,
          title: g.title,
          action_kind: 'focus',
          reason: locale === 'zh' ? '目标停滞，建议重新审视' : 'Goal stalled — revisit it'
        })
      }
    }
  }
  return items
}
