import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, Zap, Sparkles, Brain, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary, getCurrentLocale } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { AvatarMenu } from "@/components/AvatarMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Analytics } from "@vercel/analytics/react";
import { HeroVisual } from "@/components/HeroVisual";

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
  const isZh = currentLocale.startsWith('zh')
  const heroSignals = isZh
    ? [
        { label: 'Direction', value: '长期方向', detail: '把长期人生方向收敛成今天最值得推进的一步。' },
        { label: 'Execution', value: '今日推进', detail: '让你先推进主线，而不是继续被信息和待办拖散。' },
        { label: 'Intelligence', value: '系统判断', detail: 'AI 在幕后吸收你的节奏、阻力与偏好，持续修正建议。' },
      ]
    : [
        { label: 'Direction', value: 'Long-term direction', detail: 'Compress long-range ambition into the single step that matters today.' },
        { label: 'Execution', value: 'Daily traction', detail: 'Keep you moving your main thread instead of getting scattered by inputs and tasks.' },
        { label: 'Intelligence', value: 'System judgment', detail: 'AI learns your rhythm, friction, and preferences in the background.' },
      ]

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
                <Link href="/dashboard" className="hidden sm:inline-flex">
                  <Button size="sm" className="rounded-full px-5 shadow-sm">
                    {dict.sidebar.dashboard}
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

                <div className="mb-7 grid gap-3 text-left sm:grid-cols-3">
                  {heroSignals.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/50 bg-background/75 p-4 backdrop-blur-sm">
                      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">{item.label}</div>
                      <div className="mt-2 text-sm font-semibold text-foreground">{item.value}</div>
                      <div className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-3">
                  {user ? (
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto rounded-full px-8 lg:px-7 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all h-12 lg:h-11">
                        {dict.sidebar.dashboard} <ArrowRight className="ml-2 h-4 w-4" />
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
                <div className="rounded-3xl sm:rounded-4xl bg-gradient-to-br from-primary/25 via-purple-500/15 to-blue-500/25 p-px shadow-2xl shadow-primary/10">
                  <div className="rounded-3xl sm:rounded-4xl bg-background/70 backdrop-blur-xl p-2 sm:p-3 ring-1 ring-border/30">
                    <HeroVisual dict={dict.landing.visual} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-muted/30 -skew-y-3 transform origin-top-left scale-110" />

          <div className="container relative mx-auto px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
                {dict.landing.capabilities.label}
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {dict.landing.capabilities.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {dict.landing.capabilities.subtitle}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">

              {/* Feature 1 */}
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{dict.landing.features.focus.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {dict.landing.features.focus.desc}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{dict.landing.features.growth.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {dict.landing.features.growth.desc}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{dict.landing.features.insight.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {dict.landing.features.insight.desc}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 text-center">
          <div className="container mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              {dict.landing.hero.ctaTitle}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground">
              {dict.landing.cta.subtitle}
            </p>
            <Link href="/login">
              <Button size="lg" className="rounded-full px-10 text-lg h-14 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300">
                {dict.landing.hero.start}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-muted/20">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>{dict.landing.footer}</p>
        </div>
      </footer>
    </div>
  );
}
