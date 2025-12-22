'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createGoal(formData: FormData) {
	const supabase = await createClient();

	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const start_date = formData.get('start_date') as string;
	const end_date = formData.get('end_date') as string;
	const success_criteria = formData.get('success_criteria') as string;
	const stop_criteria = formData.get('stop_criteria') as string;

	const { error } = await supabase.from('goals').insert({
		user_id: user.id,
		title,
		description,
		start_date,
		end_date,
		success_criteria,
		stop_criteria,
		status: 'active'
	});

	if (error) {
		console.error('Error creating goal:', error);
		// Handle error (e.g. return it to the form)
		// For MVP, simplistic error handling
		return;
	}

	revalidatePath('/goals');
	redirect('/goals');
}

export async function createAction(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const goal_id = formData.get('goal_id') as string;
	const title = formData.get('title') as string;
	const type = formData.get('type') as string;
	const action_date = formData.get('action_date') as string;

	const { error } = await supabase.from('actions').insert({
		user_id: user.id,
		goal_id,
		title,
		type,
		action_date
	});

	if (error) {
		console.error('Error creating action:', error);
	}

	revalidatePath(`/goals/${goal_id}`);
}
