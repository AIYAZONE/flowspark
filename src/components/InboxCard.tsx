import Link from 'next/link'
import type en from '@/i18n/en.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Dict = typeof en

export function InboxCard({
	dict,
	openCount,
	recentItems
}: {
	dict: Dict
	openCount: number
	recentItems: { id: string; content: string; tags: string[] }[]
}) {
	return (
		<Card>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between gap-4">
					<CardTitle className="text-xl">{dict.inbox.cardTitle}</CardTitle>
					<Link href="/inbox" className="text-sm text-muted-foreground hover:text-foreground">
						{dict.inbox.viewAll}
					</Link>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="text-sm">
					<span className="font-medium">{openCount}</span>{' '}
					<span className="text-muted-foreground">{dict.inbox.openCountSuffix}</span>
				</div>
				{recentItems.length === 0 ? (
					<div className="text-sm text-muted-foreground">{dict.inbox.empty}</div>
				) : (
					<div className="space-y-2">
						{recentItems.map((it) => (
							<div key={it.id} className="min-w-0">
								<div className="text-sm font-medium truncate">{it.content}</div>
								{it.tags.length > 0 ? (
									<div className="mt-1 flex flex-wrap gap-1">
										{it.tags.slice(0, 3).map((t) => (
											<span
												key={t}
												className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
											>
												{t}
											</span>
										))}
									</div>
								) : null}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
