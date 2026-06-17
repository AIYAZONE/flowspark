import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'

import { GoalDetailResponsiveLayout } from '@/components/GoalDetailResponsiveLayout'

function addDaysFromDateString(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + days)
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'UTC',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(d)
}

interface PageProps {
    params: Promise<{ id: string }>
}

type RawGoalEntry = {
	id: string
	kind: string
	status: string | null
	content: string
	note: string | null
	created_at: string
}

export default async function GoalDetailPage({ params }: PageProps) {
    const { id } = await params

    const supabase = await createClient()
    const [dict, { data: { user } }] = await Promise.all([
		getDictionary(),
		supabase.auth.getUser()
	])

    if (!user) return null

	const goalEntriesPromise = (async (): Promise<RawGoalEntry[]> => {
		const { data, error } = await supabase
			.from('goal_entries')
			.select('id, kind, status, content, note, created_at')
			.eq('goal_id', id)
			.eq('kind', 'journey')
			.eq('owner_id', user.id)
			.order('created_at', { ascending: false })

		if (error && (error.code === '42703' || error.message?.includes('column'))) {
			const { data: legacyData } = await supabase
				.from('goal_entries')
				.select('id, kind, status, content, note, created_at')
				.eq('goal_id', id)
				.eq('kind', 'journey')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })
			return legacyData || []
		}

		return data || []
	})()

	const [
		{ data: goal },
		{ data: activeGoals },
		{ data: actions },
		{ data: shareData },
		{ data: calendarFeedData },
		tz,
		goalEntries
	] = await Promise.all([
		supabase
			.from('goals')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single(),
		supabase
			.from('goals')
			.select('id, title')
			.eq('user_id', user.id)
			.eq('status', 'active')
			.order('created_at', { ascending: false }),
		supabase
			.from('actions')
			.select(`
				*,
				action_sub_items (
					id,
					title,
					completed,
					sort_order
				)
			`)
			.eq('goal_id', id)
			.eq('user_id', user.id)
			.order('completed', { ascending: true })
			.order('priority', { ascending: false })
			.order('start_date', { ascending: false }),
		supabase
			.from('goal_shares')
			.select('token, expires_at, revoked_at')
			.eq('goal_id', id)
			.eq('owner_id', user.id)
			.maybeSingle(),
		supabase
			.from('calendar_feeds')
			.select('token, expires_at, revoked_at')
			.eq('owner_id', user.id)
			.eq('scope', 'goal')
			.eq('goal_id', id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle(),
		getUserTimezone(supabase, user.id),
		goalEntriesPromise
	])

	if (!goal) return <div>{dict.goals.detail.notFound}</div>

	const startDefault = getTodayInTZ(tz)
	const endDefault = addDaysFromDateString(startDefault, 7)

	const mappedEntries = (goalEntries || []).map((e) => ({
		id: e.id as string,
		kind: e.kind as 'inspiration' | 'journey',
		status: (e.status as 'open' | 'archived' | null) || 'open',
		content: e.content as string,
		note: (e.note as string) || '',
		created_at: e.created_at as string
	}))

	return (
		<GoalDetailResponsiveLayout
			goal={goal}
			actions={actions || []}
			entries={mappedEntries}
			dict={dict}
			activeGoals={(activeGoals || []).map((g) => ({ id: g.id as string, title: g.title as string }))}
			shareInfo={{
				token: (shareData?.revoked_at ? null : (shareData?.token as string | null)) || null,
				expiresAt: (shareData?.expires_at as string | null) || null
			}}
			calendarFeedInfo={{
				token:
					(calendarFeedData?.revoked_at
						? null
						: (calendarFeedData?.token as string | null)) || null,
				expiresAt: (calendarFeedData?.expires_at as string | null) || null
			}}
			tzDefaults={{ startDefault, endDefault }}
		/>
	)
}
