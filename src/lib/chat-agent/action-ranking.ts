type ActionLike = {
  id: string
  title: string
  goalId: string | null
  priority: string | null
  type: string | null
  start_date: string | null
  end_date: string | null
}

const priorityOrder: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

function getBaseDate(action: Pick<ActionLike, 'start_date' | 'end_date'>): string {
  return (action.end_date ?? action.start_date) || action.start_date || ''
}

function compareActionsForToday<T extends ActionLike>(a: T, b: T, today: string, primaryGoalId: string | null) {
  const overdueA = getBaseDate(a) !== '' && getBaseDate(a) < today
  const overdueB = getBaseDate(b) !== '' && getBaseDate(b) < today
  if (overdueA !== overdueB) return overdueA ? -1 : 1

  const priorityA = priorityOrder[a.priority || 'medium'] ?? 2
  const priorityB = priorityOrder[b.priority || 'medium'] ?? 2
  if (priorityA !== priorityB) return priorityB - priorityA

  const coreA = a.type === 'core' ? 1 : 0
  const coreB = b.type === 'core' ? 1 : 0
  if (coreA !== coreB) return coreB - coreA

  const primaryA = primaryGoalId && a.goalId === primaryGoalId ? 1 : 0
  const primaryB = primaryGoalId && b.goalId === primaryGoalId ? 1 : 0
  if (primaryA !== primaryB) return primaryB - primaryA

  const dateA = getBaseDate(a) || '9999-12-31'
  const dateB = getBaseDate(b) || '9999-12-31'
  if (dateA !== dateB) return dateA < dateB ? -1 : 1

  const titleCmp = a.title.localeCompare(b.title)
  if (titleCmp !== 0) return titleCmp

  return a.id.localeCompare(b.id)
}

export function sortActionsForToday<T extends ActionLike>(params: {
  actions: T[]
  today: string
  primaryGoalId: string | null
}) {
  return params.actions
    .slice()
    .sort((a, b) => compareActionsForToday(a, b, params.today, params.primaryGoalId))
}

