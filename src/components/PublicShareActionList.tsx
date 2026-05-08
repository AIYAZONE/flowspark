'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export function PublicShareActionList({
	actions,
	typeLabelMap,
	priorityLabelMap,
	completedLabel,
	incompleteLabel,
	emptyLabel,
	labels
}: {
	actions: SharedAction[]
	typeLabelMap: Record<string, string>
	priorityLabelMap: Record<string, string>
	completedLabel: string
	incompleteLabel: string
	emptyLabel: string
	labels: {
		searchPlaceholder: string
		allStatus: string
		allType: string
		allPriority: string
		completed: string
		incomplete: string
	}
}) {
	const [query, setQuery] = useState('')
	const [status, setStatus] = useState<'all' | 'completed' | 'incomplete'>('incomplete')
	const [type, setType] = useState<'all' | string>('all')
	const [priority, setPriority] = useState<'all' | string>('all')

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		return actions.filter((a) => {
			if (status === 'completed' && !a.completed) return false
			if (status === 'incomplete' && a.completed) return false
			if (type !== 'all' && a.type !== type) return false
			if (priority !== 'all' && (a.priority || 'medium') !== priority) return false
			if (!q) return true
			return (
				a.title.toLowerCase().includes(q) ||
				(a.description || '').toLowerCase().includes(q)
			)
		})
	}, [actions, priority, query, status, type])

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 w-full">
				<div className="flex items-center gap-2 w-full">
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={labels.searchPlaceholder}
							className="pl-9 bg-background/50 w-full"
						/>
					</div>
				</div>

				<div className="hidden md:flex md:flex-wrap md:gap-2">
					<div className="min-w-0 w-full md:w-[160px]">
						<Select value={status} onValueChange={(v) => setStatus(v as 'all' | 'completed' | 'incomplete')}>
							<SelectTrigger className="bg-background/50 h-9 text-sm px-2.5 w-full">
								<SelectValue placeholder={labels.allStatus} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{labels.allStatus}</SelectItem>
								<SelectItem value="incomplete">{labels.incomplete}</SelectItem>
								<SelectItem value="completed">{labels.completed}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="min-w-0 w-full md:w-[160px]">
						<Select value={type} onValueChange={setType}>
							<SelectTrigger className="bg-background/50 h-9 text-sm px-2.5 w-full">
								<SelectValue placeholder={labels.allType} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{labels.allType}</SelectItem>
								{Object.entries(typeLabelMap).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="min-w-0 w-full md:w-[160px]">
						<Select value={priority} onValueChange={setPriority}>
							<SelectTrigger className="bg-background/50 h-9 text-sm px-2.5 w-full">
								<SelectValue placeholder={labels.allPriority} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{labels.allPriority}</SelectItem>
								{Object.entries(priorityLabelMap).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="grid gap-2 md:hidden sm:grid-cols-[1fr_1fr]">
					<Select value={status} onValueChange={(v) => setStatus(v as 'all' | 'completed' | 'incomplete')}>
						<SelectTrigger>
							<SelectValue placeholder={labels.allStatus} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{labels.allStatus}</SelectItem>
							<SelectItem value="incomplete">{labels.incomplete}</SelectItem>
							<SelectItem value="completed">{labels.completed}</SelectItem>
						</SelectContent>
					</Select>
					<Select value={type} onValueChange={setType}>
						<SelectTrigger>
							<SelectValue placeholder={labels.allType} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{labels.allType}</SelectItem>
							{Object.entries(typeLabelMap).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={priority} onValueChange={setPriority}>
						<SelectTrigger>
							<SelectValue placeholder={labels.allPriority} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{labels.allPriority}</SelectItem>
							{Object.entries(priorityLabelMap).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="text-sm text-muted-foreground">{emptyLabel}</div>
			) : (
				filtered.map((a) => (
					<div key={a.id} className="rounded-md border border-border/50 bg-muted/20 p-3">
						<div className="text-sm font-medium">{a.title}</div>
						{a.description ? (
							<div className="mt-1 text-xs text-muted-foreground">
								<RichText text={a.description} />
							</div>
						) : null}
						<div className="mt-2 text-xs text-muted-foreground">
							{a.completed ? completedLabel : incompleteLabel} · {typeLabelMap[a.type] || a.type} · {priorityLabelMap[a.priority] || a.priority}
						</div>
					</div>
				))
			)}
		</div>
	)
}
