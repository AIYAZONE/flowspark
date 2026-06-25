import type { LandingTrajectorySignalKey } from './landing-trajectory.ts'

export type TrajectoryLuxuryVariant = {
  dotClass: string
  glowClass: string
  dividerClass: string
}

const VARIANTS: Record<LandingTrajectorySignalKey, TrajectoryLuxuryVariant> = {
  direction: {
    dotClass: 'bg-emerald-300/85',
    glowClass: 'shadow-[0_0_32px_rgba(110,231,183,0.18)]',
    dividerClass: 'via-emerald-200/18',
  },
  rhythm: {
    dotClass: 'bg-amber-200/85',
    glowClass: 'shadow-[0_0_32px_rgba(253,230,138,0.14)]',
    dividerClass: 'via-amber-100/18',
  },
  stability: {
    dotClass: 'bg-sky-300/85',
    glowClass: 'shadow-[0_0_32px_rgba(125,211,252,0.16)]',
    dividerClass: 'via-sky-200/18',
  },
}

export function getTrajectoryLuxuryVariant(
  key: LandingTrajectorySignalKey
): TrajectoryLuxuryVariant {
  return VARIANTS[key]
}
