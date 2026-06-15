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

  // 无头像时不写入默认图片，交由 UI 首字母头像渲染

  const createdAt = user.created_at ?? null
  const lastSignIn = user.last_sign_in_at ?? null

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{dict.profile.title}</h1>
        <LanguageToggle currentLocale={currentLocale} />
      </div>

      <div className="space-y-8">
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
              {dict.common.locale.startsWith('zh') ? '连续性洞察' : 'Continuity insights'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                {dict.common.locale.startsWith('zh')
                  ? `当前连续 ${streakSnapshot.currentStreak} 天，护盾 ${streakSnapshot.shieldBalance} 个。`
                  : `Current streak: ${streakSnapshot.currentStreak} days. Shields: ${streakSnapshot.shieldBalance}.`}
              </div>
              <div>
                {dict.common.locale.startsWith('zh')
                  ? `连续到 ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} 天可获得下一次护盾。`
                  : `Reach ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} days to earn the next shield.`}
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/profile/ai-insights">
                {dict.common.locale.startsWith('zh') ? '查看洞察' : 'View insights'}
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
  )
}
