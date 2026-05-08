'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setRecommendationCompletion } from '@/lib/ai/recommendationStore';
import { createClient } from '@/lib/supabase/server';
import { normalizeCategoryInput } from '@/lib/goalCategories';

const ACTIVE_GOAL_LIMIT = 5;

type ActionInsertPayload = {
	goal_id: string;
	title: string;
	type: string;
	priority: string;
	description: string;
	start_date: string;
	end_date: string;
	completed: boolean;
	ai_recommendation_id?: string | null;
};

type ActionSubItemInsertPayload = {
	action_id: string;
	title: string;
	completed: boolean;
	sort_order: number;
};

type ActionSubItemUpsertPayload = {
	id?: string;
	title: string;
	completed: boolean;
	sort_order: number;
};

type ActionAttachmentInsertPayload = {
	action_id: string;
	file_path: string;
	public_url: string;
	mime_type: string | null;
	size_bytes: number | null;
	bucket: string;
};

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

function parseSubItems(
	raw: FormDataEntryValue | null
): ActionSubItemInsertPayload[] {
	if (typeof raw !== 'string' || !raw.trim()) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error('invalid_json');
	}
	if (!Array.isArray(parsed)) return [];

	const items: ActionSubItemInsertPayload[] = [];
	for (const [idx, item] of parsed.entries()) {
		if (!item || typeof item !== 'object') continue;
		const row = item as Record<string, unknown>;
		const title = typeof row.title === 'string' ? row.title.trim() : '';
		if (!title) continue;
		const sort_order =
			typeof row.sort_order === 'number' &&
			Number.isFinite(row.sort_order)
				? Math.max(0, Math.round(row.sort_order))
				: idx;
		items.push({
			action_id: '',
			title,
			completed: false,
			sort_order
		});
		if (items.length >= 20) break;
	}
	return items;
}

function parseSubItemsForUpdate(
	raw: FormDataEntryValue | null
): ActionSubItemUpsertPayload[] {
	if (typeof raw !== 'string' || !raw.trim()) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error('invalid_json');
	}
	if (!Array.isArray(parsed)) return [];

	const items: ActionSubItemUpsertPayload[] = [];
	for (const [idx, item] of parsed.entries()) {
		if (!item || typeof item !== 'object') continue;
		const row = item as Record<string, unknown>;
		const title = typeof row.title === 'string' ? row.title.trim() : '';
		if (!title) continue;
		const sort_order =
			typeof row.sort_order === 'number' &&
			Number.isFinite(row.sort_order)
				? Math.max(0, Math.round(row.sort_order))
				: idx;
		items.push({
			id: typeof row.id === 'string' ? row.id : undefined,
			title,
			completed: Boolean(row.completed),
			sort_order
		});
		if (items.length >= 20) break;
	}
	return items;
}

function parseAttachmentManifest(
	raw: FormDataEntryValue | null
): ActionAttachmentInsertPayload[] {
	if (typeof raw !== 'string' || !raw.trim()) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error('invalid_json');
	}
	if (!Array.isArray(parsed)) return [];

	const rows: ActionAttachmentInsertPayload[] = [];
	for (const item of parsed) {
		if (!item || typeof item !== 'object') continue;
		const row = item as Record<string, unknown>;
		const file_path =
			typeof row.file_path === 'string' ? row.file_path.trim() : '';
		const public_url =
			typeof row.public_url === 'string' ? row.public_url.trim() : '';
		if (!file_path || !public_url) continue;
		rows.push({
			action_id: '',
			file_path,
			public_url,
			mime_type: typeof row.mime_type === 'string' ? row.mime_type : null,
			size_bytes:
				typeof row.size_bytes === 'number' &&
				Number.isFinite(row.size_bytes)
					? Math.max(0, Math.round(row.size_bytes))
					: null,
			bucket:
				typeof row.bucket === 'string' && row.bucket.trim()
					? row.bucket.trim()
					: 'action-images'
		});
		if (rows.length >= 12) break;
	}
	return rows;
}

async function insertActionWithFallback(params: {
	supabase: Awaited<ReturnType<typeof createClient>>;
	userId: string;
	payload: ActionInsertPayload;
	selectFields?: string;
}) {
	const { supabase, userId, payload, selectFields } = params;
	const runInsert = async (insertPayload: Record<string, unknown>) => {
		const query = supabase.from('actions').insert(insertPayload);
		if (selectFields) return query.select(selectFields).single();
		return query;
	};

	let data: Record<string, unknown> | null = null;

	const attempt1 = await runInsert({
		...payload,
		user_id: userId,
		owner_id: userId
	});
	if (!attempt1.error) {
		data =
			(attempt1 as { data?: Record<string, unknown> | null }).data ??
			null;
		return { data };
	}

	const columnMissing =
		attempt1.error.code === '42703' ||
		attempt1.error.message?.includes('column');
	if (!columnMissing) throw attempt1.error;

	const attempt2 = await runInsert({
		...payload,
		user_id: userId
	});
	if (!attempt2.error) {
		data =
			(attempt2 as { data?: Record<string, unknown> | null }).data ??
			null;
		return { data };
	}

	const attempt3 = await runInsert({
		...payload,
		owner_id: userId
	});
	if (attempt3.error) throw attempt3.error;

	data = (attempt3 as { data?: Record<string, unknown> | null }).data ?? null;
	return { data };
}

async function insertActionSubItemsWithFallback(params: {
	supabase: Awaited<ReturnType<typeof createClient>>;
	userId: string;
	items: ActionSubItemInsertPayload[];
}) {
	const { supabase, userId, items } = params;
	if (items.length === 0) return;

	const payload = items.map((item) => ({
		...item,
		user_id: userId,
		owner_id: userId
	}));

	const { error } = await supabase.from('action_sub_items').insert(payload);
	if (!error) return;

	const columnMissing =
		error.code === '42703' || error.message?.includes('column');
	if (!columnMissing) throw error;

	const { error: error2 } = await supabase.from('action_sub_items').insert(
		payload.map((item) => ({
			action_id: item.action_id,
			title: item.title,
			completed: item.completed,
			sort_order: item.sort_order,
			user_id: item.user_id
		}))
	);
	if (!error2) return;

	const { error: error3 } = await supabase.from('action_sub_items').insert(
		payload.map((item) => ({
			action_id: item.action_id,
			title: item.title,
			completed: item.completed,
			sort_order: item.sort_order,
			owner_id: item.owner_id
		}))
	);
	if (error3) throw error3;
}

async function insertActionAttachmentsWithFallback(params: {
	supabase: Awaited<ReturnType<typeof createClient>>;
	userId: string;
	items: ActionAttachmentInsertPayload[];
}) {
	const { supabase, userId, items } = params;
	if (items.length === 0) return;

	const payload = items.map((item) => ({
		...item,
		user_id: userId,
		owner_id: userId
	}));

	const { error } = await supabase.from('action_attachments').insert(payload);
	if (!error) return;

	const columnMissing =
		error.code === '42703' || error.message?.includes('column');
	if (!columnMissing) throw error;

	const { error: error2 } = await supabase.from('action_attachments').insert(
		payload.map((item) => ({
			action_id: item.action_id,
			file_path: item.file_path,
			public_url: item.public_url,
			mime_type: item.mime_type,
			size_bytes: item.size_bytes,
			bucket: item.bucket,
			user_id: item.user_id
		}))
	);
	if (!error2) return;

	const { error: error3 } = await supabase.from('action_attachments').insert(
		payload.map((item) => ({
			action_id: item.action_id,
			file_path: item.file_path,
			public_url: item.public_url,
			mime_type: item.mime_type,
			size_bytes: item.size_bytes,
			bucket: item.bucket,
			owner_id: item.owner_id
		}))
	);
	if (error3) throw error3;
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
	const { data, error } = await supabase
		.from('goals')
		.insert({
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
		})
		.select('id,title')
		.single();

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
			const { data: legacyData, error: legacyError } = await supabase
				.from('goals')
				.insert({
					user_id: user.id,
					owner_id: user.id,
					title,
					description,
					start_date,
					end_date,
					success_criteria,
					stop_criteria,
					status: 'active'
				})
				.select('id,title')
				.single();

			if (legacyError) {
				console.error('Legacy create goal failed:', legacyError);
				throw new Error('operation_failed');
			}
			// 成功（兼容旧架构）
			revalidatePath('/goals');
			return {
				success: true,
				goalId: legacyData?.id as string | undefined,
				title: legacyData?.title as string | undefined
			};
		} else {
			throw new Error('operation_failed');
		}
	}

	revalidatePath('/goals');
	return {
		success: true,
		goalId: data?.id as string | undefined,
		title: data?.title as string | undefined
	};
}

export async function createActionAndReturnId(formData: FormData) {
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
	const ai_recommendation_id =
		(formData.get('ai_recommendation_id') as string | null) || null;
	const attachments = parseAttachmentManifest(
		formData.get('attachment_manifest')
	);

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
		completed: false,
		ai_recommendation_id
	};
	let createdActionId: string | null = null;
	try {
		const inserted = await insertActionWithFallback({
			supabase,
			userId: user.id,
			payload: baseData,
			selectFields: 'id'
		});
		createdActionId = (inserted.data?.id as string) || null;
		if (!createdActionId) throw new Error('operation_failed');
		const actionId = createdActionId;

		if (attachments.length > 0) {
			await insertActionAttachmentsWithFallback({
				supabase,
				userId: user.id,
				items: attachments.map((item) => ({
					...item,
					action_id: actionId
				}))
			});
		}
	} catch (error) {
		console.error('Failed to create action:', error);
		throw new Error('operation_failed');
	}

	revalidatePath('/dashboard');
	revalidatePath('/today');
	revalidatePath(`/goals/${goal_id}`);
	return { actionId: createdActionId };
}

export async function createAction(formData: FormData): Promise<void> {
	await createActionAndReturnId(formData);
}

export async function createActionWithSubItems(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('User not authenticated');

	const goal_id = formData.get('goal_id') as string;
	const title = formData.get('title') as string;
	const rawType = formData.get('type') as string;
	const type = rawType || 'core';
	const priority = (formData.get('priority') as string) || 'medium';
	const description = (formData.get('description') as string) || '';
	const start_date = formData.get('start_date') as string;
	const end_date = formData.get('end_date') as string;
	if (!goal_id || !title || !start_date || !end_date) {
		throw new Error('Missing required fields');
	}

	const subItems = parseSubItems(formData.get('sub_items'));
	const attachments = parseAttachmentManifest(
		formData.get('attachment_manifest')
	);

	let createdActionId: string | null = null;
	try {
		const inserted = await insertActionWithFallback({
			supabase,
			userId: user.id,
			payload: {
				goal_id,
				title,
				type,
				priority,
				description,
				start_date,
				end_date,
				completed: false
			},
			selectFields: 'id'
		});
		createdActionId = (inserted.data?.id as string) || null;
		if (!createdActionId) throw new Error('operation_failed');

		if (subItems.length > 0) {
			await insertActionSubItemsWithFallback({
				supabase,
				userId: user.id,
				items: subItems.map((item) => ({
					...item,
					action_id: createdActionId as string
				}))
			});
		}
		if (attachments.length > 0) {
			await insertActionAttachmentsWithFallback({
				supabase,
				userId: user.id,
				items: attachments.map((item) => ({
					...item,
					action_id: createdActionId as string
				}))
			});
		}
	} catch (error) {
		if (createdActionId) {
			const remove = await supabase
				.from('actions')
				.delete()
				.eq('id', createdActionId)
				.eq('owner_id', user.id);
			if (remove.error) {
				await supabase
					.from('actions')
					.delete()
					.eq('id', createdActionId)
					.eq('user_id', user.id);
			}
		}
		console.error('Failed to create action with sub items:', error);
		throw new Error('operation_failed');
	}

	revalidatePath('/dashboard');
	revalidatePath('/today');
	revalidatePath('/goals');
	revalidatePath(`/goals/${goal_id}`);
	return { actionId: createdActionId };
}

export async function toggleActionSubItem(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('unauthenticated');

	const id = formData.get('id') as string;
	const goal_id = (formData.get('goal_id') as string) || null;
	const currentCompleted = formData.get('completed') === 'true';
	if (!id) throw new Error('missing_fields');

	let actionId: string | null = null;
	let fetchError: { message?: string; code?: string } | null = null;
	const byOwner = await supabase
		.from('action_sub_items')
		.select('action_id')
		.eq('id', id)
		.eq('owner_id', user.id)
		.maybeSingle();
	actionId = (byOwner.data?.action_id as string | null) || null;
	fetchError = byOwner.error;
	if (!actionId && !fetchError) {
		const byUser = await supabase
			.from('action_sub_items')
			.select('action_id')
			.eq('id', id)
			.eq('user_id', user.id)
			.maybeSingle();
		actionId = (byUser.data?.action_id as string | null) || null;
		fetchError = byUser.error;
	}
	if (fetchError || !actionId) throw new Error('operation_failed');

	const nextCompleted = !currentCompleted;
	let { error } = await supabase
		.from('action_sub_items')
		.update({
			completed: nextCompleted,
			updated_at: new Date().toISOString()
		})
		.eq('id', id)
		.eq('owner_id', user.id);

	if (error) {
		const fallback = await supabase
			.from('action_sub_items')
			.update({
				completed: nextCompleted,
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.eq('user_id', user.id);
		error = fallback.error;
	}
	if (error) throw new Error('operation_failed');

	// 双向联动：子行动全完成 => 父行动完成；存在未完成 => 父行动未完成
	let subItems:
		| Array<{ completed: boolean }>
		| null = null;
	const listByOwner = await supabase
		.from('action_sub_items')
		.select('completed')
		.eq('action_id', actionId)
		.eq('owner_id', user.id);
	subItems = (listByOwner.data as Array<{ completed: boolean }> | null) ?? null;
	if (!subItems && !listByOwner.error) {
		const listByUser = await supabase
			.from('action_sub_items')
			.select('completed')
			.eq('action_id', actionId)
			.eq('user_id', user.id);
		subItems =
			(listByUser.data as Array<{ completed: boolean }> | null) ?? null;
	}
	if (subItems && subItems.length > 0) {
		const parentCompleted = subItems.every((item) => item.completed);
		let parentUpdateError: { message?: string; code?: string } | null = null;
		let parentRecommendationId: string | null = null;
		const parentByOwner = await supabase
			.from('actions')
			.update({ completed: parentCompleted })
			.eq('id', actionId)
			.eq('owner_id', user.id)
			.select('ai_recommendation_id')
			.maybeSingle();
		parentUpdateError = parentByOwner.error;
		parentRecommendationId =
			(parentByOwner.data?.ai_recommendation_id as string | null) ?? null;
		if (parentUpdateError) {
			const parentByUser = await supabase
				.from('actions')
				.update({ completed: parentCompleted })
				.eq('id', actionId)
				.eq('user_id', user.id)
				.select('ai_recommendation_id')
				.maybeSingle();
			parentUpdateError = parentByUser.error;
			parentRecommendationId =
				(parentByUser.data?.ai_recommendation_id as string | null) ?? null;
		}
		if (parentUpdateError) throw new Error('operation_failed');
		if (parentRecommendationId) {
			await setRecommendationCompletion({
				supabase,
				recommendationId: parentRecommendationId,
				userId: user.id,
				completed: parentCompleted
			});
		}
	}

	revalidatePath('/today');
	revalidatePath('/goals');
	if (goal_id) revalidatePath(`/goals/${goal_id}`);
	return { ok: true as const, completed: nextCompleted };
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
	const subItemsUpdate = parseSubItemsForUpdate(formData.get('sub_items'));

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

	// Replace sub-items when editor submits sub_items payload.
	if (formData.has('sub_items')) {
		let deleteError: { message?: string; code?: string } | null = null;
		const removeByOwner = await supabase
			.from('action_sub_items')
			.delete()
			.eq('action_id', id)
			.eq('owner_id', user.id);
		deleteError = removeByOwner.error;
		if (deleteError) {
			const removeByUser = await supabase
				.from('action_sub_items')
				.delete()
				.eq('action_id', id)
				.eq('user_id', user.id);
			deleteError = removeByUser.error;
		}
		if (deleteError) throw new Error('operation_failed');

		if (subItemsUpdate.length > 0) {
			await insertActionSubItemsWithFallback({
				supabase,
				userId: user.id,
				items: subItemsUpdate.map((item) => ({
					action_id: id,
					title: item.title,
					completed: item.completed,
					sort_order: item.sort_order
				}))
			});
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

	let { data: attachments } = await supabase
		.from('action_attachments')
		.select('file_path,bucket')
		.eq('action_id', id)
		.eq('owner_id', user.id);

	if (!attachments || attachments.length === 0) {
		const fallback = await supabase
			.from('action_attachments')
			.select('file_path,bucket')
			.eq('action_id', id)
			.eq('user_id', user.id);
		attachments = fallback.data;
	}

	if (attachments && attachments.length > 0) {
		const bucketMap = new Map<string, string[]>();
		for (const row of attachments) {
			const bucket = (row.bucket as string) || 'action-images';
			const filePath = (row.file_path as string) || '';
			if (!filePath) continue;
			const arr = bucketMap.get(bucket) ?? [];
			arr.push(filePath);
			bucketMap.set(bucket, arr);
		}
		for (const [bucket, paths] of bucketMap.entries()) {
			if (paths.length === 0) continue;
			const remove = await supabase.storage.from(bucket).remove(paths);
			if (remove.error) {
				console.error(
					'Error deleting action attachment files:',
					remove.error
				);
			}
		}
	}

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

export async function replaceGoalCategory(params: {
	from: string;
	to: string;
}) {
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
		.select(
			'id, title, description, start_date, end_date, success_criteria, stop_criteria, status, priority, category'
		)
		.eq('id', goalId)
		.eq('owner_id', userId)
		.maybeSingle();

	if (!goal && !error) {
		const fallback = await supabase
			.from('goals')
			.select(
				'id, title, description, start_date, end_date, success_criteria, stop_criteria, status, priority, category'
			)
			.eq('id', goalId)
			.eq('user_id', userId)
			.maybeSingle();
		goal = fallback.data;
		error = fallback.error;
	}
	if (error || !goal) throw new Error('operation_failed');

	let { data: actions, error: actionsError } = await supabase
		.from('actions')
		.select(
			'id, title, description, type, priority, completed, start_date, end_date'
		)
		.eq('goal_id', goalId)
		.eq('owner_id', userId)
		.order('completed', { ascending: true })
		.order('priority', { ascending: false })
		.order('start_date', { ascending: true });

	if (actionsError) {
		const fallback = await supabase
			.from('actions')
			.select(
				'id, title, description, type, priority, completed, start_date, end_date'
			)
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

	const snapshot = await fetchGoalForShare({
		supabase,
		userId: user.id,
		goalId
	});
	const token = crypto.randomUUID();
	const expiresAt = new Date(
		Date.now() + 1000 * 60 * 60 * 24 * 30
	).toISOString(); // 30 days

	const { error } = await supabase.from('goal_shares').upsert(
		{
			owner_id: user.id,
			goal_id: goalId,
			token,
			snapshot,
			revoked_at: null,
			expires_at: expiresAt
		},
		{ onConflict: 'owner_id,goal_id' }
	);

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
