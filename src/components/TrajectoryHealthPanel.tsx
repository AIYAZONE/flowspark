import {
  getLandingTrajectoryMetrics,
  type LandingTrajectorySignalKey,
} from '@/lib/landing-trajectory'
import { getTrajectoryLuxuryVariant } from '@/lib/landing-trajectory-luxury'

type TrajectoryDict = {
  label: string
  title: string
  subtitle: string
  scoreLabel: string
  judgment: string
  signals: Record<
    LandingTrajectorySignalKey,
    {
      label: string
      state: string
    }
  >
}

export function TrajectoryHealthPanel({ dict }: { dict: TrajectoryDict }) {
  const metrics = getLandingTrajectoryMetrics()

  return (
    <section className="relative py-24 lg:py-28">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl rounded-4xl bg-linear-to-br from-primary/26 via-violet-500/12 to-sky-500/22 p-px shadow-[0_44px_160px_-84px_rgba(16,185,129,0.55)]">
          <div className="relative overflow-hidden rounded-4xl border border-white/8 bg-background/70 px-6 py-7 backdrop-blur-xl lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_68%)]" />
            <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 top-12 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_auto] lg:items-start lg:gap-10">
              <div className="max-w-3xl">
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
                  {dict.label}
                </div>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight lg:text-[2.6rem] lg:leading-[1.08]">
                  {dict.title}
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground lg:text-[15px]">
                  {dict.subtitle}
                </p>
                <p className="mt-8 max-w-2xl text-lg font-medium leading-8 text-foreground/95 lg:text-[1.35rem] lg:leading-9">
                  {dict.judgment}
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-[232px] lg:translate-y-1">
                <div className="absolute inset-3 rounded-4xl bg-primary/12 blur-3xl" />
                <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-background/55 px-8 py-7 text-center shadow-[0_24px_80px_-40px_rgba(16,185,129,0.48),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-24px_48px_rgba(15,23,42,0.24)] backdrop-blur-md">
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-5 top-4 h-20 rounded-full bg-primary/10 blur-2xl" />
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {dict.scoreLabel}
                  </div>
                  <div className="mt-4 text-7xl font-semibold tracking-[-0.04em] text-foreground lg:text-[4.9rem]">
                    {metrics.score}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">/ 100</div>
                </div>
              </div>
            </div>
            <div className="relative mt-9 grid gap-3 md:grid-cols-3">
              {metrics.signals.map((signal) => {
                const variant = getTrajectoryLuxuryVariant(signal.key)
                const copy = dict.signals[signal.key]

                return (
                  <div
                    key={signal.key}
                    className={`relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-background/30 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm ${variant.glowClass}`}
                  >
                    <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${variant.dotClass}`} />
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {copy.label}
                        </div>
                      </div>
                      <div className="text-sm font-medium tracking-tight text-foreground/90">
                        {signal.value}
                        <span className="ml-1 text-xs text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="mt-4 text-base font-medium leading-7 text-foreground/95">
                      {copy.state}
                    </div>
                    <div
                      className={`mt-4 h-px w-full bg-linear-to-r from-transparent ${variant.dividerClass} to-transparent`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
