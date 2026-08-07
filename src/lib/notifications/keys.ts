export function buildNotificationDedupeKey(_params: {
  kind: 'shield_granted' | 'milestone_reached' | 'recovery_success' | 'weekly_review_reminder'
  payload: Record<string, unknown>
}): string {
  if (_params.kind === 'shield_granted') {
    const at = _params.payload.grantedAtStreak
    if (typeof at !== 'number' || !Number.isFinite(at)) throw new Error('invalid_dedupe_payload')
    return `shield_granted:${Math.trunc(at)}`
  }

  if (_params.kind === 'milestone_reached') {
    const milestone = _params.payload.milestone
    if (typeof milestone !== 'number' || !Number.isFinite(milestone)) throw new Error('invalid_dedupe_payload')
    return `milestone_reached:${Math.trunc(milestone)}`
  }

  if (_params.kind === 'weekly_review_reminder') {
    const weekKey = _params.payload.weekKey
    if (typeof weekKey !== 'string' || !weekKey) throw new Error('invalid_dedupe_payload')
    return `weekly_review_reminder:${weekKey}`
  }

  const targetDate = _params.payload.targetDate
  if (typeof targetDate !== 'string' || !targetDate) throw new Error('invalid_dedupe_payload')
  return `recovery_success:${targetDate}`
}
