export type LandingHeroSignal = {
  label: string
  value: string
  detail: string
}

type LandingHeroSignalCandidate = Partial<LandingHeroSignal>

type LandingHeroWithSignals = {
  signals?: LandingHeroSignalCandidate[]
}

export function getLandingHeroSignals(hero: LandingHeroWithSignals): LandingHeroSignal[] {
  if (!Array.isArray(hero.signals)) {
    return []
  }

  return hero.signals.filter(
    (item): item is LandingHeroSignal =>
      typeof item.label === 'string' &&
      typeof item.value === 'string' &&
      typeof item.detail === 'string'
  )
}
