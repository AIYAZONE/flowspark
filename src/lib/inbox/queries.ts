import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

export type InboxStatus = 'open' | 'archived'

export type InboxItemRow = {
	id: string
	content: string
	note: string
	tags: string[]
	status: InboxStatus
	created_at: string
}

export async function listInboxItems({
	supabase,
	userId,
	status,
	limit
}: {
	supabase: SupabaseClient
	userId: string
	status: InboxStatus
	limit: number
}): Promise<InboxItemRow[]> {
	if (limit < 1 || limit > 50) throw new Error('invalid_limit')

	const { data, error } = await supabase
		.from('inbox_items')
		.select('id, content, note, tags, status, created_at')
		.eq('owner_id', userId)
		.eq('status', status)
		.order('created_at', { ascending: false })
		.limit(limit)

	if (error) throw new Error('operation_failed')

	return (data || []).map((row) => ({
		id: row.id as string,
		content: row.content as string,
		note: (row.note as string) || '',
		tags: (row.tags as string[]) || [],
		status: row.status as InboxStatus,
		created_at: row.created_at as string
	}))
}

export async function getInboxCounts({
	supabase,
	userId
}: {
	supabase: SupabaseClient
	userId: string
}): Promise<{ open: number; archived: number }> {
	const { count: openCount, error: openError } = await supabase
		.from('inbox_items')
		.select('id', { count: 'exact', head: true })
		.eq('owner_id', userId)
		.eq('status', 'open')

	if (openError) throw new Error('operation_failed')

	const { count: archivedCount, error: archivedError } = await supabase
		.from('inbox_items')
		.select('id', { count: 'exact', head: true })
		.eq('owner_id', userId)
		.eq('status', 'archived')

	if (archivedError) throw new Error('operation_failed')

	return { open: openCount ?? 0, archived: archivedCount ?? 0 }
}

