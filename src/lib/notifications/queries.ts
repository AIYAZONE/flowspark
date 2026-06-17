import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { SystemNotificationRow } from '@/lib/notifications'

type UserNotificationDbRow = {
  id: string
  kind: string
  payload: unknown
  dedupe_key: string
  read_at: string | null
  created_at: string
}

export async function listUserNotifications(params: {
  supabase: SupabaseClient
  userId: string
  limit: number
}): Promise<SystemNotificationRow[]> {
  if (params.limit < 1 || params.limit > 50) throw new Error('invalid_limit')

  const { data, error } = await params.supabase
    .from('user_notifications')
    .select('id, kind, payload, dedupe_key, read_at, created_at')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(params.limit)

  if (error) throw new Error('operation_failed')

  return ((data || []) as UserNotificationDbRow[]).map((row) => ({
    id: row.id,
    kind: row.kind as SystemNotificationRow['kind'],
    payload: row.payload as SystemNotificationRow['payload'],
    read_at: row.read_at,
    created_at: row.created_at,
  })) as SystemNotificationRow[]
}

export async function getUnreadNotificationCount(params: {
  supabase: SupabaseClient
  userId: string
}): Promise<number> {
  const { count, error } = await params.supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', params.userId)
    .is('read_at', null)

  if (error) throw new Error('operation_failed')

  return count ?? 0
}
