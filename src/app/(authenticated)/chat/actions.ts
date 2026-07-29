'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { recordChatAction, completeChatAction } from '@/lib/chat/persistence'

type CreateResult = { actionId?: string; error?: string }

/**
 * Records a chat-proposed action under one of the user's active goals.
 * 鉴权 / 时区等 Next 运行时逻辑在此；真正的写库委托给 `recordChatAction`（可单测）。
 */
export async function createActionFromChat(formData: FormData): Promise<CreateResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const title = (formData.get('title') as string | null)?.trim()
  const goalHint = (formData.get('goalHint') as string | null) || null
  const reason = (formData.get('reason') as string | null) || ''

  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)

  const result = await recordChatAction(supabase, user.id, { title: title ?? '', goalHint, reason, today })
  if (result.error) return { error: result.error }

  revalidatePath('/today')
  revalidatePath('/dashboard')
  revalidatePath('/goals')
  revalidatePath('/system')

  return { actionId: result.actionId }
}

type CompleteResult = { ok?: boolean; error?: string }

/**
 * Marks a chat-identified action as completed, scoped to the authenticated user.
 * 鉴权在此；真正的写库委托给 `completeChatAction`（可单测）。
 */
export async function completeActionFromChat(formData: FormData): Promise<CompleteResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const actionId = (formData.get('actionId') as string | null)?.trim()
  const result = await completeChatAction(supabase, user.id, actionId ?? '')
  if (result.error) return { error: result.error }

  revalidatePath('/today')
  revalidatePath('/dashboard')
  revalidatePath('/goals')
  revalidatePath('/system')

  return { ok: true }
}
