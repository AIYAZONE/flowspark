import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { updateProfile } from './actions'
import { ProfileCard } from '@/components/ProfileCard'

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

  // 无头像时不写入默认图片，交由 UI 首字母头像渲染

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">{dict.profile.title}</h1>

      <ProfileCard
        dict={dict}
        userEmail={user.email ?? ''}
        userId={user.id}
        initialName={profile?.name ?? (user.user_metadata?.name as string) ?? ''}
        initialTimezone={profile?.timezone ?? 'UTC'}
        initialAvatarUrl={profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? ''}
        currentLocale={currentLocale}
        updateAction={updateProfile}
      />

      <Card>
        <CardHeader>
          <CardTitle>{dict.profile.language}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{dict.profile.switchLanguage}</span>
            <div className="w-[150px]">
              <LanguageSwitcher currentLocale={currentLocale} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
