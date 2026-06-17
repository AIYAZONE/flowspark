'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function markNotificationRead(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')

  const id = (formData.get('id') as string | null) || ''
  if (!id) throw new Error('missing_fields')

  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error('operation_failed')

  revalidatePath('/notifications')
  revalidatePath('/dashboard')
  revalidatePath('/today')
  revalidatePath('/goals')
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')

  const { error } = await supabase
    .from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) throw new Error('operation_failed')

  revalidatePath('/notifications')
  revalidatePath('/dashboard')
  revalidatePath('/today')
  revalidatePath('/goals')
}
