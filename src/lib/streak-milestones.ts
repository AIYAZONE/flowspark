export type StreakPhaseKey =
  | 'starter'
  | 'steady'
  | 'deepening'
  | 'resilient'
  | 'longrun'
  | 'identity'

const BASE_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365] as const
const CELEBRATION_MILESTONES = new Set([30, 60, 90, 180, 365])
const PHASE_TARGETS: Array<{ phaseKey: StreakPhaseKey; atStreak: number }> = [
  { phaseKey: 'starter', atStreak: 0 },
  { phaseKey: 'steady', atStreak: 7 },
  { phaseKey: 'deepening', atStreak: 30 },
  { phaseKey: 'resilient', atStreak: 90 },
  { phaseKey: 'longrun', atStreak: 180 },
  { phaseKey: 'identity', atStreak: 365 },
]

export function getExpandedMilestones(targetStreak: number): number[] {
  const milestones: number[] = [...BASE_MILESTONES]

  let next = milestones[milestones.length - 1]
  while (next <= targetStreak) {
    next += 365
    milestones.push(next)
  }

  if (milestones[milestones.length - 1] < targetStreak + 365) {
    milestones.push(milestones[milestones.length - 1] + 365)
  }

  return milestones
}

export function getStageMilestoneWindow(streak: number, windowSize = 5): number[] {
  const milestones = getExpandedMilestones(streak)
  const nextIndex = milestones.findIndex((milestone) => streak < milestone)
  const safeNextIndex = nextIndex === -1 ? milestones.length - 1 : nextIndex

  let start = Math.max(0, safeNextIndex - 2)
  let end = Math.min(milestones.length, start + windowSize)

  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize)
  }

  return milestones.slice(start, end)
}

export function getPhaseKeyForStreak(streak: number): StreakPhaseKey {
  if (streak >= 365) return 'identity'
  if (streak >= 180) return 'longrun'
  if (streak >= 90) return 'resilient'
  if (streak >= 30) return 'deepening'
  if (streak >= 7) return 'steady'
  return 'starter'
}

export function getCelebrationMilestone(streak: number): number | null {
  const safeStreak = Math.max(0, Math.trunc(streak))
  return CELEBRATION_MILESTONES.has(safeStreak) ? safeStreak : null
}

export function getNextPhaseTarget(streak: number): { phaseKey: StreakPhaseKey; atStreak: number } | null {
  const safeStreak = Math.max(0, Math.trunc(streak))
  const currentPhaseKey = getPhaseKeyForStreak(safeStreak)
  const currentIndex = PHASE_TARGETS.findIndex((t) => t.phaseKey === currentPhaseKey)
  if (currentIndex === -1) return null
  const next = PHASE_TARGETS[currentIndex + 1]
  return next ?? null
}

export function getPhaseRanges(): Array<{ phaseKey: StreakPhaseKey; minDay: number; maxDay: number | null }> {
  return [
    { phaseKey: 'starter', minDay: 0, maxDay: 6 },
    { phaseKey: 'steady', minDay: 7, maxDay: 29 },
    { phaseKey: 'deepening', minDay: 30, maxDay: 89 },
    { phaseKey: 'resilient', minDay: 90, maxDay: 179 },
    { phaseKey: 'longrun', minDay: 180, maxDay: 364 },
    { phaseKey: 'identity', minDay: 365, maxDay: null },
  ]
}

export function getStreakMilestoneSummary(streak: number) {
  const safeStreak = Math.max(0, Math.trunc(streak))
  const milestones = getExpandedMilestones(safeStreak)
  const nextMilestone = milestones.find((milestone) => safeStreak < milestone) ?? milestones[milestones.length - 1]
  const previousMilestone = [...milestones].reverse().find((milestone) => milestone <= safeStreak) ?? 0
  const span = Math.max(1, nextMilestone - previousMilestone)
  const progressPercent = Math.max(0, Math.min(100, Math.round(((safeStreak - previousMilestone) / span) * 100)))

  return {
    currentMilestone: previousMilestone,
    nextMilestone,
    daysRemaining: Math.max(0, nextMilestone - safeStreak),
    progressPercent,
    currentPhaseKey: getPhaseKeyForStreak(safeStreak),
    milestones: getStageMilestoneWindow(safeStreak),
  }
}
