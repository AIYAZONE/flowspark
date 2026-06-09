'use client'

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import type en from '@/i18n/en.json'
import { Archive, CalendarDays, Lightbulb, ListChecks, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { archiveGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { ConvertGoalEntryToActionDialog } from '@/components/ConvertGoalEntryToActionDialog'
import { EditGoalEntryDialog } from '@/components/EditGoalEntryDialog'
import { ConfirmDeleteGoalEntryDialog } from '@/components/ConfirmDeleteGoalEntryDialog'
import { RichTextContentView } from '@/components/RichTextContentView'
import { RichTextImagePreviewDialog } from '@/components/RichTextImagePreviewDialog'
import { cn } from '@/lib/utils'
import type { GoalEntry } from '@/components/GoalSubItemsTabs'

type Dict = typeof en

const HoverLabel = forwardRef<
	HTMLDivElement,
	{
		label: string
		children: ReactNode
	} & HTMLAttributes<HTMLDivElement>
>(({ label, children, className, ...props }, ref) => {
	return (
		<div ref={ref} className={cn('relative group/hoverlabel', className)} {...props}>
			{children}
			<div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/60 bg-background/95 px-2 py-1 text-[11px] text-foreground opacity-0 shadow-sm transition-opacity group-hover/hoverlabel:opacity-100">
				{label}
			</div>
		</div>
	)
})
HoverLabel.displayName = 'HoverLabel'

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
	const isJourney = entry.kind === 'journey'
	const isArchived = entry.status === 'archived'
	const kindLabel = isJourney ? dict.goals.detail.tabJourney : dict.goals.detail.tabInspiration
	const dateText = new Intl.DateTimeFormat(dict.common.locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(entry.created_at)
	)
	const timeText = new Intl.DateTimeFormat(dict.common.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.created_at))
	const locale = String(dict.common.locale || '').toLowerCase()
	const noteLabel = dict.quickCapture.noteLabel || (locale.startsWith('zh') ? '补充说明' : 'Notes')

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
						<div className="space-y-4">
							<div className="flex items-start justify-between gap-3">
								<div className="flex flex-wrap items-center gap-2 pr-14">
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

								<div className="hidden md:flex absolute right-4 top-4 z-50 pointer-events-auto items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
									{isArchived ? null : (
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
											<form action={archiveGoalEntry}>
												<input type="hidden" name="id" value={entry.id} />
												<input type="hidden" name="goal_id" value={goalId} />
												<HoverLabel label={dict.goals.detail.archiveEntry}>
													<Button
														type="submit"
														variant="ghost"
														size="icon"
														title={dict.goals.detail.archiveEntry}
														aria-label={dict.goals.detail.archiveEntry}
													>
														<Archive className="h-4 w-4" />
													</Button>
												</HoverLabel>
											</form>
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

						<div className="md:hidden border-t border-border/50 pt-4">
							{isArchived ? (
								<ConfirmDeleteGoalEntryDialog
									id={entry.id}
									goalId={goalId}
									dict={dict}
									trigger={
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="w-full gap-1 text-muted-foreground hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
											{dict.common.delete}
										</Button>
									}
								/>
							) : (
								<div className="grid grid-cols-2 gap-2">
									<ConvertGoalEntryToActionDialog
										entry={{ id: entry.id, content: entry.content, note: entry.note }}
										goalId={goalId}
										dict={dict}
										startDefault={startDefault}
										endDefault={endDefault}
										trigger={
											<Button size="sm" variant="outline" className="w-full gap-1">
												<ListChecks className="h-4 w-4" />
												{dict.goals.detail.convertToAction}
											</Button>
										}
									/>
									<EditGoalEntryDialog
										entry={{ id: entry.id, kind: entry.kind, content: entry.content, note: entry.note }}
										goalId={goalId}
										dict={dict}
										trigger={
											<Button size="sm" variant="outline" className="w-full gap-1">
												<Pencil className="h-4 w-4" />
												{dict.common.edit}
											</Button>
										}
									/>
									<form action={archiveGoalEntry}>
										<input type="hidden" name="id" value={entry.id} />
										<input type="hidden" name="goal_id" value={goalId} />
										<Button type="submit" size="sm" variant="outline" className="w-full gap-1">
											<Archive className="h-4 w-4" />
											{dict.goals.detail.archiveEntry}
										</Button>
									</form>
									<ConfirmDeleteGoalEntryDialog
										id={entry.id}
										goalId={goalId}
										dict={dict}
										trigger={
											<Button
												type="button"
												size="sm"
												variant="ghost"
												className="w-full gap-1 text-muted-foreground hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
												{dict.common.delete}
											</Button>
										}
									/>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

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
