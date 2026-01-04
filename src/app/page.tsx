import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, TrendingUp, Zap, Target, Sparkles, Brain, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary, getCurrentLocale } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { AvatarMenu } from "@/components/AvatarMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Analytics } from "@vercel/analytics/react"
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
      <Analytics />

      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
        <section className="relative flex items-center min-h-[calc(100svh-4rem)] py-[clamp(1.25rem,6vh,3rem)] lg:min-h-[clamp(560px,70vh,760px)] lg:py-[clamp(0.75rem,4vh,2rem)]">
          {/* Ambient Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[min(560px,40vh)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              {/* Left Column: Text */}
              <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  {dict.landing.hero.badge}
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight mb-6 leading-[1.1] whitespace-pre-line lg:text-5xl xl:text-6xl lg:leading-tight">
                  {dict.landing.hero.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6 lg:mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {dict.landing.hero.subtitle}
                </p>

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

                {/* Social Proof (Mock) */}
                <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
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
              <div className="flex-1 w-full max-w-[500px] lg:max-w-none lg:max-h-[calc(100vh-var(--header-h))] lg:self-center">
                <HeroVisual dict={dict.landing.visual} />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-muted/30 -skew-y-3 transform origin-top-left scale-110" />

          <div className="container relative mx-auto px-6 lg:px-8">
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
