'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function isKind(v: string): v is 'inspiration' | 'journey' {
	return v === 'inspiration' || v === 'journey'
}

async function assertGoalOwnership(params: {
	supabase: Awaited<ReturnType<typeof createClient>>
	userId: string
	goalId: string
}) {
	const { supabase, userId, goalId } = params

	const { data, error } = await supabase
		.from('goals')
		.select('id')
		.eq('id', goalId)
		.or(`user_id.eq.${userId},owner_id.eq.${userId}`)
		.maybeSingle()

	if (error) throw new Error('operation_failed')
	if (!data?.id) throw new Error('operation_failed')
}

export async function createGoalEntry(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const goal_id = (formData.get('goal_id') as string | null) || ''
	const rawKind = (formData.get('kind') as string | null) || ''
	const content = ((formData.get('content') as string | null) || '').trim()
	const note = ((formData.get('note') as string | null) || '').trim()

	if (!goal_id || !rawKind || !content) throw new Error('missing_fields')
	if (!isKind(rawKind)) throw new Error('operation_failed')

	await assertGoalOwnership({ supabase, userId: user.id, goalId: goal_id })

	const baseData = {
		goal_id,
		kind: rawKind,
		content,
		note,
		status: 'open' as const
	}

	const { error } = await supabase.from('goal_entries').insert({
		...baseData,
		user_id: user.id,
		owner_id: user.id
	})

	if (error) {
		if (error.code === '42703' || error.message?.includes('column')) {
			const { error: error2 } = await supabase.from('goal_entries').insert({
				...baseData,
				user_id: user.id
			})
			if (error2) {
				const { error: error3 } = await supabase.from('goal_entries').insert({
					...baseData,
					owner_id: user.id
				})
				if (error3) throw new Error('operation_failed')
			}
		} else {
			throw new Error('operation_failed')
		}
	}

	revalidatePath(`/goals/${goal_id}`)
}

export async function updateGoalEntry(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const id = (formData.get('id') as string | null) || ''
	const goal_id = (formData.get('goal_id') as string | null) || ''
	const content = ((formData.get('content') as string | null) || '').trim()
	const note = ((formData.get('note') as string | null) || '').trim()

	if (!id || !goal_id || !content) throw new Error('missing_fields')

	await assertGoalOwnership({ supabase, userId: user.id, goalId: goal_id })

	const { error } = await supabase
		.from('goal_entries')
		.update({ content, note })
		.eq('id', id)
		.eq('goal_id', goal_id)
		.eq('owner_id', user.id)
		.eq('status', 'open')

	if (error) {
		if (error.code === '42703' || error.message?.includes('column')) {
			const { error: legacyError } = await supabase
				.from('goal_entries')
				.update({ content, note })
				.eq('id', id)
				.eq('goal_id', goal_id)
				.eq('user_id', user.id)
				.eq('status', 'open')
			if (legacyError) throw new Error('operation_failed')
		} else {
			throw new Error('operation_failed')
		}
	}

	revalidatePath(`/goals/${goal_id}`)
}

export async function archiveGoalEntry(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const id = (formData.get('id') as string | null) || ''
	const goal_id = (formData.get('goal_id') as string | null) || ''
	if (!id || !goal_id) throw new Error('missing_fields')

	const { error } = await supabase
		.from('goal_entries')
		.update({ status: 'archived' })
		.eq('id', id)
		.eq('owner_id', user.id)

	if (error) {
		if (error.code === '42703' || error.message?.includes('column')) {
			const { error: legacyError } = await supabase
				.from('goal_entries')
				.update({ status: 'archived' })
				.eq('id', id)
				.eq('user_id', user.id)
			if (legacyError) throw new Error('operation_failed')
		} else {
			throw new Error('operation_failed')
		}
	}

	revalidatePath(`/goals/${goal_id}`)
}

export async function deleteGoalEntry(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const id = (formData.get('id') as string | null) || ''
	const goal_id = (formData.get('goal_id') as string | null) || ''
	if (!id || !goal_id) throw new Error('missing_fields')

	const { error } = await supabase
		.from('goal_entries')
		.delete()
		.eq('id', id)
		.eq('owner_id', user.id)

	if (error) {
		if (error.code === '42703' || error.message?.includes('column')) {
			const { error: legacyError } = await supabase
				.from('goal_entries')
				.delete()
				.eq('id', id)
				.eq('user_id', user.id)
			if (legacyError) throw new Error('operation_failed')
		} else {
			throw new Error('operation_failed')
		}
	}

	revalidatePath(`/goals/${goal_id}`)
}

export async function convertGoalEntryToAction(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const entry_id = (formData.get('entry_id') as string | null) || ''
	const goal_id = (formData.get('goal_id') as string | null) || ''
	const title = ((formData.get('title') as string | null) || '').trim()
	const description = ((formData.get('description') as string | null) || '').trim()
	const rawType = (formData.get('type') as string | null) || ''
	const type = rawType || 'core'
	const priority = ((formData.get('priority') as string | null) || '').trim() || 'medium'
	const start_date = (formData.get('start_date') as string | null) || ''
	const end_date = (formData.get('end_date') as string | null) || ''

	if (!entry_id || !goal_id || !title || !start_date || !end_date)
		throw new Error('missing_fields')
	if (new Date(end_date) < new Date(start_date)) throw new Error('invalid_date_range')

	await assertGoalOwnership({ supabase, userId: user.id, goalId: goal_id })

	const baseActionData = {
		goal_id,
		title,
		description,
		type,
		priority,
		start_date,
		end_date,
		completed: false
	}

	const { data, error } = await supabase
		.from('actions')
		.insert({
			...baseActionData,
			user_id: user.id,
			owner_id: user.id
		})
		.select('id')
		.single()

	let actionId: string | null = data?.id ?? null

	if (error) {
		if (error.code === '42703' || error.message?.includes('column')) {
			const { data: legacyData, error: legacyError } = await supabase
				.from('actions')
				.insert({
					...baseActionData,
					user_id: user.id
				})
				.select('id')
				.single()
			if (legacyError) {
				const { data: futureData, error: futureError } = await supabase
					.from('actions')
					.insert({
						...baseActionData,
						owner_id: user.id
					})
					.select('id')
					.single()
				if (futureError) throw new Error('operation_failed')
				actionId = futureData?.id ?? null
			} else {
				actionId = legacyData?.id ?? null
			}
		} else {
			throw new Error('operation_failed')
		}
	}

	if (!actionId) throw new Error('operation_failed')

	const { error: updateError } = await supabase
		.from('goal_entries')
		.update({ status: 'archived', converted_action_id: actionId })
		.eq('id', entry_id)
		.eq('owner_id', user.id)
		.eq('goal_id', goal_id)
		.eq('status', 'open')

	if (updateError) {
		if (updateError.code === '42703' || updateError.message?.includes('column')) {
			const { error: legacyUpdateError } = await supabase
				.from('goal_entries')
				.update({ status: 'archived', converted_action_id: actionId })
				.eq('id', entry_id)
				.eq('user_id', user.id)
				.eq('goal_id', goal_id)
				.eq('status', 'open')
			if (legacyUpdateError) throw new Error('operation_failed')
		} else {
			throw new Error('operation_failed')
		}
	}

	revalidatePath('/today')
	revalidatePath('/dashboard')
	revalidatePath(`/goals/${goal_id}`)
}
