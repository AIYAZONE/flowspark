import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary, getCurrentLocale } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { AvatarMenu } from "@/components/AvatarMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Analytics } from "@vercel/analytics/react";
import { HeroVisual } from "@/components/HeroVisual";
import { LandingCapabilities } from "@/components/LandingCapabilities";
import { TrajectoryHealthPanel } from "@/components/TrajectoryHealthPanel";
import { getLandingHeroSignals } from "@/lib/landing-hero-signals";
import { COPYRIGHT_START_YEAR, formatCopyrightYearRange } from "@/lib/copyright";

export default async function Home() {
  const dict = await getDictionary();
  const currentLocale = await getCurrentLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl: string | null = null
  let displayName: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url,name')
      .eq('id', user.id)
      .maybeSingle()
    avatarUrl = profile?.avatar_url || null
    displayName = profile?.name || null
  }

  const avatarLetter = (displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const heroSignals = getLandingHeroSignals(dict.landing.hero)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
      <Analytics />

      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/20 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/65" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <div>
              <LanguageSwitcher
                currentLocale={currentLocale}
                variant="ghost"
                size="sm"
                className="w-auto px-2"
              />
            </div>
            {user ? (
              <>
                <Link href="/chat" className="hidden sm:inline-flex">
                  <Button size="sm" className="rounded-full px-5 shadow-sm">
                    {dict.sidebar.chat}
                  </Button>
                </Link>
                <AvatarMenu
                  avatarUrl={avatarUrl}
                  letter={avatarLetter}
                  email={user.email || ''}
                  accountLabel={dict.sidebar.profile}
                  logoutLabel={dict.sidebar.signOut}
                />
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">
                    {dict.landing.hero.login}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="rounded-full px-5 shadow-sm shadow-primary/20">
                    {dict.landing.hero.start}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top)+4rem)]">
        {/* Hero Section */}
        <section className="relative flex items-center min-h-[calc(100svh-4rem)] py-[clamp(1.25rem,6vh,3rem)] lg:min-h-[clamp(620px,78vh,840px)] lg:py-[clamp(1.5rem,6vh,3.5rem)]">
          {/* Ambient Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[min(620px,46vh)] w-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
          <div className="pointer-events-none absolute inset-x-0 top-[18%] h-64 bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_60%)] blur-3xl" />

          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

              {/* Left Column: Text */}
              <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  {dict.landing.hero.badge}
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight mb-6 leading-[1.1] whitespace-pre-line lg:text-5xl xl:text-6xl lg:leading-tight">
                  {dict.landing.hero.title}
                </h1>

                <p className="mb-6 max-w-xl mx-auto text-lg leading-relaxed text-muted-foreground lg:mx-0 lg:mb-7">
                  {dict.landing.hero.subtitle}
                </p>

                <div className="mb-6 grid gap-2.5 text-left sm:grid-cols-3">
                  {heroSignals.map((item) => (
                    <div
                      key={item.label}
                      className="flex min-h-[116px] flex-col rounded-[1.35rem] border border-white/8 bg-white/2 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-[6px]"
                    >
                      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/75">
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm font-medium text-foreground/85">{item.value}</div>
                      <div className="mt-2 text-[12px] leading-5 text-muted-foreground">{item.detail}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-3">
                  {user ? (
                    <Link href="/chat" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto rounded-full px-8 lg:px-7 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all h-12 lg:h-11">
                        {dict.sidebar.chat} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto rounded-full px-8 lg:px-7 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all h-12 lg:h-11">
                        {dict.landing.hero.start} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}

                  {!user && (
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 lg:px-7 text-base h-12 lg:h-11 border-primary/20 hover:bg-primary/5">
                        {dict.landing.hero.login}
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="mt-10 flex items-center justify-center gap-4 text-sm text-muted-foreground lg:justify-start">
                  <div className="flex -space-x-3">
                    {[
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-emerald-500",
                      "bg-orange-500"
                    ].map((color, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 border-background ${color} flex items-center justify-center`}
                      />
                    ))}
                  </div>
                  <p>{dict.landing.hero.socialProof}</p>
                </div>
              </div>

              {/* Right Column: Visual */}
              <div className="flex-1 w-full max-w-[560px] lg:max-w-none lg:max-h-[calc(100vh-var(--header-h))] lg:self-center">
                <div className="rounded-3xl sm:rounded-4xl bg-linear-to-br from-primary/25 via-violet-500/15 to-sky-500/25 p-px shadow-2xl shadow-primary/10">
                  <div className="rounded-3xl sm:rounded-4xl bg-background/70 backdrop-blur-xl p-2 sm:p-3 ring-1 ring-border/30">
                    <HeroVisual dict={dict.landing.visual} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingCapabilities
          dict={{
            label: dict.landing.capabilities.label,
            title: dict.landing.capabilities.title,
            subtitle: dict.landing.capabilities.subtitle,
            cards: dict.landing.features,
          }}
        />

        <TrajectoryHealthPanel dict={dict.landing.trajectory} />

        {/* Bottom CTA */}
        <section className="relative py-24 lg:py-28">
          <div className="pointer-events-none absolute inset-x-0 top-8 h-56 bg-[radial-gradient(circle,rgba(16,185,129,0.10),transparent_62%)] blur-3xl" />
          <div className="container relative mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-5xl rounded-4xl bg-linear-to-br from-primary/22 via-violet-500/10 to-sky-500/18 p-px shadow-[0_40px_140px_-72px_rgba(16,185,129,0.36)]">
              <div className="rounded-4xl border border-white/8 bg-background/72 px-6 py-10 text-center backdrop-blur-xl sm:px-10 lg:px-14 lg:py-14">
                <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-primary/80">
                  {dict.landing.hero.badge}
                </div>
                <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.8rem] lg:leading-[1.08]">
                  {dict.landing.hero.ctaTitle}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground lg:text-[15px]">
                  {dict.landing.cta.subtitle}
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href={user ? "/chat" : "/login"}>
                    <Button
                      size="lg"
                      className="h-14 rounded-full px-10 text-lg shadow-xl shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/40"
                    >
                      {user ? dict.sidebar.chat : dict.landing.hero.start}
                    </Button>
                  </Link>
                  {!user && (
                    <Link href="/login">
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-14 rounded-full border-primary/18 bg-background/20 px-10 text-base backdrop-blur-sm hover:bg-primary/6"
                      >
                        {dict.landing.hero.login}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-background/65 py-10 backdrop-blur-xl">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-center lg:flex-row lg:px-8 lg:text-left">
          <BrandLogo className="text-base" />
          <p className="text-sm text-muted-foreground/90">
            {dict.landing.footer.replace(
              "{years}",
              formatCopyrightYearRange(COPYRIGHT_START_YEAR)
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
