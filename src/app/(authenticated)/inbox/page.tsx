import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { InboxCard } from '@/components/InboxCard'
import { InboxItemRow } from '@/components/InboxItemRow'

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

export default async function InboxPage() {
	const supabase = await createClient()
	const dict = await getDictionary()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) return null

	const tz = await getUserTimezone(supabase, user.id)
	const startDefault = getTodayInTZ(tz)
	const endDefault = addDaysFromDateString(startDefault, 7)

	const { data: activeGoals } = await supabase
		.from('goals')
		.select('id, title')
		.eq('status', 'active')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })

	const { data: inboxItems } = await supabase
		.from('inbox_items')
		.select('id, content, note, tags, status, created_at')
		.eq('owner_id', user.id)
		.eq('status', 'open')
		.order('created_at', { ascending: false })
		.limit(50)

	const { count: inboxOpenCountRaw } = await supabase
		.from('inbox_items')
		.select('id', { count: 'exact', head: true })
		.eq('owner_id', user.id)
		.eq('status', 'open')

	const inboxOpenCount = inboxOpenCountRaw ?? 0

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{dict.inbox.title}</h1>
					<div className="text-sm text-muted-foreground mt-1">{dict.inbox.subtitle}</div>
				</div>
			</div>

			<div className="grid gap-6">
				<InboxCard
					dict={dict}
					openCount={inboxOpenCount}
					recentItems={(inboxItems || []).slice(0, 3).map((it) => ({
						id: it.id as string,
						content: it.content as string,
						tags: (it.tags as string[]) || []
					}))}
				/>

				<div className="space-y-3">
					{(inboxItems || []).length === 0 ? (
						<div className="text-sm text-muted-foreground">{dict.inbox.empty}</div>
					) : (
						(inboxItems || []).map((item) => (
							<InboxItemRow
								key={item.id as string}
								item={{
									id: item.id as string,
									content: item.content as string,
									note: (item.note as string) || '',
									tags: (item.tags as string[]) || [],
									created_at: item.created_at as string
								}}
								activeGoals={(activeGoals || []).map((g) => ({ id: g.id as string, title: g.title as string }))}
								dict={dict}
								startDefault={startDefault}
								endDefault={endDefault}
							/>
						))
					)}
				</div>
			</div>
		</div>
	)
}
