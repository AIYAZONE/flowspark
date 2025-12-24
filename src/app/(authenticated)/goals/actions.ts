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
	const start_date = formData.get('start_date') as string || (formData.get('action_date') as string);
	const end_date = formData.get('end_date') as string;

	// Try insert using start_date/end_date, fall back to legacy action_date if column doesn't exist
	const insertPayload: Record<string, string | null> = {
		user_id: user.id,
		goal_id,
		title,
		type,
		start_date
	};
	// Always set end_date to end_date or fallback to action_date for consistency
	insertPayload.end_date = end_date || start_date;

	const { error: insertError } = await supabase
		.from('actions')
		.insert(insertPayload);

	if (insertError) {
		console.error('Error creating action:', insertError);
		// Fallback: attempt legacy insert with action_date
		const legacyPayload: Record<string, string | null> = {
			user_id: user.id,
			goal_id,
			title,
			type,
			action_date: start_date
		};
		if (end_date) legacyPayload.end_date = end_date;
		const { error: fallbackError } = await supabase.from('actions').insert(legacyPayload);
		if (fallbackError) {
			console.error('Fallback createAction error:', fallbackError);
			return;
		}
	}

	revalidatePath(`/goals/${goal_id}`);
	revalidatePath('/today');
}

export async function updateGoal(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const id = formData.get('id') as string;
	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const start_date = formData.get('start_date') as string;
	const end_date = formData.get('end_date') as string;
	const success_criteria = formData.get('success_criteria') as string;
	const stop_criteria = formData.get('stop_criteria') as string;

	const { error } = await supabase
		.from('goals')
		.update({
			title,
			description,
			start_date,
			end_date,
			success_criteria,
			stop_criteria
		})
		.eq('id', id)
		.eq('user_id', user.id);

	if (error) {
		console.error('Error updating goal:', error);
		throw new Error('Failed to update goal');
	}

	revalidatePath(`/goals/${id}`);
	revalidatePath('/goals');
}

export async function updateAction(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const id = formData.get('id') as string;
	const title = formData.get('title') as string;
	const type = formData.get('type') as string;
	const start_date = formData.get('start_date') as string || (formData.get('action_date') as string);
	const end_date = formData.get('end_date') as string;
	const goal_id = formData.get('goal_id') as string;

	// Try update with start_date/end_date; on error retry legacy update with action_date
	const updatePayload: Record<string, string | null> = {
		title,
		type,
		start_date
	};
	if (end_date) updatePayload.end_date = end_date;

	const { error: updateError } = await supabase
		.from('actions')
		.update(updatePayload)
		.eq('id', id)
		.eq('user_id', user.id);

	if (updateError) {
		console.error('Error updating action:', updateError);
		// Fallback: attempt legacy update using action_date
		const { error: fallbackError } = await supabase
			.from('actions')
			.update({
				title,
				type,
				action_date: start_date,
				end_date: end_date || null
			})
			.eq('id', id)
			.eq('user_id', user.id);
		if (fallbackError) {
			console.error('Fallback updateAction error:', fallbackError);
			throw new Error('Failed to update action');
		}
	}

	revalidatePath('/today');
	if (goal_id) {
		revalidatePath(`/goals/${goal_id}`);
	}
}

export async function deleteAction(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const id = formData.get('id') as string;
	const goal_id = formData.get('goal_id') as string | null;

	const { error } = await supabase
		.from('actions')
		.delete()
		.eq('id', id)
		.eq('user_id', user.id);

	if (error) {
		console.error('Error deleting action:', error);
		throw new Error('Failed to delete action');
	}

	revalidatePath('/dashboard');
	revalidatePath('/today');
	if (goal_id) revalidatePath(`/goals/${goal_id}`);
}

export async function deleteGoal(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const id = formData.get('id') as string;

	const { error: deleteActionsError } = await supabase
		.from('actions')
		.delete()
		.eq('goal_id', id)
		.eq('user_id', user.id);

	if (deleteActionsError) {
		console.error('Error deleting goal actions:', deleteActionsError);
		throw new Error('Failed to delete goal actions');
	}

	const { error: deleteGoalError } = await supabase
		.from('goals')
		.delete()
		.eq('id', id)
		.eq('user_id', user.id);

	if (deleteGoalError) {
		console.error('Error deleting goal:', deleteGoalError);
		throw new Error('Failed to delete goal');
	}

	revalidatePath('/dashboard');
	revalidatePath('/today');
	revalidatePath('/goals');
	redirect('/goals');
}
