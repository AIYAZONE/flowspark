'use server'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  RECURRENCE_MARKER_START,
  getUpcomingRecurringDate,
  isActionRecurrenceRule,
  parseActionRecurrenceDescription,
  serializeActionRecurrenceDescription,
  type ActionRecurrenceParams,
} from '@/lib/actionRecurrence'

type ActionRow = {
  id: string
  goal_id: string
  title: string
  description: string | null
  type: string | null
  priority: string | null
  start_date: string
  user_id?: string | null
  owner_id?: string | null
}

type SubItemRow = { title: string | null; sort_order: number | null }

function isoWeekdayFromYmd(ymd: string) {
  const date = new Date(`${ymd}T00:00:00`)
  const value = date.getDay()
  return value === 0 ? 7 : value
}

function monthdayFromYmd(ymd: string) {
  return Number(ymd.slice(8, 10))
}

async function insertActionSubItemsWithFallback(params: {
  supabase: SupabaseClient
  userId: string
  actionId: string
  items: Array<{ title: string; sort_order: number }>
}) {
  if (params.items.length === 0) return
  const baseItems = params.items.map((item) => ({
    action_id: params.actionId,
    title: item.title,
    completed: false,
    sort_order: item.sort_order,
  }))

  let inserted = await params.supabase.from('action_sub_items').insert(
    baseItems.map((item) => ({
      ...item,
      user_id: params.userId,
      owner_id: params.userId,
    }))
  )
  if (inserted.error && (inserted.error.code === '42703' || inserted.error.message?.includes('column'))) {
    inserted = await params.supabase.from('action_sub_items').insert(
      baseItems.map((item) => ({
        ...item,
        user_id: params.userId,
      }))
    )
    if (inserted.error) {
      inserted = await params.supabase.from('action_sub_items').insert(
        baseItems.map((item) => ({
          ...item,
          owner_id: params.userId,
        }))
      )
    }
  }
  if (inserted.error) throw new Error('operation_failed')
}

export async function ensureUpcomingRecurringActions(params: {
  supabase: SupabaseClient
  userId: string
  today: string
}) {
  const { supabase, userId, today } = params

  let { data: actions } = await supabase
    .from('actions')
    .select('id,goal_id,title,description,type,priority,start_date,user_id,owner_id')
    .eq('user_id', userId)
    .eq('completed', false)
    .lt('start_date', today)
    .ilike('description', `%${RECURRENCE_MARKER_START}%`)
    .order('start_date', { ascending: false })
    .limit(200)

  if (!actions || actions.length === 0) {
    const fallback = await supabase
      .from('actions')
      .select('id,goal_id,title,description,type,priority,start_date,user_id,owner_id')
      .eq('owner_id', userId)
      .eq('completed', false)
      .lt('start_date', today)
      .ilike('description', `%${RECURRENCE_MARKER_START}%`)
      .order('start_date', { ascending: false })
      .limit(200)
    actions = fallback.data
  }

  const seriesMap = new Map<string, ActionRow>()
  for (const row of (actions || []) as ActionRow[]) {
    const meta = parseActionRecurrenceDescription(row.description || '')
    if (!isActionRecurrenceRule(meta.recurrence)) continue
    const baseParams: ActionRecurrenceParams =
      meta.recurrence === 'weekly'
        ? { weekday: meta.params.weekday || isoWeekdayFromYmd(row.start_date) }
        : meta.recurrence === 'monthly'
          ? { monthday: meta.params.monthday || monthdayFromYmd(row.start_date), missing: 'clamp' }
          : {}
    const key = `${row.goal_id}::${row.title}::${meta.recurrence}::${JSON.stringify(baseParams)}`
    if (!seriesMap.has(key)) seriesMap.set(key, row)
  }

  for (const [key, template] of seriesMap.entries()) {
    const parts = key.split('::')
    const recurrence = parts[2] as 'daily' | 'weekly' | 'monthly'
    const ruleParams = JSON.parse(parts[3] || '{}') as ActionRecurrenceParams
    const nextRange = getUpcomingRecurringDate({ today, recurrence, ruleParams })
    const nextDate = nextRange.startDate

    let { data: existing } = await supabase
      .from('actions')
      .select('id')
      .eq('goal_id', template.goal_id)
      .eq('title', template.title)
      .eq('start_date', nextDate)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      const fallbackExisting = await supabase
        .from('actions')
        .select('id')
        .eq('goal_id', template.goal_id)
        .eq('title', template.title)
        .eq('start_date', nextDate)
        .eq('owner_id', userId)
        .maybeSingle()
      existing = fallbackExisting.data
    }
    if (existing?.id) continue

    const normalizedDescription = serializeActionRecurrenceDescription(template.description || '', recurrence, ruleParams)
    const basePayload = {
      goal_id: template.goal_id,
      title: template.title,
      type: template.type || 'core',
      priority: template.priority || 'medium',
      description: normalizedDescription,
      start_date: nextDate,
      end_date: nextDate,
      completed: false,
      ai_recommendation_id: null,
    }

    let inserted = await supabase
      .from('actions')
      .insert({ ...basePayload, user_id: userId, owner_id: userId })
      .select('id')
      .single()
    if (inserted.error && (inserted.error.code === '42703' || inserted.error.message?.includes('column'))) {
      inserted = await supabase
        .from('actions')
        .insert({ ...basePayload, user_id: userId })
        .select('id')
        .single()
      if (inserted.error) {
        inserted = await supabase
          .from('actions')
          .insert({ ...basePayload, owner_id: userId })
          .select('id')
          .single()
      }
    }
    if (inserted.error || !inserted.data?.id) throw new Error('operation_failed')

    let { data: subItems } = await supabase
      .from('action_sub_items')
      .select('title,sort_order')
      .eq('action_id', template.id)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (!subItems || subItems.length === 0) {
      const fallbackSubItems = await supabase
        .from('action_sub_items')
        .select('title,sort_order')
        .eq('action_id', template.id)
        .eq('owner_id', userId)
        .order('sort_order', { ascending: true })
      subItems = fallbackSubItems.data
    }

    await insertActionSubItemsWithFallback({
      supabase,
      userId,
      actionId: inserted.data.id as string,
      items: ((subItems || []) as SubItemRow[])
        .filter((item) => Boolean(item.title))
        .map((item) => ({ title: item.title as string, sort_order: Number(item.sort_order || 0) })),
    })
  }
}

