'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'

type PotentialActionDraft = {
  title: string
  reason: string
}

type PotentialSessionResult = {
  summary?: string
  strengths?: string[]
  risks?: string[]
  opportunities?: string[]
  execution_style?: string
  next_7_days?: Array<{ day: string; focus: string }>
  actions?: PotentialActionDraft[]
}

type SessionRecord = {
  id: string
  profile_input: string
  goal_input: string
  result_json: PotentialSessionResult
  created_actions_json: Array<{ actionId: string; title: string; goalId: string; createdAt: string }>
  created_at: string
}

async function getAuthedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')
  return { supabase, user }
}

export async function listPotentialSessions(limit = 10): Promise<SessionRecord[]> {
  const { supabase, user } = await getAuthedClient()
  const { data, error } = await supabase
    .from('potential_sessions')
    .select('id, profile_input, goal_input, result_json, created_actions_json, created_at')
    .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(30, limit)))

  if (error) throw new Error('operation_failed')
  return (data || []) as SessionRecord[]
}

export async function getPotentialSession(sessionId: string): Promise<SessionRecord | null> {
  const { supabase, user } = await getAuthedClient()
  if (!sessionId) return null

  const { data, error } = await supabase
    .from('potential_sessions')
    .select('id, profile_input, goal_input, result_json, created_actions_json, created_at')
    .eq('id', sessionId)
    .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle()

  if (error) throw new Error('operation_failed')
  return (data as SessionRecord | null) || null
}

export async function deletePotentialSession(sessionId: string) {
  const { supabase, user } = await getAuthedClient()
  if (!sessionId) throw new Error('missing_fields')

  const { error } = await supabase
    .from('potential_sessions')
    .delete()
    .eq('id', sessionId)
    .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)

  if (error) throw new Error('operation_failed')
  revalidatePath('/potential')
  return { success: true as const }
}

export async function createActionFromPotential(params: {
  sessionId: string
  goalId: string
  action: PotentialActionDraft
}) {
  const { supabase, user } = await getAuthedClient()
  const { sessionId, goalId, action } = params
  if (!sessionId || !goalId || !action?.title) throw new Error('missing_fields')

  let { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!goal && !goalError) {
    const fallback = await supabase
      .from('goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    goal = fallback.data
    goalError = fallback.error
  }
  if (goalError || !goal) throw new Error('operation_failed')

  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)

  const payload = {
    goal_id: goalId,
    title: action.title,
    description: action.reason || '',
    type: 'core',
    priority: 'medium',
    completed: false,
    start_date: today,
    end_date: today,
    user_id: user.id,
    owner_id: user.id
  }

  let { data: created, error } = await supabase
    .from('actions')
    .insert(payload)
    .select('id, title')
    .single()

  if (error && (error.code === '42703' || error.message?.includes('column'))) {
    const fallback = await supabase
      .from('actions')
      .insert({ ...payload, owner_id: undefined })
      .select('id, title')
      .single()
    created = fallback.data
    error = fallback.error
  }
  if (error || !created) throw new Error('operation_failed')

  const session = await getPotentialSession(sessionId)
  if (!session) throw new Error('operation_failed')

  const currentCreated = Array.isArray(session.created_actions_json) ? session.created_actions_json : []
  const nextCreated = [
    ...currentCreated,
    { actionId: created.id as string, title: created.title as string, goalId, createdAt: new Date().toISOString() }
  ]

  const { error: updateError } = await supabase
    .from('potential_sessions')
    .update({ created_actions_json: nextCreated })
    .eq('id', sessionId)
    .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)

  if (updateError) throw new Error('operation_failed')

  revalidatePath('/potential')
  revalidatePath('/today')
  revalidatePath('/goals')
  revalidatePath(`/goals/${goalId}`)

  return { actionId: created.id as string, title: created.title as string }
}
