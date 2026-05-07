'use client'

import { useMemo, useState } from 'react'
import { Lightbulb, ListChecks, Sparkles } from 'lucide-react'
import type en from '@/i18n/en.json'
import { Button } from '@/components/ui/button'
import { AddActionDialog } from '@/components/AddActionDialog'
import { ActionListFilter } from '@/components/ActionListFilter'
import { AddGoalEntryDialog } from '@/components/AddGoalEntryDialog'
import { GoalEntryRow } from '@/components/GoalEntryRow'
import { cn } from '@/lib/utils'

type Dict = typeof en

type TabKey = 'actions' | 'inspiration' | 'journey'

export interface GoalEntry {
	id: string
	kind: 'inspiration' | 'journey'
	content: string
	note: string
	created_at: string
}

interface Action {
	id: string
	title: string
	description?: string
	type: string
	priority: string
	completed: boolean
	start_date: string
	end_date?: string | null
	goal_id: string
	goals?: {
		id: string
		title: string
	}
	action_sub_items?: Array<{
		id: string
		title: string
		completed: boolean
		sort_order: number
	}>
}

export function GoalSubItemsTabs({
	goalId,
	actions,
	entries,
	dict,
	goalsForEdit,
	tzDefaults
}: {
	goalId: string
	actions: Action[]
	entries: GoalEntry[]
	dict: Dict
	goalsForEdit?: { id: string; title: string }[]
	tzDefaults: { startDefault: string; endDefault: string }
}) {
	const [activeTab, setActiveTab] = useState<TabKey>('actions')

	const { inspirationEntries, journeyEntries } = useMemo(() => {
		const inspiration: GoalEntry[] = []
		const journey: GoalEntry[] = []
		for (const e of entries) {
			if (e.kind === 'inspiration') inspiration.push(e)
			else if (e.kind === 'journey') journey.push(e)
		}
		return { inspirationEntries: inspiration, journeyEntries: journey }
	}, [entries])

	const addTrigger = useMemo(() => {
		if (activeTab === 'actions') return null
		return (
			<Button size="sm" className="gap-1">
				<Sparkles className="h-4 w-4" />
				{activeTab === 'inspiration' ? dict.goals.detail.addInspiration : dict.goals.detail.addJourney}
			</Button>
		)
	}, [activeTab, dict.goals.detail.addInspiration, dict.goals.detail.addJourney])

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div className="grid grid-cols-3 gap-1 rounded-full border border-border/40 bg-background/40 p-1 w-full max-w-md">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className={`rounded-full h-9 ${activeTab === 'actions' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
						onClick={() => setActiveTab('actions')}
					>
						<ListChecks className="h-4 w-4 mr-1" />
						{dict.goals.detail.tabActions} ({actions.length})
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className={`rounded-full h-9 ${activeTab === 'inspiration' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
						onClick={() => setActiveTab('inspiration')}
					>
						<Lightbulb className="h-4 w-4 mr-1" />
						{dict.goals.detail.tabInspiration} ({inspirationEntries.length})
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className={`rounded-full h-9 ${activeTab === 'journey' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
						onClick={() => setActiveTab('journey')}
					>
						<Sparkles className="h-4 w-4 mr-1" />
						{dict.goals.detail.tabJourney} ({journeyEntries.length})
					</Button>
				</div>

				{activeTab === 'actions' ? (
					<AddActionDialog goalId={goalId} dict={dict} />
				) : (
					<AddGoalEntryDialog goalId={goalId} kind={activeTab} dict={dict} trigger={addTrigger} />
				)}
			</div>

			{activeTab === 'actions' ? (
				<ActionListFilter
					initialActions={actions}
					dict={dict}
					showGoalTitle={false}
					hideGoalFilter={true}
					goalsForEdit={goalsForEdit}
				/>
			) : (
				<div
					className={cn(
						'space-y-3',
						activeTab === 'journey'
							? 'relative before:absolute before:left-7 before:top-2 before:bottom-2 before:w-px before:bg-border/40'
							: null
					)}
				>
					{(activeTab === 'inspiration' ? inspirationEntries : journeyEntries).length === 0 ? (
						<div className="text-sm text-muted-foreground">
							{activeTab === 'inspiration' ? dict.goals.detail.emptyInspiration : dict.goals.detail.emptyJourney}
						</div>
					) : (
						(activeTab === 'inspiration' ? inspirationEntries : journeyEntries).map((entry) => (
							<GoalEntryRow
								key={entry.id}
								entry={entry}
								goalId={goalId}
								dict={dict}
								startDefault={tzDefaults.startDefault}
								endDefault={tzDefaults.endDefault}
							/>
						))
					)}
				</div>
			)}
		</div>
	)
}
