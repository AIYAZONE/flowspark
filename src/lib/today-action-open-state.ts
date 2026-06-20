export type ActionPanelMode = 'view' | 'edit' | 'rescue'
export type TodayListView = 'focus' | 'all'

export type InitialRevealState = {
  showAllMust: boolean
  showAllOverdue: boolean
  openGoalIds: Record<string, boolean>
  expandedGoalIds: Record<string, boolean>
  completedOpen: boolean
  scrollTargetId: string | null
}

export function resolveInitialOpenAction(params: {
  actionIdParam?: string | null
  rescueParam?: string | null
}) {
  const actionId = params.actionIdParam?.trim()
  if (actionId) return actionId

  const rescueId = params.rescueParam?.trim()
  return rescueId || null
}

export function resolveInitialPanelMode(params: {
  actionIdParam?: string | null
  rescueParam?: string | null
}): ActionPanelMode {
  const actionId = params.actionIdParam?.trim()
  if (actionId) return 'view'

  const rescueId = params.rescueParam?.trim()
  return rescueId ? 'rescue' : 'view'
}

export function resolveInitialView(params: {
  initialOpenActionId?: string | null
  shouldFocusByDefault: boolean
}): TodayListView {
  return params.initialOpenActionId ? 'focus' : (params.shouldFocusByDefault ? 'focus' : 'all')
}

export function resolveInitialRevealState(params: {
  initialOpenActionId?: string | null
  mustIds: string[]
  overdueIds: string[]
  completedIds: string[]
  groupEntries: Array<{ goalId: string; actionIds: string[] }>
  maxMust: number
  maxOverdue: number
  maxPerGroup: number
}): InitialRevealState {
  const targetId = params.initialOpenActionId || null
  if (!targetId) {
    return {
      showAllMust: false,
      showAllOverdue: false,
      openGoalIds: {},
      expandedGoalIds: {},
      completedOpen: false,
      scrollTargetId: null,
    }
  }

  const mustIndex = params.mustIds.indexOf(targetId)
  const overdueIndex = params.overdueIds.indexOf(targetId)
  const completedOpen = params.completedIds.includes(targetId)
  const matchingGroup = params.groupEntries.find((entry) => entry.actionIds.includes(targetId))
  const groupIndex = matchingGroup ? matchingGroup.actionIds.indexOf(targetId) : -1

  return {
    showAllMust: mustIndex >= params.maxMust,
    showAllOverdue: overdueIndex >= params.maxOverdue,
    openGoalIds: matchingGroup ? { [matchingGroup.goalId]: true } : {},
    expandedGoalIds: matchingGroup && groupIndex >= params.maxPerGroup
      ? { [matchingGroup.goalId]: true }
      : {},
    completedOpen,
    scrollTargetId: targetId,
  }
}
