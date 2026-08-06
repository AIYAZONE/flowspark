'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { recordChatAction, completeChatAction, recordChatFeedback, recordPathPlan } from '@/lib/chat/persistence'
import { planPath } from '@/lib/ai/pathPlan'
import { createGoalModal } from '@/app/(authenticated)/goals/actions'
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

type CreateGoalResult = { goalId?: string; error?: string }

/**
 * B 闭环：把聊天里的「新路径」草案直接落成一条完整 5 层路径蓝图。
 * 流程：建 goal（含标题/描述） → planPath 生成定位卡+支柱+里程碑+KR → recordPathPlan 落写子表。
 * 对话历史由前端传入，作为 AI 规划的原料。返回新 goal 的 id，供前端跳转详情页。
 */
export async function createGoalFromChat(formData: FormData): Promise<CreateGoalResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const title = (formData.get('title') as string | null)?.trim()
  const reason = (formData.get('reason') as string | null) || ''
  const localeRaw = (formData.get('locale') as string | null) || 'zh'
  const locale: 'zh' | 'en' = localeRaw === 'en' ? 'en' : 'zh'
  const conversationRaw = (formData.get('conversation') as string | null) || '[]'
  let conversation: { role: 'user' | 'assistant'; content: string }[] = []
  try {
    const parsed = JSON.parse(conversationRaw)
    if (Array.isArray(parsed)) {
      conversation = parsed
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content }))
    }
  } catch {
    conversation = []
  }

  if (!title) return { error: 'missing_fields' }

  // 1. 建 goal（描述用 reason 兜底，给 AI 规划一点原料）
  const goalForm = new FormData()
  goalForm.set('title', title)
  goalForm.set('description', reason || '')
  goalForm.set('category', 'other')
  goalForm.set('priority', 'medium')

  let goalId: string | undefined
  try {
    const created = await createGoalModal(goalForm)
    if (!created?.success || !created.goalId) {
      return { error: 'create_goal_failed' }
    }
    goalId = created.goalId
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'create_goal_failed' }
  }

  // 2. AI 生成 5 层路径方案
  let plan
  try {
    plan = await planPath(supabase, {
      locale,
      goalId,
      goalTitle: title,
      goalDescription: reason || null,
      conversation
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'plan_path_failed' }
  }

  // 3. 落写定位卡 + 支柱 + 里程碑 + 关键结果
  const record = await recordPathPlan(supabase, user.id, { goalId, plan })
  if (record.error) return { error: record.error }

  revalidatePath('/goals')
  revalidatePath(`/goals/${goalId}`)
  revalidatePath('/today')
  revalidatePath('/dashboard')
  revalidatePath('/system')

  return { goalId }
}
