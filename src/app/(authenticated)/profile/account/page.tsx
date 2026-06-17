import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DangerZoneCard } from '@/components/DangerZoneCard'
import { ProfileSubPageHeader } from '@/components/profile/ProfileSubPageHeader'
import { Shield } from 'lucide-react'

export default async function AccountSecurityPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <ProfileSubPageHeader
        title={dict.profile.accountSecurityTitle}
        backHref="/profile"
        backLabel={dict.common.back}
        breadcrumbs={[{ label: dict.profile.title, href: '/profile' }]}
        icon={<Shield className="h-4 w-4" />}
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">{dict.profile.accountSecurityTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {dict.profile.accountSecurityDesc}
        </CardContent>
      </Card>

      <DangerZoneCard dict={dict} userEmail={user.email ?? ''} />
    </div>
  )
}
