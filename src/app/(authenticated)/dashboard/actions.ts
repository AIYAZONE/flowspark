'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { awardXP } from '@/lib/gamification-actions';

export async function toggleAction(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const currentCompleted = formData.get('completed') === 'true';
  const nextCompleted = !currentCompleted;

  const { data: action } = await supabase
    .from('actions')
    .update({ 
      completed: nextCompleted,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('user_id, type')
    .single();

  if (action && nextCompleted) {
    // Award XP only on completion
    const source = action.type === 'core' ? 'core_action' : 'maintenance_action';
    await awardXP(action.user_id, source, id);
  }

  revalidatePath('/dashboard');
  revalidatePath('/today');
}

export async function submitScore(formData: FormData) {
	const supabase = await createClient();
	const rawScore = formData.get('score') as string;
	const rawDate = formData.get('date') as string;
	const score = Math.min(5, Math.max(0, Number.parseInt(rawScore, 10)));
	const date = (rawDate || '').slice(0, 10);

	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;
	if (!Number.isFinite(score)) return;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

	// Upsert score
	const { error } = await supabase.from('daily_scores').upsert(
		{
			owner_id: user.id,
			user_id: user.id,
			score_date: date,
			score: score
		},
		{ onConflict: 'owner_id, score_date' }
	);
	if (error) {
		if (
			error.message?.includes('Could not find') ||
			error.code === '42703' ||
			error.message?.includes('column') ||
			error.code === '42P10' ||
			/(unique|exclusion) constraint/i.test(error.message || '')
		) {
			await supabase.from('daily_scores').upsert(
				{
					user_id: user.id,
					score_date: date,
					score: score
				},
				{ onConflict: 'user_id, score_date' }
			);
		} else {
			throw new Error('operation_failed');
		}
	}

	revalidatePath('/dashboard');
}
