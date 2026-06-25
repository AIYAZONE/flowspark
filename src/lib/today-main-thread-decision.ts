type TodayMainThreadDecisionAction = {
  id: string
  title: string
  goal_id: string | null
  completed: boolean
  priority?: string | null
  type?: string | null
  start_date?: string | null
  end_date?: string | null
}

function comparePriority(a?: string | null, b?: string | null) {
  const order: Record<string, number> = { high: 3, medium: 2, low: 1 }
  return (order[b || ''] ?? 0) - (order[a || ''] ?? 0)
}

function getComparableActionDate(action: TodayMainThreadDecisionAction) {
  return action.end_date || action.start_date || '9999-12-31'
}

function pickPrimaryPathAction(actions: TodayMainThreadDecisionAction[], primaryPathGoalId: string | null) {
  if (!primaryPathGoalId) return null

  const candidates = actions
    .filter((action) => action.goal_id === primaryPathGoalId && action.completed !== true)
    .sort((a, b) => {
      const priorityDiff = comparePriority(a.priority, b.priority)
      if (priorityDiff !== 0) return priorityDiff

      const typeA = a.type === 'core' ? 1 : 0
      const typeB = b.type === 'core' ? 1 : 0
      if (typeA !== typeB) return typeB - typeA

      const dateA = getComparableActionDate(a)
      const dateB = getComparableActionDate(b)
      if (dateA !== dateB) return dateA.localeCompare(dateB)

      return a.id.localeCompare(b.id)
    })

  return candidates[0] ?? null
}

export function resolveTodayMainThreadDecision(input: {
  today: string
  showStreakRiskBanner: boolean
  tomorrowHandoffCandidate: {
    actionId: string
    title: string
    goalId: string | null
  } | null
  actions: TodayMainThreadDecisionAction[]
  primaryPathGoalId: string | null
}): {
  mainThreadActionId: string | null
  mainThreadActionTitle: string | null
  source: 'continuity' | 'handoff' | 'primary_path_action' | 'closed'
} {
  const primaryPathAction = pickPrimaryPathAction(input.actions, input.primaryPathGoalId)

  if (input.showStreakRiskBanner) {
    return {
      mainThreadActionId: primaryPathAction?.id ?? null,
      mainThreadActionTitle: primaryPathAction?.title ?? null,
      source: primaryPathAction ? 'continuity' : 'closed',
    }
  }

  if (
    input.tomorrowHandoffCandidate &&
    input.primaryPathGoalId &&
    input.tomorrowHandoffCandidate.goalId === input.primaryPathGoalId &&
    primaryPathAction
  ) {
    return {
      mainThreadActionId: primaryPathAction.id,
      mainThreadActionTitle: primaryPathAction.title,
      source: 'handoff',
    }
  }

  if (primaryPathAction) {
    return {
      mainThreadActionId: primaryPathAction.id,
      mainThreadActionTitle: primaryPathAction.title,
      source: 'primary_path_action',
    }
  }

  return {
    mainThreadActionId: null,
    mainThreadActionTitle: null,
    source: 'closed',
  }
}

