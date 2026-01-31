import { createClient } from '@/lib/supabase/server'

export type XPSource = 'core_action' | 'maintenance_action' | 'daily_streak' | 'bonus'

const XP_VALUES: Record<XPSource, number> = {
  core_action: 50,
  maintenance_action: 10,
  daily_streak: 100,
  bonus: 20
}

const LEVEL_THRESHOLDS = Array.from({ length: 100 }, (_, i) => Math.floor(100 * Math.pow(1.2, i)))

export async function getLevelFromXP(xp: number) {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 2 // Level 1 is base (0 XP)
    } else {
      break
    }
  }
  return level
}

export async function getNextLevelXP(level: number) {
  // Level 1 needs LEVEL_THRESHOLDS[0] to reach Level 2
  return LEVEL_THRESHOLDS[level - 1] || 999999
}

export async function awardXP(userId: string, source: XPSource, actionId?: string) {
  const supabase = await createClient()
  const amount = XP_VALUES[source]

  try {
    // 1. Log the XP transaction
    const { error: logError } = await supabase.from('xp_logs').insert({
      user_id: userId,
      amount,
      source,
      action_id: actionId,
      description: `Earned ${amount} XP from ${source.replace('_', ' ')}`
    })

    if (logError) {
      console.error('Error logging XP:', logError)
      return // Don't proceed if logging fails to avoid sync issues
    }

    // 2. Update user profile XP
    // We use a stored procedure or just simple increment if concurrency isn't huge.
    // For MVP, simple fetch-update is fine, or better: separate RPC.
    // Let's stick to simple read-modify-write for now or just update.
    
    // First get current XP
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('xp')
      .eq('id', userId)
      .single()
    
    const currentXP = profile?.xp || 0
    const newXP = currentXP + amount
    const newLevel = await getLevelFromXP(newXP)

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile XP:', updateError)
    }

    return { success: true, newXP, newLevel, earned: amount }
  } catch (error) {
    console.error('Unexpected error in awardXP:', error)
    return { success: false }
  }
}
