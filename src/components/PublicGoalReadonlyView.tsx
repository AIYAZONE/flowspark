'use client'

import { useMemo, useState } from 'react'
import { Info, ListChecks, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicShareActionList } from '@/components/PublicShareActionList'

type SharedAction = {
	id: string
	title: string
	description?: string | null
	completed: boolean
	priority: string
	type: string
	start_date: string
	end_date?: string | null
}

type SharedEntry = {
	id: string
	kind: 'inspiration' | 'journey'
	status: 'open' | 'archived'
	content: string
	note?: string | null
	created_at: string
}

type SharedGoal = {
	title: string
	description: string
	start_date: string
	end_date: string
	status: string
	priority?: string | null
	category?: string | null
	success_criteria: string
	stop_criteria: string
}

type TabKey = 'actions' | 'journey' | 'details'

function normalizeRichText(raw: string): string {
	return raw
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
}

function sanitizeHtml(html: string): string {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
		.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
		.replace(/\son\w+="[^"]*"/gi, '')
		.replace(/\son\w+='[^']*'/gi, '')
		.replace(/\son\w+=\S+/gi, '')
		.replace(/javascript:/gi, '')
}

function RichText({ text }: { text: string }) {
	const normalized = normalizeRichText(text)
	const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(normalized.trim())

	if (looksLikeHtml) {
		return (
			<div
				className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-img:my-2 prose-img:max-w-full prose-img:rounded-md prose-img:border prose-img:border-border/40"
				dangerouslySetInnerHTML={{ __html: sanitizeHtml(normalized) }}
			/>
		)
	}

	return (
		<div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-img:my-2 prose-img:max-w-full prose-img:rounded-md prose-img:border prose-img:border-border/40">
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized}</ReactMarkdown>
		</div>
	)
}

export function PublicGoalReadonlyView({
	goal,
	actions,
	entries,
	labels,
	typeLabelMap,
	priorityLabelMap,
	statusLabelMap,
	categoryLabelMap
}: {
	goal: SharedGoal
	actions: SharedAction[]
	entries: SharedEntry[]
	labels: {
		actions: string
		inspiration: string
		journey: string
		details: string
		timeline: string
		description: string
		startDate: string
		endDate: string
		status: string
		priority: string
		category: string
		successCriteria: string
		stopCriteria: string
		emptyActions: string
		emptyInspiration: string
		emptyJourney: string
		completed: string
		incomplete: string
		allStatus: string
		allType: string
		allPriority: string
		searchActionsPlaceholder: string
		entryOpen: string
		entryArchived: string
	}
	typeLabelMap: Record<string, string>
	priorityLabelMap: Record<string, string>
	statusLabelMap: Record<string, string>
	categoryLabelMap: Record<string, string>
}) {
	const [activeTab, setActiveTab] = useState<TabKey>('actions')
	const journeyEntries = useMemo(
		() => entries.filter((e) => e.kind === 'journey'),
		[entries]
	)
	const entryStatusLabelMap = {
		open: labels.entryOpen,
		archived: labels.entryArchived
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-3 gap-1 rounded-full border border-border/40 bg-background/40 p-1">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className={`rounded-full h-9 ${activeTab === 'actions' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
					onClick={() => setActiveTab('actions')}
				>
					<ListChecks className="h-4 w-4 mr-1" />
					{labels.actions} ({actions.length})
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className={`rounded-full h-9 ${activeTab === 'journey' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
					onClick={() => setActiveTab('journey')}
				>
					<Sparkles className="h-4 w-4 mr-1" />
					{labels.journey} ({journeyEntries.length})
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className={`rounded-full h-9 ${activeTab === 'details' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
					onClick={() => setActiveTab('details')}
				>
					<Info className="h-4 w-4 mr-1" />
					{labels.details}
				</Button>
			</div>

			{activeTab === 'actions' ? (
				<Card>
					<CardHeader>
						<CardTitle>{labels.actions}</CardTitle>
					</CardHeader>
					<CardContent>
						<PublicShareActionList
							actions={actions}
							typeLabelMap={typeLabelMap}
							priorityLabelMap={priorityLabelMap}
							completedLabel={labels.completed}
							incompleteLabel={labels.incomplete}
							emptyLabel={labels.emptyActions}
							labels={{
								searchPlaceholder: labels.searchActionsPlaceholder,
								allStatus: labels.allStatus,
								allType: labels.allType,
								allPriority: labels.allPriority,
								completed: labels.completed,
								incomplete: labels.incomplete
							}}
						/>
					</CardContent>
				</Card>
			) : null}

			{activeTab === 'journey' ? (
				<Card>
					<CardHeader>
						<CardTitle>{labels.journey}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{journeyEntries.length === 0 ? (
							<div className="text-sm text-muted-foreground">{labels.emptyJourney}</div>
						) : (
							journeyEntries.map((entry) => (
								<div key={entry.id} className="rounded-md border border-border/50 bg-muted/20 p-3">
									<div className="text-xs text-muted-foreground">
										{labels.journey} · {entryStatusLabelMap[entry.status]}
									</div>
									<div className="mt-1 text-sm">
										<RichText text={entry.content} />
									</div>
									{entry.note ? (
										<div className="mt-2 text-xs text-muted-foreground">
											<RichText text={entry.note} />
										</div>
									) : null}
								</div>
							))
						)}
					</CardContent>
				</Card>
			) : null}

			{activeTab === 'details' ? (
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>{labels.timeline}</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
							<div className="rounded-md border border-border/50 bg-muted/20 p-3">
								<div className="text-xs">{labels.startDate}</div>
								<div className="mt-1 font-medium text-foreground">{goal.start_date || '-'}</div>
							</div>
							<div className="rounded-md border border-border/50 bg-muted/20 p-3">
								<div className="text-xs">{labels.endDate}</div>
								<div className="mt-1 font-medium text-foreground">{goal.end_date || '-'}</div>
							</div>
							<div className="rounded-md border border-border/50 bg-muted/20 p-3">
								<div className="text-xs">{labels.status}</div>
								<div className="mt-1 font-medium text-foreground">
									{statusLabelMap[goal.status] || goal.status || '-'}
								</div>
							</div>
							<div className="rounded-md border border-border/50 bg-muted/20 p-3">
								<div className="text-xs">{labels.priority}</div>
								<div className="mt-1 font-medium text-foreground">
									{priorityLabelMap[goal.priority || ''] || goal.priority || '-'}
								</div>
							</div>
							<div className="rounded-md border border-border/50 bg-muted/20 p-3 md:col-span-2">
								<div className="text-xs">{labels.category}</div>
								<div className="mt-1 font-medium text-foreground">
									{categoryLabelMap[goal.category || ''] || goal.category || '-'}
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>{labels.description}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							{goal.description ? <RichText text={goal.description} /> : '-'}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>{labels.successCriteria}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							{goal.success_criteria ? <RichText text={goal.success_criteria} /> : '-'}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>{labels.stopCriteria}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							{goal.stop_criteria ? <RichText text={goal.stop_criteria} /> : '-'}
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	)
}
