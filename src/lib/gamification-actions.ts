import { createClient } from '@/lib/supabase/server'
import { getLevelFromXP, XPSource, XP_VALUES } from './gamification'

export async function awardXP(userId: string, source: XPSource, actionId?: string, amountOverride?: number) {
  const supabase = await createClient()
  const amount = typeof amountOverride === 'number' && Number.isFinite(amountOverride) ? Math.round(amountOverride) : XP_VALUES[source]

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
