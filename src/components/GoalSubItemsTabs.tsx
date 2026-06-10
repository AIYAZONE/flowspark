'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Info, ListChecks, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import type en from '@/i18n/en.json'
import { Button } from '@/components/ui/button'
import { ActionListFilter } from '@/components/ActionListFilter'
import { GoalEntryRow } from '@/components/GoalEntryRow'
import type { GoalEntry } from '@/components/goal-entry.types'
import { cn } from '@/lib/utils'

type Dict = typeof en

type TabKey = 'actions' | 'journey' | 'details'

const AddActionDialog = dynamic(
	() => import('@/components/AddActionDialog').then((m) => m.AddActionDialog),
	{ ssr: false }
)

const AddGoalEntryDialog = dynamic(
	() => import('@/components/AddGoalEntryDialog').then((m) => m.AddGoalEntryDialog),
	{ ssr: false }
)

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
	tzDefaults,
	includeDetails = false,
	detailsContent,
	actionsLabel
}: {
	goalId: string
	actions: Action[]
	entries: GoalEntry[]
	dict: Dict
	goalsForEdit?: { id: string; title: string }[]
	tzDefaults: { startDefault: string; endDefault: string }
	includeDetails?: boolean
	detailsContent?: ReactNode
	actionsLabel?: string
}) {
	const [activeTab, setActiveTab] = useState<TabKey>('actions')

	const journeyEntries = useMemo(() => entries.filter((e) => e.kind === 'journey'), [entries])

	const addTrigger = useMemo(() => {
		if (activeTab === 'actions' || activeTab === 'details') return null
		return (
			<Button size="sm" className="gap-1">
				<Sparkles className="h-4 w-4" />
				{dict.goals.detail.addJourney}
			</Button>
		)
	}, [activeTab, dict.goals.detail.addJourney])

	const actionsTabTitle = actionsLabel ?? dict.goals.detail.tabActions
	const currentEntries = journeyEntries
	const openEntriesCount = currentEntries.filter((entry) => entry.status !== 'archived').length
	const archivedEntriesCount = currentEntries.length - openEntriesCount
	const sectionTitle = dict.goals.detail.tabJourney
	const sectionDescription = dict.common.locale.startsWith('zh')
		? '记录关键过程、情绪变化和阶段性体会，让成长轨迹更完整。'
		: 'Record milestones, emotions, and reflections to make progress more visible.'
	const SectionIcon = Sparkles

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div
					className={cn(
						'grid gap-1 rounded-full border border-border/40 bg-background/40 p-1 w-full',
						includeDetails ? 'grid-cols-3 max-w-lg' : 'grid-cols-2 max-w-sm'
					)}
				>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className={`rounded-full h-9 ${activeTab === 'actions' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
						onClick={() => setActiveTab('actions')}
					>
						<ListChecks className="h-4 w-4 mr-1" />
						{actionsTabTitle} ({actions.length})
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
					{includeDetails ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className={`rounded-full h-9 ${activeTab === 'details' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
							onClick={() => setActiveTab('details')}
						>
							<Info className="h-4 w-4 mr-1" />
							{dict.goals.detail.details}
						</Button>
					) : null}
				</div>

				{activeTab === 'actions' ? <AddActionDialog goalId={goalId} dict={dict} /> : null}
				{activeTab === 'journey' ? (
					<AddGoalEntryDialog goalId={goalId} kind="journey" dict={dict} trigger={addTrigger} />
				) : null}
			</div>

			{activeTab === 'actions' ? (
				<ActionListFilter
					initialActions={actions}
					dict={dict}
					showGoalTitle={false}
					hideGoalFilter={true}
					goalsForEdit={goalsForEdit}
				/>
			) : null}

			{activeTab === 'details' ? detailsContent : null}

			{activeTab === 'journey' ? (
				<div className="space-y-4">
					<div
						className={cn(
							'overflow-hidden rounded-2xl border px-5 py-5 shadow-sm',
							'border-primary/15 bg-linear-to-br from-primary/[0.08] via-background to-background'
						)}
					>
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
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
						</div>
					</div>

					{currentEntries.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-center">
							<div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-muted-foreground">
								<SectionIcon className="h-5 w-5" />
							</div>
							<div className="mt-4 text-base font-medium text-foreground">
								{dict.goals.detail.emptyJourney}
							</div>
							<div className="mt-2 text-sm leading-6 text-muted-foreground">
								{dict.common.locale.startsWith('zh')
									? '心路旅程适合记录过程、波动和阶段感受。'
									: 'Journey entries work well for process notes, shifts, and reflections.'}
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
			) : null}
		</div>
	)
}
