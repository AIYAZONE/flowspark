export function getTodayInTZ(timeZone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  // en-CA yields YYYY-MM-DD directly
  return fmt.format(new Date())
}

export function toLocaleDateStringTZ(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Date().toLocaleDateString(locale, { ...options, timeZone })
}

export async function getUserTimezone(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle()
  return profile?.timezone || 'Asia/Shanghai'
}
