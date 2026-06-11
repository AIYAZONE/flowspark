import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { InboxTabsClient } from '@/components/InboxTabsClient'
import { getInboxCounts, listInboxItems } from '@/lib/inbox/queries'

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

type InboxTab = 'open' | 'archived'

export default async function InboxPage({
	searchParams
}: {
	searchParams?: Promise<{ tab?: string | string[] }>
}) {
	const supabase = await createClient()
	const dict = await getDictionary()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) return null

	const tz = await getUserTimezone(supabase, user.id)
	const startDefault = getTodayInTZ(tz)
	const endDefault = addDaysFromDateString(startDefault, 7)
	const resolvedSearchParams = await searchParams
	const tabParam = Array.isArray(resolvedSearchParams?.tab)
		? resolvedSearchParams?.tab[0]
		: resolvedSearchParams?.tab
	const activeTab: InboxTab = tabParam === 'archived' ? 'archived' : 'open'

	const { data: activeGoals } = await supabase
		.from('goals')
		.select('id, title')
		.eq('status', 'active')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })

	const inboxItems50 = await listInboxItems({ supabase, userId: user.id, status: activeTab, limit: 50 })
	const inboxCounts = await getInboxCounts({ supabase, userId: user.id })

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{dict.inbox.title}</h1>
					<div className="text-sm text-muted-foreground mt-1">{dict.inbox.subtitle}</div>
				</div>
			</div>
			<InboxTabsClient
				userId={user.id}
				dict={dict}
				initialTab={activeTab}
				initialItems50={inboxItems50}
				initialCounts={inboxCounts}
				activeGoals={(activeGoals || []).map((g) => ({ id: g.id as string, title: g.title as string }))}
				startDefault={startDefault}
				endDefault={endDefault}
			/>
		</div>
	)
}
