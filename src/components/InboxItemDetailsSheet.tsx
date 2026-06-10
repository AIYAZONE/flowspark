'use client'

import { useState, useTransition } from 'react'
import { Archive, CalendarDays, Lightbulb, ListChecks, Pencil, Trash2, Undo2 } from 'lucide-react'
import type en from '@/i18n/en.json'
import { archiveInboxItem, unarchiveInboxItem } from '@/app/(authenticated)/inbox/actions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetFormContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EditInboxItemDialog } from '@/components/EditInboxItemDialog'
import { ConvertInboxToActionDialog } from '@/components/ConvertInboxToActionDialog'
import { ConfirmDeleteInboxItemDialog } from '@/components/ConfirmDeleteInboxItemDialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ModalActionFooter } from '@/components/ModalActionFooter'
import { ModalHeaderActions } from '@/components/ModalHeaderActions'

type Dict = typeof en

type InboxItem = {
	id: string
	content: string
	note: string
	tags: string[]
	created_at: string
}

export function InboxItemDetailsSheet({
	open,
	onOpenChange,
	item,
	activeGoals,
	dict,
	startDefault,
	endDefault,
	mode = 'open'
}: {
	open: boolean
	onOpenChange: (next: boolean) => void
	item: InboxItem
	activeGoals: { id: string; title: string }[]
	dict: Dict
	startDefault: string
	endDefault: string
	mode?: 'open' | 'archived'
}) {
	const [actionError, setActionError] = useState<string | null>(null)
	const [isArchivePending, startArchiveTransition] = useTransition()
	const canConvert = mode === 'open' && activeGoals.length > 0
	const isArchived = mode === 'archived'
	const dateText = new Intl.DateTimeFormat(dict.common.locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(item.created_at)
	)
	const timeText = new Intl.DateTimeFormat(dict.common.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at))
	const locale = String(dict.common.locale || '').toLowerCase()
	const noteLabel = dict.quickCapture.noteLabel || (locale.startsWith('zh') ? '补充说明' : 'Notes')
	const visibleTags = item.tags.slice(0, 6)
	const remainingTagsCount = Math.max(item.tags.length - visibleTags.length, 0)

	function handleOpenChange(next: boolean) {
		onOpenChange(next)
		if (!next) {
			setActionError(null)
		}
	}

	function handleArchiveOrRestore() {
		setActionError(null)
		startArchiveTransition(async () => {
			try {
				const formData = new FormData()
				formData.set('id', item.id)
				if (isArchived) {
					await unarchiveInboxItem(formData)
				} else {
					await archiveInboxItem(formData)
				}
				onOpenChange(false)
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setActionError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetFormContent side="bottom" mobileMode="sheet" className="max-h-[85vh] overflow-hidden rounded-t-2xl p-0 md:hidden">
				<div className="flex min-h-0 max-h-[85vh] flex-col">
					<SheetHeader className="border-b border-border/60 px-4 pb-3 pt-4 text-left">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<SheetTitle className="text-left leading-snug">{dict.inbox.title}</SheetTitle>
								<div className="mt-3 flex flex-wrap items-center gap-2">
									<div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
										<Lightbulb className="h-3.5 w-3.5" />
										{dict.inbox.title}
									</div>
									<div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground">
										<CalendarDays className="h-3.5 w-3.5" />
										{dateText} {timeText}
									</div>
									{isArchived ? (
										<div className="rounded-full border border-border/60 bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
											{dict.inbox.tabArchived}
										</div>
									) : null}
								</div>
							</div>
							<ModalHeaderActions
								renderCloseButton={(button) => <SheetClose asChild>{button}</SheetClose>}
							/>
						</div>
					</SheetHeader>

					<div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
						<div className="space-y-4">
							<div className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
								<div className="text-sm font-medium whitespace-pre-wrap wrap-break-word">{item.content}</div>
								{visibleTags.length > 0 ? (
									<div className="mt-3 flex flex-wrap gap-1.5">
										{visibleTags.map((tag) => (
											<span key={tag} className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
												{tag}
											</span>
										))}
										{remainingTagsCount > 0 ? (
											<span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
												+{remainingTagsCount}
											</span>
										) : null}
									</div>
								) : null}
								{mode === 'open' && !canConvert ? <div className="mt-3 text-xs text-muted-foreground">{dict.inbox.convertDisabledNoGoal}</div> : null}
							</div>

							{item.note ? (
								<div className="rounded-2xl border border-amber-500/12 bg-amber-500/4 px-4 py-3">
									<div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{noteLabel}</div>
									<div className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-muted-foreground">{item.note}</div>
								</div>
							) : null}

							{actionError ? <div className="text-sm text-destructive">{actionError}</div> : null}
						</div>
					</div>

					<ModalActionFooter className="px-4 md:px-4">
						<div className="grid grid-cols-2 gap-2">
							{isArchived ? (
								<>
									<Button type="button" size="sm" onClick={handleArchiveOrRestore} disabled={isArchivePending} className="w-full gap-2">
										{isArchivePending ? <LoadingSpinner className="h-4 w-4 text-current" /> : <Undo2 className="h-4 w-4" />}
										{dict.inbox.unarchive}
									</Button>
									<ConfirmDeleteInboxItemDialog
										id={item.id}
										dict={dict}
										onSuccess={() => onOpenChange(false)}
										trigger={
											<Button type="button" size="sm" variant="ghost" className="w-full gap-1 text-muted-foreground hover:text-destructive">
												<Trash2 className="h-4 w-4" />
												{dict.common.delete}
											</Button>
										}
									/>
								</>
							) : (
								<>
									<EditInboxItemDialog
										item={{ id: item.id, content: item.content, note: item.note, tags: item.tags }}
										dict={dict}
										onSuccess={() => onOpenChange(false)}
										trigger={
											<Button size="sm" variant="outline" className="w-full gap-1">
												<Pencil className="h-4 w-4" />
												{dict.common.edit}
											</Button>
										}
									/>
									<ConvertInboxToActionDialog
										item={{ id: item.id, content: item.content, note: item.note, tags: item.tags }}
										activeGoals={activeGoals}
										dict={dict}
										startDefault={startDefault}
										endDefault={endDefault}
										onSuccess={() => onOpenChange(false)}
										trigger={
											<Button
												size="sm"
												variant="outline"
												className="w-full gap-1"
												disabled={!canConvert}
												title={!canConvert ? dict.inbox.convertDisabledNoGoal : undefined}
											>
												<ListChecks className="h-4 w-4" />
												{dict.inbox.convertCta}
											</Button>
										}
									/>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={handleArchiveOrRestore}
										disabled={isArchivePending}
										className="w-full gap-1"
									>
										{isArchivePending ? <LoadingSpinner className="h-4 w-4 text-current" /> : <Archive className="h-4 w-4" />}
										{dict.inbox.archive}
									</Button>
									<ConfirmDeleteInboxItemDialog
										id={item.id}
										dict={dict}
										onSuccess={() => onOpenChange(false)}
										trigger={
											<Button type="button" size="sm" variant="ghost" className="w-full gap-1 text-muted-foreground hover:text-destructive">
												<Trash2 className="h-4 w-4" />
												{dict.common.delete}
											</Button>
										}
									/>
								</>
							)}
						</div>
					</ModalActionFooter>
				</div>
			</SheetFormContent>
		</Sheet>
	)
}
