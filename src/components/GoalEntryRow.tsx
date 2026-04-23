'use client'

import type en from '@/i18n/en.json'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { archiveGoalEntry, deleteGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { ConvertGoalEntryToActionDialog } from '@/components/ConvertGoalEntryToActionDialog'
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
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0 flex-1">
						<div className="text-sm font-medium whitespace-pre-wrap break-words">{entry.content}</div>
						{entry.note ? (
							<div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-words">
								{entry.note}
							</div>
						) : null}
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<ConvertGoalEntryToActionDialog
							entry={{ id: entry.id, content: entry.content, note: entry.note }}
							goalId={goalId}
							dict={dict}
							startDefault={startDefault}
							endDefault={endDefault}
							trigger={<Button size="sm">{dict.goals.detail.convertToAction}</Button>}
						/>
						<form action={archiveGoalEntry}>
							<input type="hidden" name="id" value={entry.id} />
							<input type="hidden" name="goal_id" value={goalId} />
							<Button type="submit" size="sm" variant="outline">
								{dict.goals.detail.archiveEntry}
							</Button>
						</form>
						<form action={deleteGoalEntry}>
							<input type="hidden" name="id" value={entry.id} />
							<input type="hidden" name="goal_id" value={goalId} />
							<Button type="submit" size="sm" variant="ghost">
								{dict.common.delete}
							</Button>
						</form>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

