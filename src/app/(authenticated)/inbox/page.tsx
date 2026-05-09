import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { InboxCard } from '@/components/InboxCard'
import { InboxItemRow } from '@/components/InboxItemRow'
import { cn } from '@/lib/utils'

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

	const { data: inboxItems } = await supabase
		.from('inbox_items')
		.select('id, content, note, tags, status, created_at')
		.eq('owner_id', user.id)
		.eq('status', activeTab)
		.order('created_at', { ascending: false })
		.limit(50)

	const { count: inboxOpenCountRaw } = await supabase
		.from('inbox_items')
		.select('id', { count: 'exact', head: true })
		.eq('owner_id', user.id)
		.eq('status', 'open')
	const { count: inboxArchivedCountRaw } = await supabase
		.from('inbox_items')
		.select('id', { count: 'exact', head: true })
		.eq('owner_id', user.id)
		.eq('status', 'archived')

	const inboxOpenCount = inboxOpenCountRaw ?? 0
	const inboxArchivedCount = inboxArchivedCountRaw ?? 0

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{dict.inbox.title}</h1>
					<div className="text-sm text-muted-foreground mt-1">{dict.inbox.subtitle}</div>
				</div>
			</div>
			<div className="inline-flex items-center rounded-full border border-border bg-muted/30 p-1">
				<a
					href="/inbox?tab=open"
					className={cn(
						'rounded-full px-3 py-1.5 text-sm transition-colors',
						activeTab === 'open' ? 'bg-background font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
					)}
				>
					{dict.inbox.tabOpen} ({inboxOpenCount})
				</a>
				<a
					href="/inbox?tab=archived"
					className={cn(
						'rounded-full px-3 py-1.5 text-sm transition-colors',
						activeTab === 'archived' ? 'bg-background font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
					)}
				>
					{dict.inbox.tabArchived} ({inboxArchivedCount})
				</a>
			</div>

			<div className="grid min-w-0 gap-6">
				{activeTab === 'open' ? (
					<InboxCard
						dict={dict}
						openCount={inboxOpenCount}
						showViewAll={false}
						recentItems={(inboxItems || []).slice(0, 3).map((it) => ({
							id: it.id as string,
							content: it.content as string,
							tags: (it.tags as string[]) || []
						}))}
					/>
				) : null}

				<div className="min-w-0 space-y-3">
					<div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
						<div className="text-sm font-medium">{activeTab === 'open' ? dict.inbox.listTitle : dict.inbox.tabArchived}</div>
						<div className="mt-0.5 text-xs text-muted-foreground">{dict.inbox.listHint}</div>
					</div>
					{(inboxItems || []).length === 0 ? (
						<div className="text-sm text-muted-foreground">{activeTab === 'open' ? dict.inbox.empty : dict.inbox.archivedEmpty}</div>
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
								mode={activeTab}
							/>
						))
					)}
				</div>
			</div>
		</div>
	)
}
