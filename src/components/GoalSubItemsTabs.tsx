'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Info, ListChecks, Plus, Sparkles } from 'lucide-react'
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
	actionsLabel,
	activeTab,
	onActiveTabChange,
	hideTabBar = false
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
	activeTab?: TabKey
	onActiveTabChange?: (tab: TabKey) => void
	hideTabBar?: boolean
}) {
	const [internalActiveTab, setInternalActiveTab] = useState<TabKey>('actions')

	const journeyEntries = useMemo(() => entries.filter((e) => e.kind === 'journey'), [entries])
	const resolvedActiveTab = activeTab ?? internalActiveTab

	function setResolvedActiveTab(nextTab: TabKey) {
		if (activeTab === undefined) {
			setInternalActiveTab(nextTab)
		}
		onActiveTabChange?.(nextTab)
	}

	const addTrigger = useMemo(() => {
		if (resolvedActiveTab === 'actions' || resolvedActiveTab === 'details') return null
		return (
			<Button size="sm" className="h-9 gap-1.5 rounded-full px-4 shadow-sm">
				<Sparkles className="h-4 w-4" />
				{dict.goals.detail.addJourney}
			</Button>
		)
	}, [dict.goals.detail.addJourney, resolvedActiveTab])

	const addActionTrigger = useMemo(
		() => (
			<Button size="sm" className="h-9 gap-1.5 rounded-full px-4 shadow-sm">
				<Plus className="h-4 w-4" />
				{dict.goals.detail.addAction}
			</Button>
		),
		[dict.goals.detail.addAction]
	)

	const actionsTabTitle = actionsLabel ?? dict.goals.detail.tabActions
	const currentEntries = journeyEntries
	const openEntriesCount = currentEntries.filter((entry) => entry.status !== 'archived').length
	const archivedEntriesCount = currentEntries.length - openEntriesCount
	const sectionTitle = dict.goals.detail.tabJourney
	const sectionDescription = dict.common.locale.startsWith('zh')
		? '记录关键过程、情绪变化和阶段性体会，让成长轨迹更完整。'
		: 'Record milestones, emotions, and reflections to make progress more visible.'
	const SectionIcon = Sparkles
	const tabs = [
		{
			key: 'actions' as const,
			label: actionsTabTitle,
			count: actions.length,
			icon: ListChecks
		},
		{
			key: 'journey' as const,
			label: dict.goals.detail.tabJourney,
			count: journeyEntries.length,
			icon: Sparkles
		},
		...(includeDetails
			? [
					{
						key: 'details' as const,
						label: dict.goals.detail.details,
						icon: Info
					}
				]
			: [])
	]
	const contextualAction =
		resolvedActiveTab === 'actions' ? (
			<AddActionDialog goalId={goalId} dict={dict} trigger={addActionTrigger} />
		) : resolvedActiveTab === 'journey' ? (
			<AddGoalEntryDialog goalId={goalId} kind="journey" dict={dict} trigger={addTrigger} />
		) : null

	return (
		<div className="space-y-4">
			{!hideTabBar ? (
				<div className="flex flex-col gap-3 border-b border-border/60 pb-1 sm:flex-row sm:items-end sm:justify-between">
					<div className="flex min-w-0 items-center gap-5 overflow-x-auto overflow-y-hidden">
						{tabs.map((tab) => {
							const Icon = tab.icon
							const isActive = resolvedActiveTab === tab.key

							return (
								<button
									key={tab.key}
									type="button"
									onClick={() => setResolvedActiveTab(tab.key)}
									className={cn(
										'-mb-px inline-flex h-10 items-center gap-2 border-b-2 px-1 text-sm font-medium whitespace-nowrap transition-colors',
										isActive
											? 'border-primary text-foreground'
											: 'border-transparent text-muted-foreground hover:text-foreground'
									)}
								>
									<Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
									<span>{tab.label}</span>
									{typeof tab.count === 'number' ? (
										<span
											className={cn(
												'rounded-full px-2 py-0.5 text-[11px] leading-none',
												isActive
													? 'bg-primary/10 text-primary'
													: 'bg-muted text-muted-foreground'
											)}
										>
											{tab.count}
										</span>
									) : null}
								</button>
							)
						})}
					</div>

					{contextualAction ? <div className="shrink-0">{contextualAction}</div> : null}
				</div>
			) : null}

			{resolvedActiveTab === 'actions' ? (
				<ActionListFilter
					initialActions={actions}
					dict={dict}
					showGoalTitle={false}
					hideGoalFilter={true}
					goalsForEdit={goalsForEdit}
				/>
			) : null}

			{resolvedActiveTab === 'details' ? detailsContent : null}

			{resolvedActiveTab === 'journey' ? (
				<div className="space-y-4">
					<div
						className={cn(
							'overflow-hidden rounded-2xl border px-5 py-5 shadow-sm',
							'border-primary/15 bg-linear-to-br from-primary/8 via-background to-background'
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
										{sectionTitle}: {currentEntries.length}
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
									{resolvedActiveTab === 'journey' && index < currentEntries.length - 1 ? (
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
