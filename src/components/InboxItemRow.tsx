import type en from '@/i18n/en.json'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { archiveInboxItem, deleteInboxItem } from '@/app/(authenticated)/inbox/actions'
import { ConvertInboxToActionDialog } from '@/components/ConvertInboxToActionDialog'

type Dict = typeof en

export function InboxItemRow({
	item,
	activeGoals,
	dict,
	startDefault,
	endDefault
}: {
	item: { id: string; content: string; note: string; tags: string[]; created_at: string }
	activeGoals: { id: string; title: string }[]
	dict: Dict
	startDefault: string
	endDefault: string
}) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
					<div className="min-w-0 flex-1">
						<div className="text-sm font-medium whitespace-pre-wrap break-words">{item.content}</div>
						{item.tags.length > 0 ? (
							<div className="mt-2 flex flex-wrap gap-1">
								{item.tags.map((t) => (
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

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:shrink-0">
						<ConvertInboxToActionDialog
							item={{ id: item.id, content: item.content, note: item.note, tags: item.tags }}
							activeGoals={activeGoals}
							dict={dict}
							startDefault={startDefault}
							endDefault={endDefault}
							trigger={
								<Button size="sm" className="w-full sm:w-auto">
									{dict.inbox.convertCta}
								</Button>
							}
						/>
						<form action={archiveInboxItem} className="w-full sm:w-auto">
							<input type="hidden" name="id" value={item.id} />
							<Button type="submit" size="sm" variant="outline" className="w-full sm:w-auto">
								{dict.inbox.archive}
							</Button>
						</form>
						<form action={deleteInboxItem} className="w-full sm:w-auto">
							<input type="hidden" name="id" value={item.id} />
							<Button type="submit" size="sm" variant="ghost" className="w-full sm:w-auto">
								{dict.common.delete}
							</Button>
						</form>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
