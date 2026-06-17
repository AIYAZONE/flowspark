import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { SystemNotificationKind } from '@/lib/notifications'
import { buildNotificationDedupeKey } from '@/lib/notifications/keys'

export async function insertUserNotification(params: {
  supabase: SupabaseClient
  userId: string
  kind: SystemNotificationKind
  payload: Record<string, unknown>
}): Promise<{ inserted: boolean; dedupeKey: string }> {
  const dedupeKey = buildNotificationDedupeKey({ kind: params.kind, payload: params.payload })

  const { error } = await params.supabase.from('user_notifications').insert({
    user_id: params.userId,
    kind: params.kind,
    payload: params.payload,
    dedupe_key: dedupeKey,
  })

  if (!error) return { inserted: true, dedupeKey }

  if (error.code === '23505') return { inserted: false, dedupeKey }

  throw new Error('operation_failed')
}
