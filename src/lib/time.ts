import type { SupabaseClient } from '@supabase/supabase-js'

function toDateBucketFormatter(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function getTodayInTZ(timeZone: string): string {
  return getDateBucketInTZ(new Date(), timeZone)
}

export function getDateBucketInTZ(input: Date | string, timeZone: string): string {
  const date = input instanceof Date ? input : new Date(input)
  return toDateBucketFormatter(timeZone).format(date)
}

export function shiftDateBucket(dateBucket: string, days: number): string {
  const [year, month, day] = dateBucket.split('-').map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return dateBucket
  }

  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

export function toLocaleDateStringTZ(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Date().toLocaleDateString(locale, { ...options, timeZone })
}

export async function getUserTimezone(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle()
  return profile?.timezone || 'Asia/Shanghai'
}
