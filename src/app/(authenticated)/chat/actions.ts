'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'

type CreateResult = { actionId?: string; error?: string }

/**
 * Records a chat-proposed action under one of the user's active goals.
 * Resolves the target goal from the draft's goalHint; falls back to the
 * first active goal. Kept self-contained (does not touch global chat-agent).
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
  if (!title) return { error: 'missing_fields' }

  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)

  const { data: goalsData } = await supabase
    .from('goals')
    .select('id,title,status')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const goals = (goalsData ?? []).filter((g) => g.status === 'active')
  if (goals.length === 0) return { error: 'no_active_goal' }

  let goalId = goals[0].id
  if (goalHint) {
    const lowerHint = goalHint.toLowerCase()
    const match = goals.find((g) => g.title && g.title.toLowerCase().includes(lowerHint.slice(0, 6)))
    if (match) goalId = match.id
  }

  const description = reason ? `来自系统对话：${reason}` : '来自系统对话'

  const { data: inserted, error } = await supabase
    .from('actions')
    .insert({
      user_id: user.id,
      owner_id: user.id,
      goal_id: goalId,
      title,
      type: 'core',
      priority: 'medium',
      description,
      start_date: today,
      end_date: today,
      completed: false
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: 'operation_failed' }

  revalidatePath('/today')
  revalidatePath('/dashboard')
  revalidatePath('/goals')
  revalidatePath('/system')

  return { actionId: inserted.id }
}

type CompleteResult = { ok?: boolean; error?: string }

/**
 * Marks a chat-identified action as completed, scoped to the authenticated
 * user. Kept self-contained (does not touch global chat-agent).
 */
export async function completeActionFromChat(formData: FormData): Promise<CompleteResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const actionId = (formData.get('actionId') as string | null)?.trim()
  if (!actionId) return { error: 'missing_fields' }

  const { error } = await supabase
    .from('actions')
    .update({ completed: true })
    .eq('id', actionId)
    .eq('user_id', user.id)

  if (error) return { error: 'operation_failed' }

  revalidatePath('/today')
  revalidatePath('/dashboard')
  revalidatePath('/goals')
  revalidatePath('/system')

  return { ok: true }
}
