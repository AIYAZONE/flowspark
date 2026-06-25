import {
  Brain,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import {
  getLandingCapabilities,
  type LandingCapabilityKey,
} from '@/lib/landing-capabilities'

type LandingCapabilitiesDict = {
  label: string
  title: string
  subtitle: string
  cards: Record<
    LandingCapabilityKey,
    {
      title: string
      desc: string
    }
  >
}

const iconMap: Record<LandingCapabilityKey, LucideIcon> = {
  focus: Brain,
  growth: Trophy,
  insight: Sparkles,
}

export function LandingCapabilities({
  dict,
}: {
  dict: LandingCapabilitiesDict
}) {
  const cards = getLandingCapabilities()

  return (
    <section className="relative py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_72%)]" />
      <div className="container relative mx-auto px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
              {dict.label}
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {dict.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {dict.subtitle}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:mt-9 lg:gap-5">
            {cards.map((card) => {
              const content = dict.cards[card.key]
              const Icon = iconMap[card.key]

              return (
                <article
                  key={card.key}
                  className={`relative overflow-hidden rounded-[1.85rem] border border-white/8 ${card.surfaceClass} px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md`}
                >
                  <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-white/18 to-transparent" />
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className={`text-[11px] font-medium uppercase tracking-[0.22em] ${card.accentClass}`}
                    >
                      {card.eyebrow}
                    </div>
                    <div className="rounded-full border border-white/10 bg-background/45 p-2 text-foreground/55">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold leading-8 tracking-tight text-foreground">
                    {content.title}
                  </h3>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
                    {content.desc}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
