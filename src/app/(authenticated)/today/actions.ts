'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { consumeShieldForYesterday, getStreakSnapshot } from '@/lib/streaks'
import { getUserTimezone } from '@/lib/time'

export async function recoverYesterdayStreakWithShield() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('unauthorized')
  }

  const timeZone = await getUserTimezone(supabase, user.id)
  const result = await consumeShieldForYesterday({
    supabase,
    userId: user.id,
    timeZone,
  })
  const nextSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone,
  })

  revalidatePath('/dashboard')
  revalidatePath('/today')

  return {
    ok: true,
    targetDate: result.targetDate,
    shieldBalanceAfter: result.shieldBalanceAfter,
    currentStreak: nextSnapshot.currentStreak,
  }
}
