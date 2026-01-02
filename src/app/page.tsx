import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Aperture, ArrowRight, TrendingUp, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary, getCurrentLocale } from "@/i18n/get-dictionary";
import { createClient } from "@/lib/supabase/server";
import { AvatarMenu } from "@/components/AvatarMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Analytics } from "@vercel/analytics/react"

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
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      <Analytics />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
              <Aperture className="h-5 w-5 text-primary" strokeWidth={2} />
            </div>
            <span>Goal System</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher 
                currentLocale={currentLocale} 
                variant="ghost" 
                size="sm" 
                className="w-auto px-2"
              />
            </div>
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" className="rounded-full px-5">
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
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">
                    {dict.landing.hero.login}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="rounded-full px-5">
                    {dict.landing.hero.start}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative isolate pt-24 pb-32 sm:pt-32 lg:pb-40 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#059669] to-[#8B5CF6] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
          </div>

          <div className="container mx-auto px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 flex justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-primary/50 transition-all bg-background/50 backdrop-blur">
                  {dict.landing.hero.badge}
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {dict.landing.hero.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {dict.landing.hero.subtitle}
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                        {dict.sidebar.dashboard} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/goals">
                      <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                        {dict.sidebar.goals}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                        {dict.landing.hero.start} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="rounded-full px-8 text-base">
                        {dict.landing.hero.login}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Gradient */}
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#3B82F6] to-[#059669] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 sm:py-32 relative z-10">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {/* Feature 1: Focus */}
              <div className="flex flex-col items-start group">
                <div className="rounded-lg bg-primary/5 p-3 ring-1 ring-primary/10 transition-all group-hover:bg-primary/10 group-hover:ring-primary/30 mb-5">
                  <Target className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold leading-8 tracking-tight text-foreground">
                  {dict.landing.features.focus.title}
                </h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  {dict.landing.features.focus.desc}
                </p>
              </div>

              {/* Feature 2: Growth */}
              <div className="flex flex-col items-start group">
                <div className="rounded-lg bg-blue-500/5 p-3 ring-1 ring-blue-500/10 transition-all group-hover:bg-blue-500/10 group-hover:ring-blue-500/30 mb-5">
                  <TrendingUp className="h-6 w-6 text-blue-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold leading-8 tracking-tight text-foreground">
                  {dict.landing.features.growth.title}
                </h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  {dict.landing.features.growth.desc}
                </p>
              </div>

              {/* Feature 3: Insight */}
              <div className="flex flex-col items-start group">
                <div className="rounded-lg bg-purple-500/5 p-3 ring-1 ring-purple-500/10 transition-all group-hover:bg-purple-500/10 group-hover:ring-purple-500/30 mb-5">
                  <Zap className="h-6 w-6 text-purple-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold leading-8 tracking-tight text-foreground">
                  {dict.landing.features.insight.title}
                </h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  {dict.landing.features.insight.desc}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>{dict.landing.footer}</p>
        </div>
      </footer>
    </div>
  );
}
