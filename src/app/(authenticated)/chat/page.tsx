import { getDictionary } from '@/i18n/get-dictionary'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatSurface } from '@/components/chat/ChatSurface'
import type { ChatSource } from '@/lib/chat/store'

export default async function ChatPage({
  searchParams
}: {
  searchParams: Promise<{ source?: string; prefill?: string }>
}) {
  const { source, prefill } = await searchParams
  const dict = await getDictionary()
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resolvedSource: ChatSource =
    source === 'today' ? 'today' : source === 'profile' ? 'profile' : 'system'

  return (
    <div className="-mx-4 -mt-8 min-h-[calc(100dvh+2rem)] sm:-mx-6 md:-mt-10 lg:-mx-8 2xl:-mx-10 [@media(min-width:1920px)]:-mx-12 [@media(min-width:2560px)]:-mx-14">
      <ChatSurface copy={dict.chat} source={resolvedSource} prefill={prefill ?? ''} />
    </div>
  )
}
