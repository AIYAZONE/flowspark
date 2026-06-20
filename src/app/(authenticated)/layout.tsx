import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { AppResumeGuards } from '@/components/AppResumeGuards'
import { MobileNavBar } from '@/components/MobileNavBar'
import { getDictionary } from '@/i18n/get-dictionary'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { QuickCaptureSpeedDial } from '@/components/QuickCaptureSpeedDial'
import { DesktopQuickAccess } from '@/components/DesktopQuickAccess'
import { XpFeedbackToast } from '@/components/XpFeedbackToast'
import { AICompletionToast } from '@/components/AICompletionToast'

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
  const today = getTodayInTZ(tz)

  const { data: activeGoals } = await supabase
    .from('goals')
    .select('id, title')
    .eq('status', 'active')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="fixed inset-0 flex h-full w-full overflow-hidden bg-muted/40">
      <Sidebar dict={dict} />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8 md:pb-0 2xl:px-10 [@media(min-width:1920px)]:px-12 [@media(min-width:2560px)]:px-14">
          <div className="mx-auto w-full max-w-[1600px] pt-8 pb-12 md:pt-10 2xl:max-w-[1760px] [@media(min-width:1920px)]:max-w-[1840px] [@media(min-width:2560px)]:max-w-[2080px]">
            {children}
          </div>
        </main>
        <AppResumeGuards />
        <XpFeedbackToast dict={dict} />
        <AICompletionToast dict={dict} />
        <MobileNavBar dict={dict} />
      </div>
      <QuickCaptureSpeedDial dict={dict} tz={tz} activeGoals={(activeGoals || []).map(g => ({ id: g.id as string, title: g.title as string }))} />
      <DesktopQuickAccess
        dict={dict}
        tz={tz}
        today={today}
        activeGoals={(activeGoals || []).map(g => ({ id: g.id as string, title: g.title as string }))}
      />
      {modal}
    </div>
  )
}
