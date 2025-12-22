'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleAction(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const currentCompleted = formData.get('completed') === 'true'

  await supabase
    .from('actions')
    .update({ completed: !currentCompleted })
    .eq('id', id)

  revalidatePath('/dashboard')
}

export async function submitScore(formData: FormData) {
  const supabase = await createClient()
  const score = parseInt(formData.get('score') as string)
  const date = formData.get('date') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Upsert score
  await supabase
    .from('daily_scores')
    .upsert({ 
        user_id: user.id,
        score_date: date,
        score: score 
    }, { onConflict: 'user_id, score_date' })

  revalidatePath('/dashboard')
}
