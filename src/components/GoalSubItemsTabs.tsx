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
	status: 'open' | 'archived'
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
	const currentEntries = activeTab === 'inspiration' ? inspirationEntries : journeyEntries
	const openEntriesCount = currentEntries.filter((entry) => entry.status !== 'archived').length
	const archivedEntriesCount = currentEntries.length - openEntriesCount
	const isInspirationTab = activeTab === 'inspiration'
	const sectionTitle = isInspirationTab ? dict.goals.detail.tabInspiration : dict.goals.detail.tabJourney
	const sectionDescription = isInspirationTab
		? (dict.common.locale.startsWith('zh')
			? '把一闪而过的想法整理成可沉淀、可转行动的素材。'
			: 'Capture sparks of thought and turn them into actionable material.')
		: (dict.common.locale.startsWith('zh')
			? '记录关键过程、情绪变化和阶段性体会，让成长轨迹更完整。'
			: 'Record milestones, emotions, and reflections to make progress more visible.')
	const SectionIcon = isInspirationTab ? Lightbulb : Sparkles

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
				<div className="space-y-4">
					<div
						className={cn(
							'overflow-hidden rounded-2xl border px-5 py-5 shadow-sm',
							isInspirationTab
								? 'border-amber-500/15 bg-linear-to-br from-amber-500/[0.08] via-background to-background'
								: 'border-primary/15 bg-linear-to-br from-primary/[0.08] via-background to-background'
						)}
					>
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="min-w-0">
								<div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
									<SectionIcon className="h-3.5 w-3.5" />
									{sectionTitle}
								</div>
								<div className="mt-3 text-lg font-semibold tracking-tight text-foreground">{sectionTitle}</div>
								<div className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{sectionDescription}</div>
								<div className="mt-4 flex flex-wrap gap-2">
									<div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
										{dict.goals.detail.actions}: {currentEntries.length}
									</div>
									<div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
										{dict.goals.status.active}: {openEntriesCount}
									</div>
									<div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
										{dict.goals.status.archived}: {archivedEntriesCount}
									</div>
								</div>
							</div>
							<AddGoalEntryDialog goalId={goalId} kind={activeTab} dict={dict} trigger={addTrigger} />
						</div>
					</div>

					{currentEntries.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-center">
							<div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-muted-foreground">
								<SectionIcon className="h-5 w-5" />
							</div>
							<div className="mt-4 text-base font-medium text-foreground">
								{isInspirationTab ? dict.goals.detail.emptyInspiration : dict.goals.detail.emptyJourney}
							</div>
							<div className="mt-2 text-sm leading-6 text-muted-foreground">
								{isInspirationTab
									? (dict.common.locale.startsWith('zh')
										? '灵感先记录下来，再决定是否转换为行动。'
										: 'Capture the idea first, then decide whether to convert it into an action.')
									: (dict.common.locale.startsWith('zh')
										? '心路旅程适合记录过程、波动和阶段感受。'
										: 'Journey entries work well for process notes, shifts, and reflections.')}
							</div>
							<div className="mt-5 flex justify-center">
								<AddGoalEntryDialog goalId={goalId} kind={activeTab} dict={dict} trigger={addTrigger} />
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{currentEntries.map((entry, index) => (
								<div key={entry.id} className="relative">
									{activeTab === 'journey' && index < currentEntries.length - 1 ? (
										<div className="pointer-events-none absolute bottom-[-16px] left-6 top-[72px] w-px bg-border/50 md:left-8" />
									) : null}
									<div className="relative">
										<GoalEntryRow
											entry={entry}
											goalId={goalId}
											dict={dict}
											startDefault={tzDefaults.startDefault}
											endDefault={tzDefaults.endDefault}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
