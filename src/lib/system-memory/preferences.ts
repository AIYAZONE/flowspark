import type { SupabaseClient } from '@supabase/supabase-js'

export type SystemMemoryLocale = 'zh' | 'en'

export type SystemMemoryPreferenceKey =
  | 'reply_short'
  | 'single_clarify_question'
  | 'prefer_focus_mode'

export type SystemMemoryPreference = {
  id: string | null
  key: SystemMemoryPreferenceKey
  title: string
  description: string
  enabled: boolean
}

export type SystemMemoryPreferenceRow = {
  id: string
  user_id: string
  key: string
  title: string
  description: string
  enabled: boolean
  created_at: string
  updated_at: string
}

type SystemMemoryPreferenceSeed = Omit<SystemMemoryPreference, 'id'>

type SystemMemoryPreferenceProfile = {
  preferShortReply: boolean
  preferSingleClarifyQuestion: boolean
  preferFocusMode: boolean
}

const DEFAULT_ZH_PREFERENCES: SystemMemoryPreferenceSeed[] = [
  {
    key: 'reply_short',
    title: '回复保持短',
    description: '系统默认用短回复，控制在 3 段以内，减少打断感。',
    enabled: true,
  },
  {
    key: 'single_clarify_question',
    title: '只追问一个关键问题',
    description: '信息不够时，系统只追问一个关键问题，不连环盘问。',
    enabled: true,
  },
  {
    key: 'prefer_focus_mode',
    title: '优先进入专注模式',
    description: '系统判断可执行时，优先把你带到专注执行路径，而不是继续解释。',
    enabled: true,
  },
]

const DEFAULT_EN_PREFERENCES: SystemMemoryPreferenceSeed[] = [
  {
    key: 'reply_short',
    title: 'Keep replies short',
    description: 'Keep system replies compact and within three blocks whenever possible.',
    enabled: true,
  },
  {
    key: 'single_clarify_question',
    title: 'Ask one key question',
    description: 'When context is missing, ask only one critical follow-up instead of chaining questions.',
    enabled: true,
  },
  {
    key: 'prefer_focus_mode',
    title: 'Prefer focus mode',
    description: 'When the next step is clear, route directly into execution instead of adding more explanation.',
    enabled: true,
  },
]

export function isSystemMemoryPreferenceKey(value: string): value is SystemMemoryPreferenceKey {
  return value === 'reply_short' || value === 'single_clarify_question' || value === 'prefer_focus_mode'
}

function getDefaultSeeds(locale: SystemMemoryLocale): SystemMemoryPreferenceSeed[] {
  return locale === 'zh' ? DEFAULT_ZH_PREFERENCES : DEFAULT_EN_PREFERENCES
}

export function getDefaultSystemMemoryPreferences(locale: SystemMemoryLocale): SystemMemoryPreference[] {
  return getDefaultSeeds(locale).map((item) => ({ ...item, id: null }))
}

export function mergeSystemMemoryPreferences(
  rows: SystemMemoryPreferenceRow[],
  locale: SystemMemoryLocale
): SystemMemoryPreference[] {
  const byKey = new Map<SystemMemoryPreferenceKey, SystemMemoryPreference>()

  for (const row of rows) {
    if (!isSystemMemoryPreferenceKey(row.key)) continue
    byKey.set(row.key, {
      id: row.id,
      key: row.key,
      title: row.title,
      description: row.description,
      enabled: row.enabled,
    })
  }

  return getDefaultSeeds(locale).map((item) => byKey.get(item.key) ?? { ...item, id: null })
}

export function getSystemMemoryPreferenceProfile(
  preferences: Array<Pick<SystemMemoryPreference, 'key' | 'enabled'> | Pick<SystemMemoryPreferenceRow, 'key' | 'enabled'>>
): SystemMemoryPreferenceProfile {
  const enabledKeys = new Set(
    preferences
      .filter(
        (item): item is Pick<SystemMemoryPreference, 'key' | 'enabled'> & { key: SystemMemoryPreferenceKey } =>
          isSystemMemoryPreferenceKey(item.key) && item.enabled
      )
      .map((item) => item.key)
  )

  return {
    preferShortReply: enabledKeys.has('reply_short'),
    preferSingleClarifyQuestion: enabledKeys.has('single_clarify_question'),
    preferFocusMode: enabledKeys.has('prefer_focus_mode'),
  }
}

function buildSeedRows(userId: string, locale: SystemMemoryLocale) {
  return getDefaultSeeds(locale).map((item) => ({
    user_id: userId,
    key: item.key,
    title: item.title,
    description: item.description,
    enabled: item.enabled,
  }))
}

export async function listSystemMemoryPreferences(params: {
  supabase: SupabaseClient
  userId: string
  locale: SystemMemoryLocale
}): Promise<SystemMemoryPreference[]> {
  const { data, error } = await params.supabase
    .from('system_memory_preferences')
    .select('id, user_id, key, title, description, enabled, created_at, updated_at')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: true })

  if (error) throw new Error('operation_failed')

  const rows = ((data || []) as SystemMemoryPreferenceRow[]).filter((item) => isSystemMemoryPreferenceKey(item.key))
  if (rows.length > 0) return mergeSystemMemoryPreferences(rows, params.locale)

  const { data: seeded, error: seedError } = await params.supabase
    .from('system_memory_preferences')
    .upsert(buildSeedRows(params.userId, params.locale), { onConflict: 'user_id,key' })
    .select('id, user_id, key, title, description, enabled, created_at, updated_at')

  if (seedError) throw new Error('operation_failed')

  return mergeSystemMemoryPreferences((seeded || []) as SystemMemoryPreferenceRow[], params.locale)
}

export async function createSystemMemoryPreference(params: {
  supabase: SupabaseClient
  userId: string
  key: SystemMemoryPreferenceKey
  title: string
  description: string
  enabled?: boolean
}): Promise<void> {
  const { error } = await params.supabase.from('system_memory_preferences').upsert(
    {
      user_id: params.userId,
      key: params.key,
      title: params.title.trim(),
      description: params.description.trim(),
      enabled: params.enabled ?? true,
    },
    { onConflict: 'user_id,key' }
  )

  if (error) throw new Error('operation_failed')
}

export async function updateSystemMemoryPreference(params: {
  supabase: SupabaseClient
  userId: string
  key: SystemMemoryPreferenceKey
  enabled?: boolean
  description?: string
}): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (typeof params.enabled === 'boolean') payload.enabled = params.enabled
  if (typeof params.description === 'string') payload.description = params.description.trim()
  if (Object.keys(payload).length === 0) throw new Error('missing_fields')

  const { error } = await params.supabase
    .from('system_memory_preferences')
    .update(payload)
    .eq('user_id', params.userId)
    .eq('key', params.key)

  if (error) throw new Error('operation_failed')
}

export async function deleteSystemMemoryPreference(params: {
  supabase: SupabaseClient
  userId: string
  key: SystemMemoryPreferenceKey
}): Promise<void> {
  const { error } = await params.supabase
    .from('system_memory_preferences')
    .delete()
    .eq('user_id', params.userId)
    .eq('key', params.key)

  if (error) throw new Error('operation_failed')
}
