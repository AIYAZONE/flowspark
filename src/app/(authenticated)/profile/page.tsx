import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { updateProfile } from './actions'
import { ProfileCard } from '@/components/ProfileCard'
import { DEFAULT_AVATAR_URL } from '@/lib/constants'

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

  if (!profile?.avatar_url) {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, avatar_url: DEFAULT_AVATAR_URL })
    if (error) {
      await supabase.auth.updateUser({ data: { avatar_url: DEFAULT_AVATAR_URL } })
    }
  }

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
