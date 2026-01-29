import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { MobileNavBar } from '@/components/MobileNavBar'
import { getDictionary } from '@/i18n/get-dictionary'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const dict = await getDictionary()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="fixed inset-0 flex h-full w-full overflow-hidden bg-muted/40">
      <Sidebar dict={dict} />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="mx-auto w-full max-w-[1600px] pt-8 md:pt-10 pb-12">
            {children}
          </div>
        </main>
        <MobileNavBar dict={dict} />
      </div>
    </div>
  )
}
