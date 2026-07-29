import { createClient } from '@/lib/supabase/server'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { updateProfile } from './actions'
import { ProfileCard } from '@/components/ProfileCard'
import { LanguageToggle } from '@/components/LanguageToggle'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCalendarFeedCard } from '@/components/UserCalendarFeedCard'
import { getUnreadNotificationCount } from '@/lib/notifications/queries'

export default async function ProfilePage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const currentLocale = await getCurrentLocale()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

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

  const createdAt = user.created_at ?? null
  const lastSignIn = user.last_sign_in_at ?? null
  const localeIsZh = currentLocale.startsWith('zh')

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {localeIsZh ? '个人中心' : 'Profile'}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {localeIsZh ? '管理你的资料、账户与通知。' : 'Manage your profile, account, and notifications.'}
          </div>
        </div>
        <LanguageToggle currentLocale={currentLocale} />
      </div>

      <section className="space-y-4">
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
      </section>

      <section className="space-y-4">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {localeIsZh ? '账户与安全' : 'Account & Security'}
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
      </section>

      <section className="space-y-4">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {localeIsZh ? '通知' : 'Notifications'}
        </div>
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
      </section>

      <section className="space-y-4">
        <Card className="border-dashed border-border/70 bg-background shadow-none">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                {localeIsZh
                  ? '想更深入地了解系统如何判断你、你的采纳与完成趋势，可以打开数据洞察。'
                  : 'Dive deeper into how the system reads you, and your adoption and completion trends, in Data Insights.'}
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/profile/ai-insights">{localeIsZh ? '打开数据洞察' : 'Open Data Insights'}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
