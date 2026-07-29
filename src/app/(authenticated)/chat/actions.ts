'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { recordChatAction, completeChatAction, recordChatFeedback } from '@/lib/chat/persistence'
import type { ChatFeedbackReason } from '@/lib/chat/types'

type CreateResult = { actionId?: string; duplicate?: boolean; error?: string }

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

  return { actionId: result.actionId, duplicate: result.duplicate }
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

const VALID_REASONS: ChatFeedbackReason[] = ['too_verbose', 'not_relevant', 'inaccurate', 'want_specific']

type FeedbackResult = { ok?: boolean; error?: string }

/**
 * 记录用户对某条助手回答的反馈（赞/踩 + 可选原因）。
 * 鉴权在此；真正的写库委托给 `recordChatFeedback`（可单测）。失败不影响聊天主流程。
 */
export async function submitChatFeedback(formData: FormData): Promise<FeedbackResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const turnId = (formData.get('turnId') as string | null)?.trim()
  const rating = (formData.get('rating') as string | null)?.trim()
  const reasonRaw = (formData.get('reason') as string | null)?.trim() || null
  const reasonText = (formData.get('reasonText') as string | null)?.trim() || null
  const excerpt = (formData.get('excerpt') as string | null) || null

  if (!turnId || (rating !== 'up' && rating !== 'down')) return { error: 'missing_fields' }
  const reason = reasonRaw && VALID_REASONS.includes(reasonRaw as ChatFeedbackReason)
    ? (reasonRaw as ChatFeedbackReason)
    : null

  const result = await recordChatFeedback(supabase, user.id, {
    turnId,
    rating: rating as 'up' | 'down',
    reason,
    reasonText: reason ? null : reasonText,
    excerpt
  })
  if (result.error) return { error: result.error }

  return { ok: true }
}

/**
 * 删除用户针对某个 turn 的反馈（取消点赞/取消点踩时落库用）。
 * 鉴权：仅删除当前 user_id + turn_id 对应的 chat_feedback 行。
 */
export async function cancelChatFeedback(formData: FormData): Promise<FeedbackResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const turnId = (formData.get('turnId') as string | null)?.trim()
  if (!turnId) return { error: 'missing_fields' }

  const { error } = await supabase
    .from('chat_feedback')
    .delete()
    .eq('turn_id', turnId)

  if (error) return { error: String(error.message || error.code || 'delete_failed') }
  return { ok: true }
}
