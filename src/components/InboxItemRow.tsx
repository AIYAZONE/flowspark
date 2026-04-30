import type en from '@/i18n/en.json'
import { Archive, Pencil, Trash2, Undo2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { archiveInboxItem, unarchiveInboxItem } from '@/app/(authenticated)/inbox/actions'
import { ConvertInboxToActionDialog } from '@/components/ConvertInboxToActionDialog'
import { EditInboxItemDialog } from '@/components/EditInboxItemDialog'
import { ConfirmDeleteInboxItemDialog } from '@/components/ConfirmDeleteInboxItemDialog'

type Dict = typeof en

export function InboxItemRow({
	item,
	activeGoals,
	dict,
	startDefault,
	endDefault,
	mode = 'open'
}: {
	item: { id: string; content: string; note: string; tags: string[]; created_at: string }
	activeGoals: { id: string; title: string }[]
	dict: Dict
	startDefault: string
	endDefault: string
	mode?: 'open' | 'archived'
}) {
	const canConvert = mode === 'open' && activeGoals.length > 0

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
						{mode === 'open' ? (
							<ConvertInboxToActionDialog
								item={{ id: item.id, content: item.content, note: item.note, tags: item.tags }}
								activeGoals={activeGoals}
								dict={dict}
								startDefault={startDefault}
								endDefault={endDefault}
								trigger={
									<Button
										size="sm"
										className="w-full sm:w-auto"
										disabled={!canConvert}
										title={!canConvert ? dict.inbox.convertDisabledNoGoal : undefined}
									>
										{dict.inbox.convertCta}
									</Button>
								}
							/>
						) : (
							<form action={unarchiveInboxItem} className="w-full sm:w-auto">
								<input type="hidden" name="id" value={item.id} />
								<Button type="submit" size="sm" className="w-full sm:w-auto gap-2" title={dict.inbox.unarchiveAction}>
									<Undo2 className="h-4 w-4" />
									{dict.inbox.unarchive}
								</Button>
							</form>
						)}
						<div className="flex w-full items-center justify-between gap-2 self-start sm:w-auto sm:justify-start sm:self-auto">
							<EditInboxItemDialog
								item={{ id: item.id, content: item.content, note: item.note, tags: item.tags }}
								dict={dict}
								trigger={
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="h-9 px-2 sm:w-9 sm:px-0 rounded-full gap-1"
										aria-label={dict.common.edit}
										title={dict.common.edit}
									>
										<Pencil className="h-4 w-4" />
										<span className="text-xs sm:hidden">{dict.inbox.mobileEditShort}</span>
									</Button>
								}
							/>
							{mode === 'open' ? (
								<form action={archiveInboxItem}>
									<input type="hidden" name="id" value={item.id} />
									<Button
										type="submit"
										size="sm"
										variant="outline"
										className="h-9 px-2 sm:w-9 sm:px-0 rounded-full gap-1"
										aria-label={dict.inbox.archiveAction}
										title={dict.inbox.archiveAction}
									>
										<Archive className="h-4 w-4" />
										<span className="text-xs sm:hidden">{dict.inbox.mobileArchiveShort}</span>
									</Button>
								</form>
							) : null}
							<ConfirmDeleteInboxItemDialog
								id={item.id}
								dict={dict}
								trigger={
									<Button
										type="button"
										size="sm"
										variant="ghost"
										className="h-9 px-2 sm:w-9 sm:px-0 rounded-full gap-1 text-muted-foreground hover:text-destructive"
										aria-label={dict.common.delete}
										title={dict.common.delete}
									>
										<Trash2 className="h-4 w-4" />
										<span className="text-xs sm:hidden">{dict.inbox.mobileDeleteShort}</span>
									</Button>
								}
							/>
						</div>
					</div>
				</div>
				{mode === 'open' && !canConvert ? <div className="mt-2 text-xs text-muted-foreground">{dict.inbox.convertDisabledNoGoal}</div> : null}
			</CardContent>
		</Card>
	)
}
