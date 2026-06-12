export type ActionFilters = {
    goalFilter: string
    statusFilter: string
    typeFilter: string
    priorityFilter: string
}

export type ActionFilterState = {
    applied: ActionFilters
    draft: ActionFilters
}

export const DEFAULT_ACTION_FILTERS: ActionFilters = {
    goalFilter: 'all',
    statusFilter: 'incomplete',
    typeFilter: 'all',
    priorityFilter: 'all',
}

function cloneActionFilters(filters?: Partial<ActionFilters>): ActionFilters {
    return {
        ...DEFAULT_ACTION_FILTERS,
        ...filters,
    }
}

export function createActionFilterUiState(initialFilters?: Partial<ActionFilters>): ActionFilterState {
    const applied = cloneActionFilters(initialFilters)
    return {
        applied,
        draft: { ...applied },
    }
}

export function updateAppliedActionFilters(
    state: ActionFilterState,
    patch: Partial<ActionFilters>
): ActionFilterState {
    const applied = {
        ...state.applied,
        ...patch,
    }

    return {
        applied,
        draft: { ...applied },
    }
}

export function updateDraftActionFilters(
    state: ActionFilterState,
    patch: Partial<ActionFilters>
): ActionFilterState {
    return {
        ...state,
        draft: {
            ...state.draft,
            ...patch,
        },
    }
}

export function applyDraftActionFilters(state: ActionFilterState): ActionFilterState {
    const applied = { ...state.draft }
    return {
        applied,
        draft: { ...applied },
    }
}

export function resetDraftActionFilters(state: ActionFilterState): ActionFilterState {
    return {
        ...state,
        draft: cloneActionFilters(),
    }
}

export function syncDraftFromApplied(state: ActionFilterState): ActionFilterState {
    return {
        ...state,
        draft: { ...state.applied },
    }
}

export function countActiveActionFilters(filters: ActionFilters, hideGoalFilter = false): number {
    let count = 0
    if (!hideGoalFilter && filters.goalFilter !== 'all') count += 1
    if (filters.statusFilter !== 'incomplete') count += 1
    if (filters.typeFilter !== 'all') count += 1
    if (filters.priorityFilter !== 'all') count += 1
    return count
}
