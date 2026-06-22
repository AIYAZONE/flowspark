import { createClient } from '@/lib/supabase/server'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { updateProfile } from './actions'
import { ProfileCard } from '@/components/ProfileCard'
import { LanguageToggle } from '@/components/LanguageToggle'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserTimezone, getTodayInTZ } from '@/lib/time'
import { getStreakSnapshot } from '@/lib/streaks'
import { UserCalendarFeedCard } from '@/components/UserCalendarFeedCard'
import { getUnreadNotificationCount } from '@/lib/notifications/queries'
import { getRecentRecommendations } from '@/lib/ai/analyticsStore'
import { buildSelfModelCards, summarizeRecommendationSignals } from '@/lib/self-model'

export default async function ProfilePage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const currentLocale = await getCurrentLocale()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  const streakSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone: tz,
    today,
  })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: calendarFeedData } = await supabase
    .from('calendar_feeds')
    .select('token, expires_at, revoked_at')
    .eq('owner_id', user.id)
    .eq('scope', 'user')
    .is('goal_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const unreadNotifications = await getUnreadNotificationCount({ supabase, userId: user.id })
  const recentRecommendations = await getRecentRecommendations({ supabase, userId: user.id, limit: 24, days: 30 })

  // 无头像时不写入默认图片，交由 UI 首字母头像渲染

  const createdAt = user.created_at ?? null
  const lastSignIn = user.last_sign_in_at ?? null
  const localeIsZh = currentLocale.startsWith('zh')
  const displayName = profile?.name ?? (user.user_metadata?.name as string) ?? user.email?.split('@')[0] ?? 'You'
  const joinedLabel = createdAt
    ? new Intl.DateTimeFormat(localeIsZh ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
      }).format(new Date(createdAt))
    : (localeIsZh ? '未知' : 'Unknown')
  const recommendationSignals = summarizeRecommendationSignals(recentRecommendations)
  const selfModelCards = buildSelfModelCards({
    locale: localeIsZh ? 'zh' : 'en',
    currentStreak: streakSnapshot.currentStreak,
    completedToday: streakSnapshot.completedToday,
    signals: recommendationSignals,
  })

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.profile.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">{dict.profile.subtitle}</div>
        </div>
        <LanguageToggle currentLocale={currentLocale} />
      </div>

      <div className="space-y-8">
        <Card className="border-primary/15 bg-linear-to-br from-primary/10 via-background to-background shadow-sm">
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1.45fr_0.85fr]">
            <div>
              <div className="inline-flex rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
                {localeIsZh ? 'System Image' : 'System Image'}
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight">
                {localeIsZh ? `系统正在学习如何更懂你，${displayName}` : `The system is learning how to understand you better, ${displayName}`}
              </div>
              <div className="mt-3 text-sm leading-6 text-muted-foreground">
                {localeIsZh
                  ? '这里不只是账户设置，而是你的长期节奏、偏好和执行模式被系统逐步理解的入口。'
                  : 'This is more than account settings. It is where your rhythm, preferences, and execution patterns become legible to the system over time.'}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {localeIsZh ? '连续状态' : 'Continuity'}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{streakSnapshot.currentStreak}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {localeIsZh ? `护盾 ${streakSnapshot.shieldBalance} 个。` : `${streakSnapshot.shieldBalance} shield(s).`}
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {localeIsZh ? '系统信号' : 'Signals'}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{unreadNotifications}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {localeIsZh ? '等待你处理的提醒与变化。' : 'Unread reminders and changes waiting for you.'}
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {localeIsZh ? '加入系统' : 'Joined'}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{joinedLabel}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {localeIsZh ? '从这一刻开始，系统持续积累对你的理解。' : 'The moment the system started accumulating context about you.'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div id="current-system-read" className="space-y-4 scroll-mt-24">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {localeIsZh ? 'Current System Read' : 'Current System Read'}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {selfModelCards.map(card => (
              <Card key={card.label} className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-base font-semibold leading-7">{card.title}</div>
                  <div className="text-sm leading-6 text-muted-foreground">{card.body}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-primary/12 bg-primary/5 shadow-none">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {localeIsZh ? '这些判断会继续进入洞察解释层，并影响 Today 的判断方式。' : 'These reads continue into the insights layer and directly affect how Today makes judgments.'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {localeIsZh ? '先看系统为什么会这样判断，再看这种理解如何改变今天的主线与建议力度。' : 'See why the system believes this first, then see how that understanding changes today’s main thread and suggestion intensity.'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/profile/ai-insights#system-read-explained">
                    {localeIsZh ? '看系统为何这样判断' : 'Why the system thinks this'}
                  </Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/today#today-system-read">
                    {localeIsZh ? '看今天如何执行' : 'See how Today applies it'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <ProfileCard
          dict={dict}
          userEmail={user.email ?? ''}
          userId={user.id}
          initialName={profile?.name ?? (user.user_metadata?.name as string) ?? ''}
          initialTimezone={profile?.timezone ?? 'UTC'}
          initialAvatarUrl={profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? ''}
          currentLocale={currentLocale}
          createdAt={createdAt}
          lastSignIn={lastSignIn}
          updateAction={updateProfile}
        />

        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {localeIsZh ? 'System Intelligence' : 'System Intelligence'}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{dict.profile.aiAnalyticsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">{dict.profile.aiAnalyticsDesc}</div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/profile/ai-insights">{dict.profile.openAIAnalytics}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  {localeIsZh ? '连续性洞察' : 'Continuity insights'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    {localeIsZh
                      ? `当前连续 ${streakSnapshot.currentStreak} 天，护盾 ${streakSnapshot.shieldBalance} 个。`
                      : `Current streak: ${streakSnapshot.currentStreak} days. Shields: ${streakSnapshot.shieldBalance}.`}
                  </div>
                  <div>
                    {localeIsZh
                      ? `连续到 ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} 天可获得下一次护盾。`
                      : `Reach ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} days to earn the next shield.`}
                  </div>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/profile/ai-insights">
                    {localeIsZh ? '查看洞察' : 'View insights'}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{dict.profile.notificationsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>{dict.profile.notificationsDesc}</div>
                  {unreadNotifications > 0 ? (
                    <div className="text-xs">
                      {dict.profile.notificationsUnread.replace('{count}', String(unreadNotifications))}
                    </div>
                  ) : null}
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/notifications" className="inline-flex items-center gap-2">
                    <span>{dict.profile.notificationsCta}</span>
                    {unreadNotifications > 0 ? (
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
                      />
                    ) : null}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{dict.potential.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">{dict.potential.subtitle}</div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/potential">{dict.sidebar.potential}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {localeIsZh ? 'Access & Connections' : 'Access & Connections'}
          </div>
          <div className="grid gap-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{dict.profile.accountSecurityTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">{dict.profile.accountSecurityDesc}</div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/profile/account">{dict.profile.manageAccount}</Link>
                </Button>
              </CardContent>
            </Card>

            <UserCalendarFeedCard
              dict={dict}
              initialToken={(calendarFeedData?.revoked_at ? null : (calendarFeedData?.token as string | null)) || null}
              initialExpiresAt={(calendarFeedData?.expires_at as string | null) || null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
