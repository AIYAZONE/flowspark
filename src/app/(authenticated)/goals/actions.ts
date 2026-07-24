'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setRecommendationCompletion } from '@/lib/ai/recommendationStore';
import {
	buildAITodayPlanNote,
	mergeAITodayPlanIntoDescription
} from '@/lib/aiTodayPlan';
import { createClient } from '@/lib/supabase/server';
import { normalizeCategoryInput } from '@/lib/goalCategories';
import { upsertBehaviorSnapshot } from '@/lib/snapshots';
import {
	getUpcomingRecurringDate,
	isActionRecurrenceRule,
	serializeActionRecurrenceDescription,
	type ActionRecurrenceParams
} from '@/lib/actionRecurrence';
import {
	isOwnershipColumnMissingError,
	queryWithOwnershipFallback,
	type OwnershipColumn
} from '@/lib/ownership';
import { getTodayInTZ, getUserTimezone } from '@/lib/time';

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

type MutationResult<T = unknown> = {
	data?: T | null;
	error: { message?: string; code?: string } | null;
};

function isSchemaFallbackError(
	error?: { message?: string; code?: string } | null
) {
	return Boolean(
		error &&
			(error.message?.includes('Could not find') ||
				isOwnershipColumnMissingError(error))
	);
}

async function runSchemaFallbackAttempts<T>(
	attempts: Array<() => PromiseLike<MutationResult<T>>>
) {
	let lastResult: MutationResult<T> = { data: null, error: null };

	for (let index = 0; index < attempts.length; index += 1) {
		const result = await attempts[index]();
		if (!result.error) return result;
		lastResult = result;
		if (!isSchemaFallbackError(result.error)) return result;
	}

	return lastResult;
}

async function runOwnershipMutationWithFallback<T>(params: {
	primary: OwnershipColumn;
	fallback: OwnershipColumn;
	fallbackOnAnyError?: boolean;
	execute: (ownershipColumn: OwnershipColumn) => PromiseLike<MutationResult<T>>;
}) {
	const primaryResult = await params.execute(params.primary);
	if (!primaryResult.error) return primaryResult;
	if (
		!params.fallbackOnAnyError &&
		!isOwnershipColumnMissingError(primaryResult.error)
	) {
		return primaryResult;
	}
	return params.execute(params.fallback);
}

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
	const result = await runSchemaFallbackAttempts<Record<string, unknown>>([
		async () =>
			(await runInsert({
				...payload,
				user_id: userId,
				owner_id: userId
			})) as MutationResult<Record<string, unknown>>,
		async () =>
			(await runInsert({
				...payload,
				user_id: userId
			})) as MutationResult<Record<string, unknown>>,
		async () =>
			(await runInsert({
				...payload,
				owner_id: userId
			})) as MutationResult<Record<string, unknown>>
	]);

	if (result.error) throw result.error;
	return { data: result.data ?? null };
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
	const result = await runSchemaFallbackAttempts([
		async () => supabase.from('action_sub_items').insert(payload),
		async () =>
			supabase.from('action_sub_items').insert(
				payload.map((item) => ({
					action_id: item.action_id,
					title: item.title,
					completed: item.completed,
					sort_order: item.sort_order,
					user_id: item.user_id
				}))
			),
		async () =>
			supabase.from('action_sub_items').insert(
				payload.map((item) => ({
					action_id: item.action_id,
					title: item.title,
					completed: item.completed,
					sort_order: item.sort_order,
					owner_id: item.owner_id
				}))
			)
	]);
	if (result.error) throw result.error;
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
	const result = await runSchemaFallbackAttempts([
		async () => supabase.from('action_attachments').insert(payload),
		async () =>
			supabase.from('action_attachments').insert(
				payload.map((item) => ({
					action_id: item.action_id,
					file_path: item.file_path,
					public_url: item.public_url,
					mime_type: item.mime_type,
					size_bytes: item.size_bytes,
					bucket: item.bucket,
					user_id: item.user_id
				}))
			),
		async () =>
			supabase.from('action_attachments').insert(
				payload.map((item) => ({
					action_id: item.action_id,
					file_path: item.file_path,
					public_url: item.public_url,
					mime_type: item.mime_type,
					size_bytes: item.size_bytes,
					bucket: item.bucket,
					owner_id: item.owner_id
				}))
			)
	]);
	if (result.error) throw result.error;
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

	const createGoalResult = await runSchemaFallbackAttempts([
		async () =>
			supabase.from('goals').insert({
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
			}),
		async () =>
			supabase.from('goals').insert({
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
	]);

	if (createGoalResult.error) {
		console.error('Error creating goal:', createGoalResult.error);
		throw new Error('operation_failed');
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

	const updateStatusResult = await runOwnershipMutationWithFallback({
		primary: 'owner_id',
		fallback: 'user_id',
		execute: (ownershipColumn) =>
			supabase
				.from('goals')
				.update({ status })
				.eq('id', id)
				.eq(ownershipColumn, user.id)
	});

	if (updateStatusResult.error) {
		console.error('Error updating goal status:', updateStatusResult.error);
		throw new Error(
			`Update failed: ${updateStatusResult.error.message} (Code: ${updateStatusResult.error.code})`
		);
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

	const toggleStarResult = await runOwnershipMutationWithFallback({
		primary: 'owner_id',
		fallback: 'user_id',
		execute: (ownershipColumn) =>
			supabase
				.from('goals')
				.update({ is_starred: isStarred })
				.eq('id', id)
				.eq(ownershipColumn, user.id)
	});

	if (toggleStarResult.error) {
		console.error('Error toggling goal star:', toggleStarResult.error);
		throw new Error('Update failed');
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
	const createGoalResult = await runSchemaFallbackAttempts<
		{ id?: string; title?: string }
	>([
		async () =>
			(await supabase
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
				.single()) as MutationResult<{ id?: string; title?: string }>,
		async () =>
			(await supabase
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
				.single()) as MutationResult<{ id?: string; title?: string }>
	]);

	if (createGoalResult.error) {
		console.error('Error creating goal:', createGoalResult.error);
		throw new Error('operation_failed');
	}

	revalidatePath('/goals');
	return {
		success: true,
		goalId: createGoalResult.data?.id as string | undefined,
		title: createGoalResult.data?.title as string | undefined
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
	const repeat_rule = (formData.get('repeat_rule') as string | null) || 'none';
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
		description: serializeActionRecurrenceDescription(
			description || '',
			isActionRecurrenceRule(repeat_rule) ? repeat_rule : 'none'
		),
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
	revalidatePath('/system');
	revalidatePath('/today');
	revalidatePath(`/goals/${goal_id}`);
	await upsertBehaviorSnapshot({
		supabase,
		userId: user.id,
		snapshotDate: start_date
	});
	return { actionId: createdActionId };
}

export async function createAction(formData: FormData): Promise<void> {
	await createActionAndReturnId(formData);
}

export async function applyAITodayPlanToExistingAction(formData: FormData) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) throw new Error('User not authenticated');

	const actionId = formData.get('action_id') as string;
	const ai_recommendation_id =
		(formData.get('ai_recommendation_id') as string | null) || null;
	const firstStep = (formData.get('first_step') as string) || '';
	const definitionOfDone =
		(formData.get('definition_of_done') as string) || '';
	const reason = (formData.get('reason') as string) || '';
	const variantLabel = (formData.get('variant_label') as string) || '';
	const sourceActionTitle =
		(formData.get('source_action_title') as string | null) || null;
	const locale =
		String(formData.get('locale') || '').toLowerCase().startsWith('zh')
			? 'zh'
			: 'en';

	if (
		!actionId ||
		!ai_recommendation_id ||
		!firstStep ||
		!definitionOfDone ||
		!reason ||
		!variantLabel
	) {
		throw new Error('Missing required fields');
	}

	let { data: action, error } = await supabase
		.from('actions')
		.select('id, goal_id, title, description, type, priority, start_date, end_date')
		.eq('id', actionId)
		.eq('user_id', user.id)
		.maybeSingle();

	if (!action && !error) {
		const fallback = await supabase
			.from('actions')
			.select(
				'id, goal_id, title, description, type, priority, start_date, end_date'
			)
			.eq('id', actionId)
			.eq('owner_id', user.id)
			.maybeSingle();
		action = fallback.data;
		error = fallback.error;
	}

	if (error) throw new Error('operation_failed');
	if (!action) throw new Error('operation_failed');

	const note = buildAITodayPlanNote({
		locale,
		variantLabel,
		sourceActionTitle: sourceActionTitle || action.title || null,
		firstStep,
		definitionOfDone,
		reason
	});

	const description = mergeAITodayPlanIntoDescription({
		existingDescription:
			typeof action.description === 'string' ? action.description : '',
		note
	});
	const payload = {
		description,
		type: 'core',
		ai_recommendation_id
	};

	const updateActionResult = await runOwnershipMutationWithFallback({
		primary: 'user_id',
		fallback: 'owner_id',
		execute: (ownershipColumn) =>
			supabase
				.from('actions')
				.update(payload)
				.eq('id', actionId)
				.eq(ownershipColumn, user.id)
	});

	if (updateActionResult.error) throw new Error('operation_failed');

	revalidatePath('/dashboard');
	revalidatePath('/system');
	revalidatePath('/today');
	revalidatePath('/goals');
	if (action.goal_id) revalidatePath(`/goals/${action.goal_id}`);
	await upsertBehaviorSnapshot({
		supabase,
		userId: user.id,
		snapshotDate: action.start_date as string
	});
	return { actionId };
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
	const repeat_rule = (formData.get('repeat_rule') as string | null) || 'none';
	const recurrence = isActionRecurrenceRule(repeat_rule) ? repeat_rule : 'none';
	let start_date = (formData.get('start_date') as string) || '';
	let end_date = (formData.get('end_date') as string) || '';
	let ruleParams: ActionRecurrenceParams | undefined = undefined;
	if (recurrence !== 'none') {
		const tz = await getUserTimezone(supabase, user.id);
		const today = getTodayInTZ(tz);
		if (recurrence === 'weekly') {
			const weekdayRaw = formData.get('repeat_weekday');
			const weekday = Number(weekdayRaw);
			ruleParams = Number.isFinite(weekday) && weekday >= 1 && weekday <= 7 ? { weekday } : undefined;
		}
		if (recurrence === 'monthly') {
			const monthdayRaw = formData.get('repeat_monthday');
			const monthday = Number(monthdayRaw);
			const params: ActionRecurrenceParams = { missing: 'clamp' };
			if (Number.isFinite(monthday) && monthday >= 1 && monthday <= 31) params.monthday = monthday;
			ruleParams = params;
		}
		const upcoming = getUpcomingRecurringDate({ today, recurrence, ruleParams });
		start_date = upcoming.startDate;
		end_date = upcoming.endDate;
	}
	if (!goal_id || !title || (recurrence === 'none' && (!start_date || !end_date))) {
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
				description: serializeActionRecurrenceDescription(
					description,
					recurrence,
					ruleParams
				),
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
	revalidatePath('/system');
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
	const subItemUpdateResult = await runOwnershipMutationWithFallback({
		primary: 'owner_id',
		fallback: 'user_id',
		fallbackOnAnyError: true,
		execute: (ownershipColumn) =>
			supabase
				.from('action_sub_items')
				.update({
					completed: nextCompleted,
					updated_at: new Date().toISOString()
				})
				.eq('id', id)
				.eq(ownershipColumn, user.id)
	});
	if (subItemUpdateResult.error) throw new Error('operation_failed');

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
		const parentUpdateResult = await runOwnershipMutationWithFallback<{
			ai_recommendation_id?: string | null;
		}>({
			primary: 'owner_id',
			fallback: 'user_id',
			fallbackOnAnyError: true,
			execute: async (ownershipColumn) =>
				(await supabase
					.from('actions')
					.update({
						completed: parentCompleted,
						updated_at: new Date().toISOString()
					})
					.eq('id', actionId)
					.eq(ownershipColumn, user.id)
					.select('ai_recommendation_id')
					.maybeSingle()) as MutationResult<{
					ai_recommendation_id?: string | null;
				}>
		});
		if (parentUpdateResult.error) throw new Error('operation_failed');
		const parentRecommendationId =
			(parentUpdateResult.data?.ai_recommendation_id as string | null) ?? null;
		if (parentRecommendationId) {
			await setRecommendationCompletion({
				supabase,
				recommendationId: parentRecommendationId,
				userId: user.id,
				completed: parentCompleted
			});
		}
		await upsertBehaviorSnapshot({
			supabase,
			userId: user.id,
			snapshotDate: new Date().toISOString().slice(0, 10)
		});
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

	const updateGoalResult = await runSchemaFallbackAttempts([
		async () =>
			(await supabase
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
				.eq('owner_id', user.id)) as MutationResult,
		async () =>
			(await supabase
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
				.eq('user_id', user.id)) as MutationResult
	]);

	if (updateGoalResult.error) {
		console.error('Error updating goal:', updateGoalResult.error);
		throw new Error(`Failed to update goal: ${updateGoalResult.error.message}`);
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
	const repeat_rule = (formData.get('repeat_rule') as string | null) || 'none';
	const recurrence = isActionRecurrenceRule(repeat_rule) ? repeat_rule : 'none';
	let start_date = (formData.get('start_date') as string) || '';
	let end_date = (formData.get('end_date') as string) || '';
	let ruleParams: ActionRecurrenceParams | undefined = undefined;
	if (recurrence !== 'none') {
		const tz = await getUserTimezone(supabase, user.id);
		const today = getTodayInTZ(tz);
		if (recurrence === 'weekly') {
			const weekdayRaw = formData.get('repeat_weekday');
			const weekday = Number(weekdayRaw);
			ruleParams = Number.isFinite(weekday) && weekday >= 1 && weekday <= 7 ? { weekday } : undefined;
		}
		if (recurrence === 'monthly') {
			const monthdayRaw = formData.get('repeat_monthday');
			const monthday = Number(monthdayRaw);
			const params: ActionRecurrenceParams = { missing: 'clamp' };
			if (Number.isFinite(monthday) && monthday >= 1 && monthday <= 31) params.monthday = monthday;
			ruleParams = params;
		}
		const upcoming = getUpcomingRecurringDate({ today, recurrence, ruleParams });
		start_date = upcoming.startDate;
		end_date = upcoming.endDate;
	}
	const ai_recommendation_id =
		(formData.get('ai_recommendation_id') as string | null) || null;
	const subItemsUpdate = parseSubItemsForUpdate(formData.get('sub_items'));

	if (!goal_id) throw new Error('Missing required fields');
	if (recurrence === 'none' && end_date && start_date && new Date(end_date) < new Date(start_date)) {
		throw new Error('invalid_date_range');
	}

	const { data: targetGoal, error: targetGoalError } = await queryWithOwnershipFallback({
		execute: (ownershipColumn) => supabase
			.from('goals')
			.select('id')
			.eq('id', goal_id)
			.eq(ownershipColumn, user.id)
			.eq('status', 'active')
			.maybeSingle()
	});

	if (targetGoalError) throw new Error(targetGoalError.message);
	if (!targetGoal) throw new Error('operation_failed');

	const payload = {
		title,
		type,
		priority,
		description: serializeActionRecurrenceDescription(
			description,
			recurrence,
			ruleParams
		),
		start_date,
		end_date,
		goal_id,
		ai_recommendation_id
	};

	const updateActionResult = await runOwnershipMutationWithFallback({
		primary: 'user_id',
		fallback: 'owner_id',
		execute: (ownershipColumn) =>
			supabase
				.from('actions')
				.update(payload)
				.eq('id', id)
				.eq(ownershipColumn, user.id)
	});

	if (updateActionResult.error) throw new Error('operation_failed');

	// Replace sub-items when editor submits sub_items payload.
	if (formData.has('sub_items')) {
		const removeSubItemsResult = await runOwnershipMutationWithFallback({
			primary: 'owner_id',
			fallback: 'user_id',
			fallbackOnAnyError: true,
			execute: (ownershipColumn) =>
				supabase
					.from('action_sub_items')
					.delete()
					.eq('action_id', id)
					.eq(ownershipColumn, user.id)
		});
		if (removeSubItemsResult.error) throw new Error('operation_failed');

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
	await upsertBehaviorSnapshot({
		supabase,
		userId: user.id,
		snapshotDate: start_date
	});
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

	const deleteActionResult = await runOwnershipMutationWithFallback({
		primary: 'owner_id',
		fallback: 'user_id',
		fallbackOnAnyError: true,
		execute: (ownershipColumn) =>
			supabase.from('actions').delete().eq('id', id).eq(ownershipColumn, user.id)
	});

	if (deleteActionResult.error) {
		console.error('Error deleting action:', deleteActionResult.error);
		throw new Error('delete_failed');
	}

	revalidatePath('/dashboard');
	revalidatePath('/system');
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

	const deleteActionsResult = await runOwnershipMutationWithFallback({
		primary: 'user_id',
		fallback: 'owner_id',
		fallbackOnAnyError: true,
		execute: (ownershipColumn) =>
			supabase
				.from('actions')
				.delete()
				.eq('goal_id', id)
				.eq(ownershipColumn, user.id)
	});

	if (deleteActionsResult.error) {
		console.error('Error deleting goal actions:', deleteActionsResult.error);
		throw new Error('delete_failed');
	}

	const deleteGoalResult = await runOwnershipMutationWithFallback({
		primary: 'user_id',
		fallback: 'owner_id',
		fallbackOnAnyError: true,
		execute: (ownershipColumn) =>
			supabase
				.from('goals')
				.delete()
				.eq('id', id)
				.eq(ownershipColumn, user.id)
	});

	if (deleteGoalResult.error) {
		console.error('Error deleting goal:', deleteGoalResult.error);
		throw new Error('delete_failed');
	}

	revalidatePath('/dashboard');
	revalidatePath('/system');
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
	revalidatePath('/system');
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
	entries: Array<{
		id: string;
		kind: 'inspiration' | 'journey';
		status: 'open' | 'archived';
		content: string;
		note?: string | null;
		created_at: string;
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

	let {
		data: entries,
		error: entriesError
	} = await supabase
		.from('goal_entries')
		.select('id, kind, status, content, note, created_at')
		.eq('goal_id', goalId)
		.eq('owner_id', userId)
		.order('created_at', { ascending: false });

	if (entriesError) {
		const fallback = await supabase
			.from('goal_entries')
			.select('id, kind, status, content, note, created_at')
			.eq('goal_id', goalId)
			.eq('user_id', userId)
			.order('created_at', { ascending: false });
		entries = fallback.data;
		entriesError = fallback.error;
	}
	if (entriesError) throw new Error('operation_failed');

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
		})),
		entries: (entries || [])
			.filter(
				(e) =>
					(e.kind === 'inspiration' || e.kind === 'journey') &&
					(e.status === 'open' || e.status === 'archived')
			)
			.map((e) => ({
				id: e.id as string,
				kind: e.kind as 'inspiration' | 'journey',
				status: (e.status as 'open' | 'archived') || 'open',
				content: (e.content as string) || '',
				note: (e.note as string | null) || null,
				created_at: (e.created_at as string) || ''
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

export async function refreshGoalShareSnapshot(goalId: string) {
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

	const { data: existing, error: findError } = await supabase
		.from('goal_shares')
		.select('token, expires_at, revoked_at')
		.eq('goal_id', goalId)
		.eq('owner_id', user.id)
		.maybeSingle();
	if (findError) throw new Error('operation_failed');
	if (!existing?.token || existing.revoked_at) throw new Error('operation_failed');

	const expired =
		Boolean(existing.expires_at) &&
		new Date(existing.expires_at as string).getTime() <= Date.now();
	const nextToken = expired ? crypto.randomUUID() : (existing.token as string);
	const nextExpiresAt = expired
		? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
		: ((existing.expires_at as string | null) || null);

	const { error } = await supabase
		.from('goal_shares')
		.update({
			snapshot,
			token: nextToken,
			expires_at: nextExpiresAt,
			revoked_at: null
		})
		.eq('goal_id', goalId)
		.eq('owner_id', user.id)
		.eq('token', existing.token);
	if (error) throw new Error('operation_failed');

	revalidatePath(`/goals/${goalId}`);
	return {
		token: nextToken,
		expiresAt: nextExpiresAt
	};
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

function isExpired(expiresAt?: string | null) {
	return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export async function createGoalCalendarFeed(goalId: string) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('unauthenticated');
	if (!goalId) throw new Error('missing_fields');

	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

	const { data: existing, error: findError } = await supabase
		.from('calendar_feeds')
		.select('id')
		.eq('owner_id', user.id)
		.eq('scope', 'goal')
		.eq('goal_id', goalId)
		.maybeSingle();

	if (findError) throw new Error('operation_failed');

	if (existing?.id) {
		const { error } = await supabase
			.from('calendar_feeds')
			.update({
				token,
				expires_at: expiresAt,
				revoked_at: null
			})
			.eq('id', existing.id as string);
		if (error) throw new Error('operation_failed');
	} else {
		const { error } = await supabase.from('calendar_feeds').insert({
			owner_id: user.id,
			scope: 'goal',
			goal_id: goalId,
			token,
			expires_at: expiresAt,
			revoked_at: null
		});
		if (error) throw new Error('operation_failed');
	}

	revalidatePath(`/goals/${goalId}`);
	return { token, expiresAt };
}

export async function refreshGoalCalendarFeed(goalId: string) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('unauthenticated');
	if (!goalId) throw new Error('missing_fields');

	const { data: existing, error: findError } = await supabase
		.from('calendar_feeds')
		.select('id, token, expires_at, revoked_at')
		.eq('owner_id', user.id)
		.eq('scope', 'goal')
		.eq('goal_id', goalId)
		.maybeSingle();

	if (findError) throw new Error('operation_failed');
	if (!existing?.id || existing.revoked_at) throw new Error('operation_failed');

	const expired =
		Boolean(existing.expires_at) &&
		isExpired(existing.expires_at as string | null);
	const nextToken = expired ? crypto.randomUUID() : (existing.token as string);
	const nextExpiresAt = expired
		? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
		: ((existing.expires_at as string | null) || null);

	const { error } = await supabase
		.from('calendar_feeds')
		.update({
			token: nextToken,
			expires_at: nextExpiresAt,
			revoked_at: null
		})
		.eq('id', existing.id as string);
	if (error) throw new Error('operation_failed');

	revalidatePath(`/goals/${goalId}`);
	return { token: nextToken, expiresAt: nextExpiresAt };
}

export async function revokeGoalCalendarFeed(goalId: string) {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('unauthenticated');
	if (!goalId) throw new Error('missing_fields');

	const { error } = await supabase
		.from('calendar_feeds')
		.update({ revoked_at: new Date().toISOString() })
		.eq('owner_id', user.id)
		.eq('scope', 'goal')
		.eq('goal_id', goalId);

	if (error) throw new Error('operation_failed');

	revalidatePath(`/goals/${goalId}`);
	return { success: true as const };
}
