'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { normalizeCategoryInput } from '@/lib/goalCategories';

const ACTIVE_GOAL_LIMIT = 5;

async function assertActiveGoalLimit(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string
) {
	const { data, error } = await supabase
		.from('goals')
		.select('id')
		.eq('user_id', userId)
		.eq('status', 'active');

	if (error) throw new Error('operation_failed');
	const activeCount = data?.length ?? 0;
	if (activeCount >= ACTIVE_GOAL_LIMIT) throw new Error('goal_limit_reached');
}

export async function createGoal(formData: FormData) {
	const supabase = await createClient();

	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	await assertActiveGoalLimit(supabase, user.id);

	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const start_date = formData.get('start_date') as string;
	const end_date = formData.get('end_date') as string;
	const success_criteria = formData.get('success_criteria') as string;
	const stop_criteria = formData.get('stop_criteria') as string;
	const priority = (formData.get('priority') as string) || 'medium';
	const category = (formData.get('category') as string) || 'other';

	if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
		throw new Error('invalid_date_range');
	}

	const { error } = await supabase.from('goals').insert({
		user_id: user.id,
		owner_id: user.id,
		title,
		description,
		start_date,
		end_date,
		success_criteria,
		stop_criteria,
		status: 'active',
		priority,
		category
	});

	if (error) {
		console.error('Error creating goal:', error);
		// 临时调试：观察是否为列缺失或值问题
		// console.log('createGoal received category:', category, 'priority:', priority)

		// Fallback for missing columns (schema mismatch)
		if (
			error.message?.includes('Could not find') ||
			error.code === '42703' ||
			error.message?.includes('column')
		) {
			console.warn(
				'Database schema missing columns, falling back to basic fields.'
			);
			const { error: legacyError } = await supabase.from('goals').insert({
				user_id: user.id,
				owner_id: user.id,
				title,
				description,
				start_date,
				end_date,
				success_criteria,
				stop_criteria,
				status: 'active'
			});

			if (legacyError) {
				console.error('Legacy create goal failed:', legacyError);
				throw new Error('operation_failed');
			}
			// Success with legacy payload - no error thrown, user continues but new fields aren't saved
		} else {
			throw new Error('operation_failed');
		}
	}

	revalidatePath('/goals');
	redirect('/goals');
}

export async function updateGoalStatus(id: string, status: string) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return;

	const { error } = await supabase
		.from('goals')
		.update({ status })
		.eq('id', id)
		.eq('owner_id', user.id);

	if (error) {
		console.error('Error updating goal status:', error);
		// Fallback for legacy schema
		if (error.code === '42703' || error.message?.includes('column')) {
			const { error: legacyError } = await supabase
				.from('goals')
				.update({ status })
				.eq('id', id)
				.eq('user_id', user.id);

			if (legacyError) {
				console.error('Legacy update failed:', legacyError);
				throw new Error(`Update failed: ${legacyError.message}`);
			}
		} else {
			throw new Error(
				`Update failed: ${error.message} (Code: ${error.code})`
			);
		}
	}

	revalidatePath('/goals');
	revalidatePath(`/goals/${id}`);
}

export async function toggleGoalStar(id: string, isStarred: boolean) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('User not authenticated');

	const { error } = await supabase
		.from('goals')
		.update({ is_starred: isStarred })
		.eq('id', id)
		.eq('owner_id', user.id); // Use owner_id as primary ownership check

	if (error) {
		console.error('Error toggling goal star:', error);

		// Fallback for legacy schema (user_id) if owner_id update fails
		if (error.code === '42703' || error.message?.includes('column')) {
			const { error: legacyError } = await supabase
				.from('goals')
				.update({ is_starred: isStarred })
				.eq('id', id)
				.eq('user_id', user.id);

			if (legacyError) {
				throw new Error('Update failed');
			}
		} else {
			throw new Error('Update failed');
		}
	}

	revalidatePath('/goals');
	revalidatePath(`/goals/${id}`);
}

export async function createGoalModal(formData: FormData) {
	const supabase = await createClient();

	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return { error: 'unauthenticated' };

	await assertActiveGoalLimit(supabase, user.id);

	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const start_date = formData.get('start_date') as string;
	const end_date = formData.get('end_date') as string;
	const success_criteria = formData.get('success_criteria') as string;
	const stop_criteria = formData.get('stop_criteria') as string;
	const priority = (formData.get('priority') as string) || 'medium';
	const category = (formData.get('category') as string) || 'other';

	if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
		throw new Error('invalid_date_range');
	}

	// 使用 select() 以返回插入记录的 id 与标题
	const { data, error } = await supabase.from('goals').insert({
		user_id: user.id,
		owner_id: user.id,
		title,
		description,
		start_date,
		end_date,
		success_criteria,
		stop_criteria,
		status: 'active',
		priority,
		category
	}).select('id,title').single();

	if (error) {
		console.error('Error creating goal:', error);

		// Fallback for missing columns (schema mismatch)
		if (
			error.message?.includes('Could not find') ||
			error.code === '42703' ||
			error.message?.includes('column')
		) {
			console.warn(
				'Database schema missing columns, falling back to basic fields.'
			);
			const { data: legacyData, error: legacyError } = await supabase.from('goals').insert({
				user_id: user.id,
				owner_id: user.id,
				title,
				description,
				start_date,
				end_date,
				success_criteria,
				stop_criteria,
				status: 'active'
			}).select('id,title').single();

			if (legacyError) {
				console.error('Legacy create goal failed:', legacyError);
				throw new Error('operation_failed');
			}
			// 成功（兼容旧架构）
			revalidatePath('/goals');
			return { success: true, goalId: legacyData?.id as string | undefined, title: legacyData?.title as string | undefined };
		} else {
			throw new Error('operation_failed');
		}
	}

	revalidatePath('/goals');
	return { success: true, goalId: data?.id as string | undefined, title: data?.title as string | undefined };
}

export async function createAction(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error('User not authenticated');
	}

	const goal_id = formData.get('goal_id') as string;
	const title = formData.get('title') as string;
	const rawType = formData.get('type') as string;
	// Ensure type has a valid default if missing
	const type = rawType || 'core';
	const priority = formData.get('priority') as string;
	const description = formData.get('description') as string;
	const start_date = formData.get('start_date') as string;
	const end_date = formData.get('end_date') as string;

	if (!goal_id || !title || !start_date || !end_date) {
		throw new Error('Missing required fields');
	}

	const baseData = {
		goal_id,
		title,
		type,
		priority: priority || 'medium',
		description: description || '',
		start_date,
		end_date,
		completed: false
	};

	// Attempt 1: Try with both user_id and owner_id (Standard for current schema)
	const { error } = await supabase.from('actions').insert({
		...baseData,
		user_id: user.id,
		owner_id: user.id
	});

	if (error) {
		console.error('Create action failed (Attempt 1):', error);

		// Check for column missing error (Postgres code 42703 or message text)
		if (error.code === '42703' || error.message?.includes('column')) {
			// Attempt 2: Try with only user_id (Legacy schema)
			const { error: error2 } = await supabase.from('actions').insert({
				...baseData,
				user_id: user.id
			});

			if (error2) {
				console.error('Create action failed (Attempt 2):', error2);

				// Attempt 3: Try with only owner_id (Future schema)
				const { error: error3 } = await supabase
					.from('actions')
					.insert({
						...baseData,
						owner_id: user.id
					});

				if (error3) {
					console.error(
						'Failed to create action (Attempt 3):',
						error3
					);
					throw new Error('operation_failed');
				}
			}
		} else {
			throw new Error(error.message);
		}
	}

	revalidatePath('/dashboard');
	revalidatePath('/today');
	revalidatePath(`/goals/${goal_id}`);
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
	const status = formData.get('status') as string;
	const priority = formData.get('priority') as string;
	const category = formData.get('category') as string;

	if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
		throw new Error('invalid_date_range');
	}

	const { error } = await supabase
		.from('goals')
		.update({
			title,
			description,
			start_date,
			end_date,
			success_criteria,
			stop_criteria,
			status,
			priority,
			category
		})
		.eq('id', id)
		.eq('owner_id', user.id);

	if (error) {
		console.error('Error updating goal:', error);

		// Fallback for missing columns (schema mismatch)
		if (
			error.message?.includes('Could not find') ||
			error.code === '42703' ||
			error.message?.includes('column')
		) {
			console.warn(
				'Database schema missing columns, falling back to basic fields.'
			);
			const { error: legacyError } = await supabase
				.from('goals')
				.update({
					title,
					description,
					start_date,
					end_date,
					success_criteria,
					stop_criteria,
					status
				})
				.eq('id', id)
				.eq('user_id', user.id);

			if (legacyError) {
				throw new Error(
					`Failed to update goal: ${legacyError.message}`
				);
			}
		} else {
			throw new Error(`Failed to update goal: ${error.message}`);
		}
	}

	revalidatePath(`/goals/${id}`);
	revalidatePath('/goals');
}

export async function updateAction(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) throw new Error('User not authenticated');

	const id = formData.get('id') as string;
	const goal_id = formData.get('goal_id') as string | null;
	const from_goal_id = formData.get('from_goal_id') as string | null;
	const title = formData.get('title') as string;
	const type = formData.get('type') as string;
	const priority = formData.get('priority') as string;
	const description = formData.get('description') as string;
	const start_date = formData.get('start_date') as string;
	const end_date = formData.get('end_date') as string;

	if (!goal_id) throw new Error('Missing required fields');
	if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
		throw new Error('invalid_date_range');
	}

	let { data: targetGoal, error: targetGoalError } = await supabase
		.from('goals')
		.select('id')
		.eq('id', goal_id)
		.eq('user_id', user.id)
		.eq('status', 'active')
		.maybeSingle();

	// Fallback for owner_id-based schemas.
	if (!targetGoal && !targetGoalError) {
		const fallback = await supabase
			.from('goals')
			.select('id')
			.eq('id', goal_id)
			.eq('owner_id', user.id)
			.eq('status', 'active')
			.maybeSingle();
		targetGoal = fallback.data;
		targetGoalError = fallback.error;
	}

	if (targetGoalError) throw new Error(targetGoalError.message);
	if (!targetGoal) throw new Error('operation_failed');

	const payload = {
		title,
		type,
		priority,
		description,
		start_date,
		end_date,
		goal_id
	};

	const { error } = await supabase
		.from('actions')
		.update(payload)
		.eq('id', id)
		.eq('user_id', user.id);

	if (error) {
		if (error.code === '42703' || error.message?.includes('column')) {
			const { error: fallbackError } = await supabase
				.from('actions')
				.update(payload)
				.eq('id', id)
				.eq('owner_id', user.id);
			if (fallbackError) throw new Error('operation_failed');
		} else {
			throw new Error('operation_failed');
		}
	}

	revalidatePath('/today');
	revalidatePath('/goals');
	if (from_goal_id) revalidatePath(`/goals/${from_goal_id}`);
	revalidatePath(`/goals/${goal_id}`);
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
		.eq('owner_id', user.id);

	if (error) {
		console.error('Error deleting action:', error);
		throw new Error('delete_failed');
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
		throw new Error('delete_failed');
	}

	const { error: deleteGoalError } = await supabase
		.from('goals')
		.delete()
		.eq('id', id)
		.eq('user_id', user.id);

	if (deleteGoalError) {
		console.error('Error deleting goal:', deleteGoalError);
		throw new Error('delete_failed');
	}

	revalidatePath('/dashboard');
	revalidatePath('/today');
	revalidatePath('/goals');
	redirect('/goals');
}

export async function replaceGoalCategory(params: { from: string; to: string }) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return { success: false as const };

	const from = params.from;
	const to = normalizeCategoryInput(params.to);
	if (!from) return { success: false as const };

	const { error, data } = await supabase
		.from('goals')
		.update({ category: to })
		.eq('owner_id', user.id)
		.eq('category', from)
		.select('id');

	if (error) {
		console.error('Error replacing goal category:', error);
		throw new Error('operation_failed');
	}

	revalidatePath('/goals');
	revalidatePath('/dashboard');
	revalidatePath('/today');

	return { success: true as const, updatedCount: data?.length ?? 0 };
}

type ShareSnapshot = {
	goal: {
		id: string;
		title: string;
		description: string;
		start_date: string;
		end_date: string;
		success_criteria: string;
		stop_criteria: string;
		status: string;
		priority?: string | null;
		category?: string | null;
	};
	actions: Array<{
		id: string;
		title: string;
		description?: string | null;
		type: string;
		priority: string;
		completed: boolean;
		start_date: string;
		end_date?: string | null;
	}>;
};

async function fetchGoalForShare(params: {
	supabase: Awaited<ReturnType<typeof createClient>>;
	userId: string;
	goalId: string;
}): Promise<ShareSnapshot> {
	const { supabase, userId, goalId } = params;
	let { data: goal, error } = await supabase
		.from('goals')
		.select('id, title, description, start_date, end_date, success_criteria, stop_criteria, status, priority, category')
		.eq('id', goalId)
		.eq('owner_id', userId)
		.maybeSingle();

	if (!goal && !error) {
		const fallback = await supabase
			.from('goals')
			.select('id, title, description, start_date, end_date, success_criteria, stop_criteria, status, priority, category')
			.eq('id', goalId)
			.eq('user_id', userId)
			.maybeSingle();
		goal = fallback.data;
		error = fallback.error;
	}
	if (error || !goal) throw new Error('operation_failed');

	let { data: actions, error: actionsError } = await supabase
		.from('actions')
		.select('id, title, description, type, priority, completed, start_date, end_date')
		.eq('goal_id', goalId)
		.eq('owner_id', userId)
		.order('completed', { ascending: true })
		.order('priority', { ascending: false })
		.order('start_date', { ascending: true });

	if (actionsError) {
		const fallback = await supabase
			.from('actions')
			.select('id, title, description, type, priority, completed, start_date, end_date')
			.eq('goal_id', goalId)
			.eq('user_id', userId)
			.order('completed', { ascending: true })
			.order('priority', { ascending: false })
			.order('start_date', { ascending: true });
		actions = fallback.data;
		actionsError = fallback.error;
	}

	if (actionsError) throw new Error('operation_failed');

	return {
		goal: {
			id: goal.id as string,
			title: (goal.title as string) || '',
			description: (goal.description as string) || '',
			start_date: (goal.start_date as string) || '',
			end_date: (goal.end_date as string) || '',
			success_criteria: (goal.success_criteria as string) || '',
			stop_criteria: (goal.stop_criteria as string) || '',
			status: (goal.status as string) || 'active',
			priority: (goal.priority as string | null) || null,
			category: (goal.category as string | null) || null
		},
		actions: (actions || []).map((a) => ({
			id: a.id as string,
			title: (a.title as string) || '',
			description: (a.description as string | null) || null,
			type: (a.type as string) || 'core',
			priority: (a.priority as string) || 'medium',
			completed: Boolean(a.completed),
			start_date: (a.start_date as string) || '',
			end_date: (a.end_date as string | null) || null
		}))
	};
}

export async function createGoalShareLink(goalId: string) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('unauthenticated');
	if (!goalId) throw new Error('missing_fields');

	const snapshot = await fetchGoalForShare({ supabase, userId: user.id, goalId });
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days

	const { error } = await supabase
		.from('goal_shares')
		.upsert({
			owner_id: user.id,
			goal_id: goalId,
			token,
			snapshot,
			revoked_at: null,
			expires_at: expiresAt
		}, { onConflict: 'owner_id,goal_id' });

	if (error) throw new Error('operation_failed');

	revalidatePath(`/goals/${goalId}`);
	return { token, expiresAt };
}

export async function revokeGoalShareLink(goalId: string) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('unauthenticated');
	if (!goalId) throw new Error('missing_fields');

	const { error } = await supabase
		.from('goal_shares')
		.update({ revoked_at: new Date().toISOString() })
		.eq('goal_id', goalId)
		.eq('owner_id', user.id);

	if (error) throw new Error('operation_failed');

	revalidatePath(`/goals/${goalId}`);
	return { success: true as const };
}
