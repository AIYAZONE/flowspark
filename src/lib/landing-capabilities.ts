export type LandingCapabilityKey = 'focus' | 'growth' | 'insight'

export type LandingCapabilityMeta = {
  key: LandingCapabilityKey
  eyebrow: string
  accentClass: string
  surfaceClass: string
}

const CAPABILITIES: LandingCapabilityMeta[] = [
  {
    key: 'focus',
    eyebrow: 'Direction',
    accentClass: 'text-primary/80',
    surfaceClass: 'bg-primary/[0.035]',
  },
  {
    key: 'growth',
    eyebrow: 'Execution',
    accentClass: 'text-violet-300/80',
    surfaceClass: 'bg-violet-400/[0.035]',
  },
  {
    key: 'insight',
    eyebrow: 'Intelligence',
    accentClass: 'text-sky-300/80',
    surfaceClass: 'bg-sky-400/[0.035]',
  },
]

export function getLandingCapabilities(): LandingCapabilityMeta[] {
  return CAPABILITIES
}
