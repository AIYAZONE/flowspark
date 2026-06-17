'use client'

import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import type en from '@/i18n/en.json'
import { Archive, CalendarDays, ChevronRight, Lightbulb, ListChecks, Pencil, Sparkles, Trash2, Undo2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { archiveGoalEntry, unarchiveGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { ConvertGoalEntryToActionDialog } from '@/components/ConvertGoalEntryToActionDialog'
import { EditGoalEntryDialog } from '@/components/EditGoalEntryDialog'
import { ConfirmDeleteGoalEntryDialog } from '@/components/ConfirmDeleteGoalEntryDialog'
import { GoalEntryDetailsSheet } from '@/components/GoalEntryDetailsSheet'
import { RichTextContentView } from '@/components/RichTextContentView'
import { RichTextImagePreviewDialog } from '@/components/RichTextImagePreviewDialog'
import { HoverLabel } from '@/components/HoverLabel'
import { FormIconButton } from '@/components/FormIconButton'
import { useMediaQuery } from '@/components/ui/use-media-query'
import { cn } from '@/lib/utils'
import type { GoalEntry } from '@/components/goal-entry.types'
import { TABLET_AND_UP_MEDIA_QUERY } from '@/components/responsive-classes'
import { shouldOpenGoalEntryDetails } from '@/components/goal-entry-details-open'
import { shouldIgnoreDetailsOpenInteraction } from '@/components/details-open-ignore'

type Dict = typeof en

export function GoalEntryRow({
	entry,
	goalId,
	dict,
	startDefault,
	endDefault
}: {
	entry: GoalEntry
	goalId: string
	dict: Dict
	startDefault: string
	endDefault: string
}) {
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
	const [detailsOpen, setDetailsOpen] = useState(false)
	const isTabletAndUp = useMediaQuery(TABLET_AND_UP_MEDIA_QUERY)
	const isJourney = entry.kind === 'journey'
	const isArchived = entry.status === 'archived'
	const kindLabel = isJourney ? dict.goals.detail.tabJourney : dict.goals.detail.tabInspiration
	const dateText = new Intl.DateTimeFormat(dict.common.locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(entry.created_at)
	)
	const timeText = new Intl.DateTimeFormat(dict.common.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.created_at))
	const locale = String(dict.common.locale || '').toLowerCase()
	const noteLabel = dict.quickCapture.noteLabel || (locale.startsWith('zh') ? '补充说明' : 'Notes')

	function shouldIgnoreDetailsOpen(target: EventTarget | null, currentTarget: HTMLDivElement) {
		if (!(target instanceof Element)) return false
		const isNativeInteractive = Boolean(target.closest('img, a, button, input, textarea, select, [data-richtext-image="true"]'))
		const isRadixSelectOverlay = Boolean(target.closest('[role="listbox"], [role="option"], [data-radix-collection-item]'))
		const isDialogLayer = Boolean(target.closest('[data-dialog-layer]'))
		const nestedButton = target.closest('[role="button"]')
		const isNestedButton = Boolean(nestedButton && nestedButton !== currentTarget)
		return shouldIgnoreDetailsOpenInteraction({ isNativeInteractive, isRadixSelectOverlay, isDialogLayer, isNestedButton })
	}

	function openDetails(event: MouseEvent<HTMLDivElement>) {
		const shouldIgnoreTarget = shouldIgnoreDetailsOpen(event.target, event.currentTarget)
		if (!shouldOpenGoalEntryDetails({ isTabletAndUp, shouldIgnoreTarget })) return
		setDetailsOpen(true)
	}

	function handleEntryActivate(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key !== 'Enter' && event.key !== ' ') return
		event.preventDefault()
		setDetailsOpen(true)
	}

	return (
		<>
			<Card
				className={cn(
					'group relative isolate overflow-hidden md:overflow-visible rounded-2xl border shadow-sm transition-colors',
					isJourney
						? 'border-primary/15 bg-linear-to-br from-primary/8 via-background to-background'
						: 'border-amber-500/15 bg-linear-to-br from-amber-500/[0.07] via-background to-background',
					isArchived ? 'opacity-80' : null
				)}
			>
				<CardContent className="p-0">
					<div className="p-5">
						<div
							role="button"
							tabIndex={0}
							onClick={openDetails}
							onKeyDown={handleEntryActivate}
							className="space-y-4 rounded-2xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex flex-wrap items-center gap-2 pr-14 md:pr-14">
									<div
										className={cn(
											'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
											isJourney ? 'border-primary/20 bg-primary/10 text-primary' : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
										)}
									>
										{isJourney ? <Sparkles className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
										{kindLabel}
									</div>
									<div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground">
										<CalendarDays className="h-3.5 w-3.5" />
										{dateText} {timeText}
									</div>
									{isArchived ? (
										<div className="rounded-full border border-border/60 bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
											{dict.goals.status.archived}
										</div>
									) : null}
								</div>

								<div className="md:hidden pt-1 text-muted-foreground/60">
									<ChevronRight className="h-4 w-4" />
								</div>

								<div className="hidden md:flex absolute right-4 top-4 z-50 pointer-events-auto items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
									{isArchived ? (
										<FormIconButton
											action={unarchiveGoalEntry}
											fields={[
												{ name: 'id', value: entry.id },
												{ name: 'goal_id', value: goalId }
											]}
											label={dict.goals.detail.unarchiveAction}
											title={dict.goals.detail.unarchiveAction}
											ariaLabel={dict.goals.detail.unarchiveAction}
										>
											<Undo2 className="h-4 w-4" />
										</FormIconButton>
									) : (
										<>
											<EditGoalEntryDialog
												entry={{ id: entry.id, kind: entry.kind, content: entry.content, note: entry.note }}
												goalId={goalId}
												dict={dict}
												trigger={
													<HoverLabel label={dict.common.edit}>
														<Button type="button" variant="ghost" size="icon" title={dict.common.edit} aria-label={dict.common.edit}>
															<Pencil className="h-4 w-4" />
														</Button>
													</HoverLabel>
												}
											/>
											<ConvertGoalEntryToActionDialog
												entry={{ id: entry.id, content: entry.content, note: entry.note }}
												goalId={goalId}
												dict={dict}
												startDefault={startDefault}
												endDefault={endDefault}
												trigger={
													<HoverLabel label={dict.goals.detail.convertToAction}>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															title={dict.goals.detail.convertToAction}
															aria-label={dict.goals.detail.convertToAction}
														>
															<ListChecks className="h-4 w-4" />
														</Button>
													</HoverLabel>
												}
											/>
											<FormIconButton
												action={archiveGoalEntry}
												fields={[
													{ name: 'id', value: entry.id },
													{ name: 'goal_id', value: goalId }
												]}
												label={dict.goals.detail.archiveEntry}
												title={dict.goals.detail.archiveEntry}
												ariaLabel={dict.goals.detail.archiveEntry}
											>
												<Archive className="h-4 w-4" />
											</FormIconButton>
										</>
									)}
									<ConfirmDeleteGoalEntryDialog
										id={entry.id}
										goalId={goalId}
										dict={dict}
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
								<RichTextContentView html={entry.content} onImageClick={setPreviewImageUrl} />
							</div>

							{entry.note ? (
								<div
									className={cn(
										'rounded-2xl border px-4 py-3',
										isJourney ? 'border-primary/12 bg-primary/4' : 'border-amber-500/12 bg-amber-500/4'
									)}
								>
									<div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{noteLabel}</div>
									<div className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-muted-foreground">
										{entry.note}
									</div>
								</div>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>

			<GoalEntryDetailsSheet
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
				entry={entry}
				goalId={goalId}
				dict={dict}
				startDefault={startDefault}
				endDefault={endDefault}
			/>

			<RichTextImagePreviewDialog
				open={Boolean(previewImageUrl)}
				imageUrl={previewImageUrl}
				title={dict.common.imagePreviewTitle}
				openOriginalLabel={dict.common.openOriginal}
				onOpenChange={(open) => {
					if (!open) setPreviewImageUrl(null)
				}}
			/>
		</>
	)
}
