import { createInboxItem } from '@/app/(authenticated)/inbox/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type en from '@/i18n/en.json'

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
	const title = dict?.inbox?.cardTitle ?? 'Inbox'
	const subtitle = dict?.inbox?.cardSubtitle ?? 'Capture quick thoughts and convert them to actions later.'
	const createLabel = dict?.inbox?.create ?? 'Add'
	const contentPlaceholder = dict?.inbox?.contentPlaceholder ?? 'What’s on your mind?'
	const notePlaceholder = dict?.inbox?.notePlaceholder ?? 'Optional note'
	const tagsPlaceholder = dict?.inbox?.tagsPlaceholder ?? 'Tags (comma separated)'
	const openLabel = dict?.inbox?.openCountLabel ?? 'Open'

	return (
		<div className="rounded-2xl border border-border/40 bg-background/50 backdrop-blur-xl p-4 space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="text-base font-semibold">{title}</div>
					<div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
				</div>
				<div className="shrink-0 text-xs text-muted-foreground">
					{openLabel} {openCount}
				</div>
			</div>

			<form action={createInboxItem} className="space-y-2">
				<Input name="content" placeholder={contentPlaceholder} required />
				<Textarea name="note" placeholder={notePlaceholder} className="min-h-[80px]" />
				<Input name="tags" placeholder={tagsPlaceholder} />
				<div className="flex justify-end">
					<Button type="submit" size="sm">{createLabel}</Button>
				</div>
			</form>

			{recentItems.length > 0 ? (
				<div className="space-y-2">
					<div className="text-xs text-muted-foreground">{dict?.inbox?.recent ?? 'Recent'}</div>
					<div className="space-y-2">
						{recentItems.map((it) => (
							<div key={it.id} className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
								<div className="text-sm">{it.content}</div>
								{it.tags.length > 0 ? (
									<div className="mt-1 flex flex-wrap gap-2">
										{it.tags.slice(0, 6).map((t) => (
											<span
												key={t}
												className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50"
											>
												{t}
											</span>
										))}
									</div>
								) : null}
							</div>
						))}
					</div>
				</div>
			) : null}
		</div>
	)
}
