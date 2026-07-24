'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { consumeShieldForYesterday, getStreakSnapshot } from '@/lib/streaks'
import { getUserTimezone } from '@/lib/time'
import { insertUserNotification } from '@/lib/notifications/commands'
import { getCelebrationMilestone, getPhaseKeyForStreak } from '@/lib/streak-milestones'

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

  let milestoneReached: { milestone: number; phaseKey: 'starter' | 'steady' | 'deepening' | 'resilient' | 'longrun' | 'identity' } | null = null
  const milestone = getCelebrationMilestone(nextSnapshot.currentStreak)
  if (milestone) {
    const phaseKey = getPhaseKeyForStreak(nextSnapshot.currentStreak)
    const inserted = await insertUserNotification({
      supabase,
      userId: user.id,
      kind: 'milestone_reached',
      payload: { milestone, phaseKey },
    })
    if (inserted.inserted) {
      milestoneReached = { milestone, phaseKey }
    }
  }

  await insertUserNotification({
    supabase,
    userId: user.id,
    kind: 'recovery_success',
    payload: {
      targetDate: result.targetDate,
      currentStreak: nextSnapshot.currentStreak,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/system')
  revalidatePath('/today')
  revalidatePath('/notifications')

  return {
    ok: true,
    targetDate: result.targetDate,
    shieldBalanceAfter: result.shieldBalanceAfter,
    currentStreak: nextSnapshot.currentStreak,
    milestoneReached,
  }
}
