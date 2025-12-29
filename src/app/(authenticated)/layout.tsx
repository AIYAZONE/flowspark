import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { MobileSidebar } from '@/components/MobileSidebar'
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
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden shrink-0">
          <MobileSidebar dict={dict} />
          <div className="font-semibold">{dict.sidebar.brand}</div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
