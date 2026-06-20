export type TomorrowHandoffCandidate = {
  recommendationId: string
  actionId: string
  title: string
  goalId: string | null
  completedAt: string
}

export type TomorrowHandoffCandidateInput = TomorrowHandoffCandidate & {
  outcomeId?: string | null
}

export type TomorrowHandoffLocalState = {
  dismissed: boolean
  clicked: boolean
}

export type TomorrowHandoffTargetAction = {
  id: string
  goal_id: string | null
  priority?: string | null
  start_date?: string | null
  end_date?: string | null
  completed: boolean
  type?: string | null
}

const STORAGE_STATE_VERSION = 1

function parseStoredState(raw: string | null): TomorrowHandoffLocalState {
  if (!raw) return { dismissed: false, clicked: false }

  try {
    const parsed = JSON.parse(raw) as {
      dismissed?: unknown
      clicked?: unknown
      version?: unknown
    }
    if (parsed.version !== STORAGE_STATE_VERSION) {
      return { dismissed: false, clicked: false }
    }
    return {
      dismissed: parsed.dismissed === true,
      clicked: parsed.clicked === true,
    }
  } catch {
    return { dismissed: false, clicked: false }
  }
}

function writeStoredState(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  key: string,
  nextState: TomorrowHandoffLocalState
) {
  if (!storage) return
  storage.setItem(key, JSON.stringify({ version: STORAGE_STATE_VERSION, ...nextState }))
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function toComparableTime(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function comparePriority(a?: string | null, b?: string | null) {
  const order: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  }

  return (order[b || ''] ?? 0) - (order[a || ''] ?? 0)
}

function getComparableActionDate(action: TomorrowHandoffTargetAction) {
  return action.end_date || action.start_date || '9999-12-31'
}

export function buildTomorrowHandoffStorageKey(params: {
  userId: string
  dateBucket: string
  recommendationId: string
}) {
  return `tomorrow-handoff:${params.userId}:${params.dateBucket}:${params.recommendationId}`
}

export function buildTomorrowHandoffExposureDedupeKey(params: {
  userId: string
  dateBucket: string
  recommendationId: string
  targetActionId?: string | null
}) {
  return `tomorrow-handoff:exposed:${params.userId}:${params.dateBucket}:${params.recommendationId}:${params.targetActionId ?? 'today_plan'}`
}

export function readTomorrowHandoffState(
  key: string,
  storage: Pick<Storage, 'getItem'> | null | undefined = getStorage()
) {
  if (!storage) return { dismissed: false, clicked: false }
  return parseStoredState(storage.getItem(key))
}

export function writeTomorrowHandoffDismissed(
  key: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined = getStorage()
) {
  const previous = readTomorrowHandoffState(key, storage)
  writeStoredState(storage, key, { ...previous, dismissed: true })
}

export function writeTomorrowHandoffClicked(
  key: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined = getStorage()
) {
  const previous = readTomorrowHandoffState(key, storage)
  writeStoredState(storage, key, { ...previous, clicked: true })
}

export function pickYesterdayHandoffCandidate(
  candidates: TomorrowHandoffCandidateInput[]
): TomorrowHandoffCandidate | null {
  if (candidates.length === 0) return null

  const [winner] = [...candidates].sort((a, b) => {
    const timeDiff = toComparableTime(b.completedAt) - toComparableTime(a.completedAt)
    if (timeDiff !== 0) return timeDiff

    const aTieBreaker = a.outcomeId || a.recommendationId || a.actionId
    const bTieBreaker = b.outcomeId || b.recommendationId || b.actionId
    return bTieBreaker.localeCompare(aTieBreaker)
  })

  return {
    recommendationId: winner.recommendationId,
    actionId: winner.actionId,
    title: winner.title,
    goalId: winner.goalId,
    completedAt: winner.completedAt,
  }
}

export function pickTargetActionId(params: {
  actions: TomorrowHandoffTargetAction[]
  goalId: string | null
}) {
  if (!params.goalId) return null

  const candidates = params.actions
    .filter((action) => (
      action.goal_id === params.goalId &&
      action.completed !== true &&
      action.type === 'core'
    ))
    .sort((a, b) => {
      const priorityDiff = comparePriority(a.priority, b.priority)
      if (priorityDiff !== 0) return priorityDiff

      const dateA = getComparableActionDate(a)
      const dateB = getComparableActionDate(b)
      if (dateA !== dateB) return dateA.localeCompare(dateB)

      return a.id.localeCompare(b.id)
    })

  return candidates[0]?.id ?? null
}
