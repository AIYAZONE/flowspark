import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { AppResumeGuards } from '@/components/AppResumeGuards'
import { MobileNavBar } from '@/components/MobileNavBar'
import { getDictionary } from '@/i18n/get-dictionary'
import { getUserTimezone } from '@/lib/time'
import { QuickCaptureSpeedDial } from '@/components/QuickCaptureSpeedDial'

export default async function AuthenticatedLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const supabase = await createClient()
  const dict = await getDictionary()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tz = await getUserTimezone(supabase, user.id)

  const { data: activeGoals } = await supabase
    .from('goals')
    .select('id, title')
    .eq('status', 'active')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="fixed inset-0 flex h-full w-full overflow-hidden bg-muted/40">
      <Sidebar dict={dict} />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-0">
          <div className="mx-auto w-full max-w-[1600px] pt-8 md:pt-10 pb-12">
            {children}
          </div>
        </main>
        <AppResumeGuards />
        <MobileNavBar dict={dict} />
      </div>
      <QuickCaptureSpeedDial dict={dict} tz={tz} activeGoals={(activeGoals || []).map(g => ({ id: g.id as string, title: g.title as string }))} />
      {modal}
    </div>
  )
}
