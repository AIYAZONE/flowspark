type ActionBase = {
  id: string
  title: string
  completed: boolean
  type: string
  priority?: string | null
  start_date: string
  end_date?: string | null
  goal_id: string
  created_at?: string | null
}

const priorityOrder: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

function getBaseDate(action: ActionBase): string {
  return (action.end_date ?? action.start_date) || action.start_date
}

function compareActions(a: ActionBase, b: ActionBase, today: string, primaryGoalId: string | null) {
  const overdueA = getBaseDate(a) < today
  const overdueB = getBaseDate(b) < today
  if (overdueA !== overdueB) return overdueA ? -1 : 1

  const priorityA = priorityOrder[a.priority || 'medium'] ?? 2
  const priorityB = priorityOrder[b.priority || 'medium'] ?? 2
  if (priorityA !== priorityB) return priorityB - priorityA

  const coreA = a.type === 'core' ? 1 : 0
  const coreB = b.type === 'core' ? 1 : 0
  if (coreA !== coreB) return coreB - coreA

  const primaryA = primaryGoalId && a.goal_id === primaryGoalId ? 1 : 0
  const primaryB = primaryGoalId && b.goal_id === primaryGoalId ? 1 : 0
  if (primaryA !== primaryB) return primaryB - primaryA

  const baseDateA = getBaseDate(a)
  const baseDateB = getBaseDate(b)
  if (baseDateA !== baseDateB) return baseDateA < baseDateB ? -1 : 1

  return a.id.localeCompare(b.id)
}

export function buildTodayTaskListModel<T extends ActionBase>(params: {
  today: string
  primaryGoalId: string | null
  actions: T[]
}) {
  const incomplete = params.actions
    .filter((action) => !action.completed)
    .sort((a, b) => compareActions(a, b, params.today, params.primaryGoalId))

  const completed = params.actions
    .filter((action) => action.completed)
    .sort((a, b) => compareActions(a, b, params.today, params.primaryGoalId))

  return {
    incomplete,
    completed,
    incompleteCount: incomplete.length,
    completedCount: completed.length,
  }
}

export function mergeTargetedActionIntoTodayList<T extends { id: string; start_date?: string | null }>(params: {
  actions: T[]
  targetedAction: T | null
  today: string
}) {
  if (!params.targetedAction) return params.actions
  if (params.actions.some((action) => action.id === params.targetedAction?.id)) return params.actions
  const startDate = params.targetedAction.start_date || ''
  if (startDate && startDate > params.today) return params.actions
  return [...params.actions, params.targetedAction]
}
