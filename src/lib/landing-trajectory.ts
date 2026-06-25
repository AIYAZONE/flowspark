export type LandingTrajectorySignalKey = 'direction' | 'rhythm' | 'stability'
export type LandingTrajectoryTone = 'emerald' | 'amber' | 'blue'

export type LandingTrajectoryMetric = {
  key: LandingTrajectorySignalKey
  value: number
  trend: number[]
}

export type LandingTrajectoryMetrics = {
  score: number
  signals: LandingTrajectoryMetric[]
}

const LANDING_TRAJECTORY_METRICS: LandingTrajectoryMetrics = {
  score: 86,
  signals: [
    { key: 'direction', value: 91, trend: [72, 79, 85, 91] },
    { key: 'rhythm', value: 74, trend: [84, 81, 77, 74] },
    { key: 'stability', value: 88, trend: [70, 78, 84, 88] },
  ],
}

export function getLandingTrajectoryMetrics(): LandingTrajectoryMetrics {
  return LANDING_TRAJECTORY_METRICS
}

export function getLandingTrajectoryTone(key: LandingTrajectorySignalKey): LandingTrajectoryTone {
  if (key === 'direction') return 'emerald'
  if (key === 'rhythm') return 'amber'
  return 'blue'
}
