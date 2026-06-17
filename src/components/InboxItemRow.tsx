'use client'

import type en from '@/i18n/en.json'
import { useState, useTransition, type KeyboardEvent, type MouseEvent } from 'react'
import { Archive, CalendarDays, ChevronRight, Lightbulb, ListChecks, Pencil, Trash2, Undo2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { archiveInboxItem, unarchiveInboxItem } from '@/app/(authenticated)/inbox/actions'
import { ConvertInboxToActionDialog } from '@/components/ConvertInboxToActionDialog'
import { EditInboxItemDialog } from '@/components/EditInboxItemDialog'
import { ConfirmDeleteInboxItemDialog } from '@/components/ConfirmDeleteInboxItemDialog'
import { InboxItemDetailsSheet } from '@/components/InboxItemDetailsSheet'
import { HoverLabel } from '@/components/HoverLabel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { shouldOpenInboxItemDetails } from '@/components/inbox-item-details-open'
import { shouldIgnoreDetailsOpenInteraction } from '@/components/details-open-ignore'

type Dict = typeof en

export function InboxItemRow({
	item,
	activeGoals,
	dict,
	startDefault,
	endDefault,
	mode = 'open',
	onMutateSuccess
}: {
	item: { id: string; content: string; note: string; tags: string[]; created_at: string }
	activeGoals: { id: string; title: string }[]
	dict: Dict
	startDefault: string
	endDefault: string
	mode?: 'open' | 'archived'
	onMutateSuccess?: () => void | Promise<void>
}) {
	const [detailsOpen, setDetailsOpen] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [isArchivePending, startArchiveTransition] = useTransition()
	const canConvert = mode === 'open' && activeGoals.length > 0
	const dateText = new Intl.DateTimeFormat(dict.common.locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(item.created_at)
	)
	const timeText = new Intl.DateTimeFormat(dict.common.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at))
	const locale = String(dict.common.locale || '').toLowerCase()
	const noteLabel = dict.quickCapture.noteLabel || (locale.startsWith('zh') ? '补充说明' : 'Notes')
	const visibleTags = item.tags.slice(0, 3)
	const remainingTagsCount = Math.max(item.tags.length - visibleTags.length, 0)

	function shouldIgnoreDetailsOpen(target: EventTarget | null, currentTarget: HTMLDivElement) {
		if (!(target instanceof Element)) return false
		const isNativeInteractive = Boolean(target.closest('a, button, input, textarea, select'))
		const isRadixSelectOverlay = Boolean(target.closest('[role="listbox"], [role="option"], [data-radix-collection-item]'))
		const isDialogLayer = Boolean(target.closest('[data-dialog-layer]'))
		const nestedButton = target.closest('[role="button"]')
		const isNestedButton = Boolean(nestedButton && nestedButton !== currentTarget)
		return shouldIgnoreDetailsOpenInteraction({ isNativeInteractive, isRadixSelectOverlay, isDialogLayer, isNestedButton })
	}

	function openDetails(event: MouseEvent<HTMLDivElement>) {
		const shouldIgnoreTarget = shouldIgnoreDetailsOpen(event.target, event.currentTarget)
		if (!shouldOpenInboxItemDetails({ shouldIgnoreTarget })) return
		setDetailsOpen(true)
	}

	function handleItemActivate(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key !== 'Enter' && event.key !== ' ') return
		event.preventDefault()
		setDetailsOpen(true)
	}

	function handleArchiveOrRestore() {
		setActionError(null)
		startArchiveTransition(async () => {
			try {
				const formData = new FormData()
				formData.set('id', item.id)
				if (mode === 'archived') {
					await unarchiveInboxItem(formData)
				} else {
					await archiveInboxItem(formData)
				}
				await onMutateSuccess?.()
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setActionError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	return (
		<>
			<Card
				className={cn(
					'group relative isolate overflow-hidden md:overflow-visible rounded-2xl border shadow-sm transition-colors',
					'border-amber-500/15 bg-linear-to-br from-amber-500/[0.07] via-background to-background',
					mode === 'archived' ? 'opacity-80' : null
				)}
			>
				<CardContent className="p-0">
					<div className="p-5">
						<div
							role="button"
							tabIndex={0}
							aria-haspopup="dialog"
							onClick={openDetails}
							onKeyDown={handleItemActivate}
							className="space-y-4 rounded-2xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex flex-wrap items-center gap-2 pr-14 md:pr-14">
									<div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
										<Lightbulb className="h-3.5 w-3.5" />
										{dict.inbox.title}
									</div>
									<div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground">
										<CalendarDays className="h-3.5 w-3.5" />
										{dateText} {timeText}
									</div>
									{mode === 'archived' ? (
										<div className="rounded-full border border-border/60 bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
											{dict.inbox.tabArchived}
										</div>
									) : null}
								</div>

								<div className="pt-1 text-muted-foreground/60 md:hidden">
									<ChevronRight className="h-4 w-4" />
								</div>

								<div className="pointer-events-auto absolute right-4 top-4 z-50 hidden items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100 md:flex">
									{mode === 'open' ? (
										<>
											<ConvertInboxToActionDialog
												item={{ id: item.id, content: item.content, note: item.note, tags: item.tags }}
												activeGoals={activeGoals}
												dict={dict}
												startDefault={startDefault}
												endDefault={endDefault}
												onSuccess={onMutateSuccess}
												trigger={
													<HoverLabel label={dict.inbox.convertCta}>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															title={!canConvert ? dict.inbox.convertDisabledNoGoal : dict.inbox.convertCta}
															aria-label={dict.inbox.convertCta}
															disabled={!canConvert}
														>
															<ListChecks className="h-4 w-4" />
														</Button>
													</HoverLabel>
												}
											/>
											<EditInboxItemDialog
												item={{ id: item.id, content: item.content, note: item.note, tags: item.tags }}
												dict={dict}
												onSuccess={onMutateSuccess}
												trigger={
													<HoverLabel label={dict.common.edit}>
														<Button type="button" variant="ghost" size="icon" title={dict.common.edit} aria-label={dict.common.edit}>
															<Pencil className="h-4 w-4" />
														</Button>
													</HoverLabel>
												}
											/>
											<HoverLabel label={dict.inbox.archiveAction}>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													title={dict.inbox.archiveAction}
													aria-label={dict.inbox.archiveAction}
													onClick={handleArchiveOrRestore}
													disabled={isArchivePending}
												>
													{isArchivePending ? <LoadingSpinner size={16} className="text-current" /> : <Archive className="h-4 w-4" />}
												</Button>
											</HoverLabel>
										</>
									) : (
										<HoverLabel label={dict.inbox.unarchiveAction}>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												title={dict.inbox.unarchiveAction}
												aria-label={dict.inbox.unarchiveAction}
												onClick={handleArchiveOrRestore}
												disabled={isArchivePending}
											>
												{isArchivePending ? <LoadingSpinner size={16} className="text-current" /> : <Undo2 className="h-4 w-4" />}
											</Button>
										</HoverLabel>
									)}

									<ConfirmDeleteInboxItemDialog
										id={item.id}
										dict={dict}
										onSuccess={onMutateSuccess}
										trigger={
											<HoverLabel label={dict.common.delete}>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													title={dict.common.delete}
													aria-label={dict.common.delete}
													className="text-muted-foreground hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</HoverLabel>
										}
									/>
								</div>
							</div>

							<div className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
								<div className="text-sm font-medium whitespace-pre-wrap wrap-break-word">{item.content}</div>
								{visibleTags.length > 0 ? (
									<div className="mt-2 flex flex-wrap gap-1">
										{visibleTags.map((t) => (
											<span key={t} className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
												{t}
											</span>
										))}
										{remainingTagsCount > 0 ? (
											<span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
												+{remainingTagsCount}
											</span>
										) : null}
									</div>
								) : null}
								{mode === 'open' && !canConvert ? <div className="mt-2 text-xs text-muted-foreground">{dict.inbox.convertDisabledNoGoal}</div> : null}
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
				</CardContent>
			</Card>

			<InboxItemDetailsSheet
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
				item={item}
				activeGoals={activeGoals}
				dict={dict}
				startDefault={startDefault}
				endDefault={endDefault}
				mode={mode}
				onSuccess={onMutateSuccess}
			/>
		</>
	)
}
