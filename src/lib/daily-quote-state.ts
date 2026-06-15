export type DailyQuoteUiState = {
  selectedIndex: number
  refreshUsed: number
  history: number[]
}

function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.trunc(parsed)
  }
  return null
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  const mod = index % length
  return mod < 0 ? mod + length : mod
}

function uniqInOrder(values: number[]): number[] {
  const seen = new Set<number>()
  const result: number[] = []
  for (const v of values) {
    if (seen.has(v)) continue
    seen.add(v)
    result.push(v)
  }
  return result
}

export function ensureState(
  raw: unknown,
  dailyQuotesLength: number,
  defaultIndex: number,
): DailyQuoteUiState {
  const obj = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>
  const selectedIndexRaw = toInt(obj.selectedIndex)
  const refreshUsedRaw = toInt(obj.refreshUsed)
  const historyRaw = Array.isArray(obj.history) ? obj.history : []

  const safeDefault = clampIndex(defaultIndex, dailyQuotesLength)
  const safeSelected = clampIndex(selectedIndexRaw ?? safeDefault, dailyQuotesLength)
  const safeRefreshUsed = Math.max(0, refreshUsedRaw ?? 0)

  const normalizedHistory = uniqInOrder(
    historyRaw
      .map((value) => toInt(value))
      .filter((value): value is number => value !== null)
      .map((value) => clampIndex(value, dailyQuotesLength)),
  )

  const history = uniqInOrder([safeSelected, ...normalizedHistory])

  return {
    selectedIndex: safeSelected,
    refreshUsed: safeRefreshUsed,
    history,
  }
}

export function applyRefresh(
  state: DailyQuoteUiState,
  dailyQuotesLength: number,
  refreshLimit: number,
): DailyQuoteUiState {
  if (dailyQuotesLength <= 0) return state
  if (state.refreshUsed >= refreshLimit) return state

  const nextIndex = clampIndex(state.selectedIndex + 1, dailyQuotesLength)
  const history = uniqInOrder([...state.history, nextIndex]).slice(0, Math.max(1, refreshLimit))

  return {
    selectedIndex: nextIndex,
    refreshUsed: state.refreshUsed + 1,
    history,
  }
}

export function shouldPersistQuoteState(hasHydratedFromStorage: boolean, dailyQuotesLength: number): boolean {
  return hasHydratedFromStorage && dailyQuotesLength > 0
}
