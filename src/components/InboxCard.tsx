'use client'

import Link from 'next/link'
import type en from '@/i18n/en.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Dict = typeof en

export function InboxCard({
	dict,
	openCount,
	recentItems,
	showViewAll = true
}: {
	dict: Dict
	openCount: number
	recentItems: { id: string; content: string; tags: string[] }[]
	showViewAll?: boolean
}) {
	const topItem = recentItems[0] ?? null
	const remainingCount = Math.max(openCount - 1, 0)

	return (
		<Card className="w-full min-w-0 max-w-full">
			<CardHeader className="w-full min-w-0 max-w-full pb-4">
				<div className="flex w-full min-w-0 max-w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
					<CardTitle className="text-xl">{dict.inbox.cardTitle}</CardTitle>
					{showViewAll ? (
						<Link href="/inbox" className="text-sm text-muted-foreground hover:text-foreground">
							{dict.inbox.viewAll}
						</Link>
					) : null}
				</div>
				<div className="text-xs text-muted-foreground">{dict.inbox.summaryHint}</div>
			</CardHeader>
			<CardContent className="w-full min-w-0 max-w-full space-y-3">
				<div className="text-sm">
					<span className="font-medium">{openCount}</span>{' '}
					<span className="text-muted-foreground">{dict.inbox.openCountSuffix}</span>
				</div>
				{!topItem ? (
					<div className="text-sm text-muted-foreground">{dict.inbox.empty}</div>
				) : (
					<div className="space-y-2">
						<div className="min-w-0 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
							<div className="text-xs text-muted-foreground">{dict.inbox.latestLabel}</div>
							<div className="mt-1 text-sm font-medium truncate">{topItem.content}</div>
							{topItem.tags.length > 0 ? (
								<div className="mt-1 flex flex-wrap gap-1">
									{topItem.tags.slice(0, 3).map((t) => (
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
						{remainingCount > 0 ? (
							<div className="text-xs text-muted-foreground">
								{dict.inbox.moreItemsHint.replace('{count}', String(remainingCount))}
							</div>
						) : null}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
