import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

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

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">{dict.profile.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{dict.profile.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{dict.profile.email}</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="grid gap-2">
            <Label>{dict.profile.name}</Label>
            <Input value={profile?.name || ''} disabled />
          </div>
        </CardContent>
      </Card>

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
