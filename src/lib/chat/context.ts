import type { SupabaseClient } from '@supabase/supabase-js'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { filterExecutableActionsForToday } from '@/lib/chat-agent/action-availability'
import { sortActionsForToday } from '@/lib/chat-agent/action-ranking'

export type ChatContext = {
  goals: Array<{ title: string; category: string | null; priority: string | null }>
  todayActions: Array<{ title: string; type: string | null; priority: string | null }>
  today: string
}

type GoalRow = { id: string; title: string; category: string | null; priority: string | null; status: string }
type ActionRow = {
  id: string
  title: string
  goal_id: string | null
  priority: string | null
  type: string | null
  start_date: string | null
  end_date: string | null
  completed: boolean | null
}

/**
 * Gathers the user's active goals and today's ranked open actions to ground
 * the conversational agent in the user's real life-path context.
 * Mirrors the query/permission shape used by the command-draft flow.
 */
export async function getChatContext(supabase: SupabaseClient, userId: string): Promise<ChatContext> {
  const { data: goalsData } = await queryWithOwnershipFallback({
    execute: (col) =>
      supabase.from('goals').select('id,title,category,priority,status').eq(col, userId).eq('status', 'active')
  })
  const goals: GoalRow[] = (goalsData ?? []).filter((g) => g.status === 'active')

  const { data: actionsData } = await queryWithOwnershipFallback({
    execute: (col) =>
      supabase.from('actions').select('id,title,goal_id,priority,type,start_date,end_date,completed').eq(col, userId)
  })
  const actionsAll: ActionRow[] = actionsData ?? []
  const openActions = actionsAll.filter((a) => !a.completed)

  const tz = await getUserTimezone(supabase, userId)
  const today = getTodayInTZ(tz)

  const executable = filterExecutableActionsForToday({ actions: openActions, today })
  const ranked = sortActionsForToday({
    actions: executable.map((a) => ({ ...a, goalId: a.goal_id })),
    today,
    primaryGoalId: null
  })

  return {
    goals: goals.map((g) => ({ title: g.title, category: g.category, priority: g.priority })),
    todayActions: ranked.slice(0, 8).map((a) => ({ title: a.title, type: a.type, priority: a.priority })),
    today
  }
}

export type OpenActionRef = { id: string; title: string }

/**
 * Returns the user's currently open (not completed) actions with their ids,
 * used to let the model map a "I finished X" statement onto a concrete row.
 */
export async function getOpenActionsWithIds(supabase: SupabaseClient, userId: string): Promise<OpenActionRef[]> {
  const { data: actionsData } = await queryWithOwnershipFallback({
    execute: (col) =>
      supabase.from('actions').select('id,title,start_date,end_date,completed').eq(col, userId)
  })
  const actionsAll: Array<{
    id: string
    title: string
    start_date: string | null
    end_date: string | null
    completed: boolean | null
  }> = actionsData ?? []

  const open = actionsAll.filter((a) => !a.completed)
  const tz = await getUserTimezone(supabase, userId)
  const today = getTodayInTZ(tz)
  const executable = filterExecutableActionsForToday({ actions: open, today })

  return executable.map((a) => ({ id: a.id, title: a.title }))
}
