import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DangerZoneCard } from '@/components/DangerZoneCard'

export default async function AccountSecurityPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button
              variant="ghost"
              size="sm"
              className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-primary/10 hover:text-primary active:bg-primary/10 active:text-primary transition-all duration-300"
            >
              <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{dict.common.back}</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{dict.profile.accountSecurityTitle}</h1>
        </div>
      </div>

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
