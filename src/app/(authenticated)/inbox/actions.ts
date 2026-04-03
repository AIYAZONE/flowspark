'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function parseTags(raw: string): string[] {
	const parts = raw
		.split(',')
		.map((v) => v.trim())
		.filter(Boolean)

	const seen = new Set<string>()
	const out: string[] = []
	for (const t of parts) {
		const key = t.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		out.push(t)
	}
	return out
}

export async function createInboxItem(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const content = (formData.get('content') as string | null)?.trim() || ''
	const note = (formData.get('note') as string | null)?.trim() || ''
	const rawTags = (formData.get('tags') as string | null) || ''
	const tags = parseTags(rawTags)

	if (!content) throw new Error('missing_fields')

	const { error } = await supabase.from('inbox_items').insert({
		user_id: user.id,
		owner_id: user.id,
		content,
		note,
		tags,
		status: 'open'
	})

	if (error) throw new Error('operation_failed')

	revalidatePath('/today')
	revalidatePath('/dashboard')
	revalidatePath('/inbox')
}

export async function archiveInboxItem(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const id = (formData.get('id') as string | null) || ''
	if (!id) throw new Error('missing_fields')

	const { error } = await supabase
		.from('inbox_items')
		.update({ status: 'archived' })
		.eq('id', id)
		.eq('owner_id', user.id)

	if (error) throw new Error('operation_failed')

	revalidatePath('/today')
	revalidatePath('/dashboard')
	revalidatePath('/inbox')
}

export async function deleteInboxItem(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const id = (formData.get('id') as string | null) || ''
	if (!id) throw new Error('missing_fields')

	const { error } = await supabase
		.from('inbox_items')
		.delete()
		.eq('id', id)
		.eq('owner_id', user.id)

	if (error) throw new Error('operation_failed')

	revalidatePath('/today')
	revalidatePath('/dashboard')
	revalidatePath('/inbox')
}

export async function convertInboxItemToAction(formData: FormData) {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) throw new Error('unauthenticated')

	const inbox_id = (formData.get('inbox_id') as string | null) || ''
	const goal_id = (formData.get('goal_id') as string | null) || ''
	const title = ((formData.get('title') as string | null) || '').trim()
	const description = ((formData.get('description') as string | null) || '').trim()
	const rawType = (formData.get('type') as string | null) || ''
	const type = rawType || 'core'
	const priority = ((formData.get('priority') as string | null) || '').trim() || 'medium'
	const start_date = (formData.get('start_date') as string | null) || ''
	const end_date = (formData.get('end_date') as string | null) || ''

	if (!inbox_id || !goal_id || !title || !start_date || !end_date) throw new Error('missing_fields')

	const baseData = {
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
			...baseData,
			user_id: user.id,
			owner_id: user.id
		})
		.select('id')
		.single()

	if (error) {
		if (error.code === '42703' || error.message?.includes('column')) {
			const { data: legacyData, error: legacyError } = await supabase
				.from('actions')
				.insert({
					...baseData,
					user_id: user.id
				})
				.select('id')
				.single()
			if (legacyError) throw new Error('operation_failed')

			const { error: updateError } = await supabase
				.from('inbox_items')
				.update({ status: 'archived', converted_action_id: legacyData?.id ?? null })
				.eq('id', inbox_id)
				.eq('owner_id', user.id)
				.eq('status', 'open')
			if (updateError) throw new Error('operation_failed')
		} else {
			throw new Error('operation_failed')
		}
	} else {
		const { error: updateError } = await supabase
			.from('inbox_items')
			.update({ status: 'archived', converted_action_id: data?.id ?? null })
			.eq('id', inbox_id)
			.eq('owner_id', user.id)
			.eq('status', 'open')
		if (updateError) throw new Error('operation_failed')
	}

	revalidatePath('/today')
	revalidatePath('/dashboard')
	revalidatePath('/inbox')
	revalidatePath(`/goals/${goal_id}`)
}
