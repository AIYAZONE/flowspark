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
    <div className="flex h-[calc(100dvh-12rem)] min-h-0 flex-col md:h-[calc(100dvh-6rem)]">
      <ChatSurface copy={dict.chat} source={resolvedSource} prefill={prefill ?? ''} />
    </div>
  )
}
