'use client'

import type en from '@/i18n/en.json'
import { Lightbulb, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { archiveGoalEntry, deleteGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { ConvertGoalEntryToActionDialog } from '@/components/ConvertGoalEntryToActionDialog'
import { EditGoalEntryDialog } from '@/components/EditGoalEntryDialog'
import { cn } from '@/lib/utils'
import type { GoalEntry } from '@/components/GoalSubItemsTabs'

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
	const isJourney = entry.kind === 'journey'
	const isArchived = entry.status === 'archived'
	const kindLabel = isJourney ? dict.goals.detail.tabJourney : dict.goals.detail.tabInspiration
	const dateText = new Intl.DateTimeFormat(dict.common.locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(entry.created_at)
	)
	const timeText = new Intl.DateTimeFormat(dict.common.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.created_at))

	return (
		<Card
			className={cn(
				'overflow-hidden',
				isJourney ? 'border-border/60 bg-secondary/10' : 'border-border/60',
				isArchived ? 'opacity-80' : null
			)}
		>
			<CardContent className="p-4">
				<div className="grid grid-cols-[auto_1fr] items-start gap-4">
					<div className="flex w-14 flex-col items-center gap-2">
						<div
							className={cn(
								'grid h-10 w-10 place-items-center rounded-2xl border',
								isJourney ? 'border-primary/15 bg-primary/10 text-primary' : 'border-amber-500/20 bg-amber-500/10 text-amber-600'
							)}
						>
							{isJourney ? <Sparkles className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
						</div>
						<div className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
							{dateText}
						</div>
					</div>

					<div className="min-w-0">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex min-w-0 items-center gap-2">
								<div
									className={cn(
										'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
										isJourney ? 'border-primary/20 bg-primary/10 text-primary' : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
									)}
								>
									{kindLabel}
								</div>
								<div className="text-xs text-muted-foreground">{timeText}</div>
							</div>

							{isArchived ? (
								<div className="rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs text-muted-foreground">
									{dict.goals.status.archived}
								</div>
							) : (
								<ConvertGoalEntryToActionDialog
									entry={{ id: entry.id, content: entry.content, note: entry.note }}
									goalId={goalId}
									dict={dict}
									startDefault={startDefault}
									endDefault={endDefault}
									trigger={<Button size="sm">{dict.goals.detail.convertToAction}</Button>}
								/>
							)}
						</div>

						<div className="mt-2 text-sm font-medium whitespace-pre-wrap break-words">{entry.content}</div>

						{entry.note ? (
							<div
								className={cn(
									'mt-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap break-words',
									isJourney ? 'border-primary/10 bg-primary/[0.03]' : 'border-amber-500/10 bg-amber-500/[0.03]'
								)}
							>
								{entry.note}
							</div>
						) : null}

						<div className="mt-3 flex flex-wrap items-center justify-end gap-2">
							{isArchived ? null : (
								<>
									<EditGoalEntryDialog
										entry={{ id: entry.id, kind: entry.kind, content: entry.content, note: entry.note }}
										goalId={goalId}
										dict={dict}
										trigger={
											<Button size="sm" variant="outline" className="gap-1">
												<Pencil className="h-4 w-4" />
												{dict.common.edit}
											</Button>
										}
									/>

									<form action={archiveGoalEntry}>
										<input type="hidden" name="id" value={entry.id} />
										<input type="hidden" name="goal_id" value={goalId} />
										<Button type="submit" size="sm" variant="outline">
											{dict.goals.detail.archiveEntry}
										</Button>
									</form>
								</>
							)}
							<form action={deleteGoalEntry}>
								<input type="hidden" name="id" value={entry.id} />
								<input type="hidden" name="goal_id" value={goalId} />
								<Button type="submit" size="sm" variant="ghost" className="gap-1">
									<Trash2 className="h-4 w-4" />
									{dict.common.delete}
								</Button>
							</form>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
