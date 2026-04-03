'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { convertInboxItemToAction } from '@/app/(authenticated)/inbox/actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Dict = typeof en

export function ConvertInboxToActionDialog({
	item,
	activeGoals,
	dict,
	startDefault,
	endDefault,
	trigger
}: {
	item: { id: string; content: string; note: string; tags: string[] }
	activeGoals: { id: string; title: string }[]
	dict: Dict
	startDefault: string
	endDefault: string
	trigger: React.ReactNode
}) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const titleRef = useRef<HTMLInputElement | null>(null)

	const initialDescription = useMemo(() => {
		const parts: string[] = []
		if (item.note) parts.push(item.note)
		if (item.tags.length > 0) parts.push(item.tags.map((t) => `#${t}`).join(' '))
		return parts.join('\n\n')
	}, [item.note, item.tags])

	const [goalId, setGoalId] = useState<string>('')
	const [title, setTitle] = useState(item.content)
	const [description, setDescription] = useState(initialDescription)
	const [type, setType] = useState('core')
	const [priority, setPriority] = useState('medium')

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) return
		setError(null)
		setGoalId(activeGoals[0]?.id || '')
		setTitle(item.content)
		setDescription(initialDescription)
		setType('core')
		setPriority('medium')
	}

	useEffect(() => {
		if (!open) return
		if (!titleRef.current) return
		titleRef.current.focus()
	}, [open])

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await convertInboxItemToAction(formData)
				setOpen(false)
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{dict.inbox.convertTitle}</DialogTitle>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4">
					<input type="hidden" name="inbox_id" value={item.id} />
					<div className="space-y-2">
						<Label htmlFor={`goal-${item.id}`}>{dict.inbox.goalLabel}</Label>
						<Select value={goalId} onValueChange={setGoalId}>
							<SelectTrigger id={`goal-${item.id}`}>
								<SelectValue placeholder={dict.inbox.goalPlaceholder} />
							</SelectTrigger>
							<SelectContent>
								{activeGoals.map((g) => (
									<SelectItem key={g.id} value={g.id}>
										{g.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<input type="hidden" name="goal_id" value={goalId} />
					</div>

					<div className="space-y-2">
						<Label htmlFor={`title-${item.id}`}>{dict.inbox.actionTitleLabel}</Label>
						<Input
							ref={titleRef}
							id={`title-${item.id}`}
							name="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`desc-${item.id}`}>{dict.inbox.actionDescLabel}</Label>
						<Textarea
							id={`desc-${item.id}`}
							name="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
						/>
					</div>

					<DateRangeFields
						defaultStart={startDefault}
						defaultEnd={endDefault}
						labels={{
							start: dict.today.startTime,
							end: dict.today.endTime,
							error: dict.common.dateRangeInvalid
						}}
					/>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>{dict.today.typeLabel}</Label>
							<Select value={type} onValueChange={setType}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="core">{dict.today.types.core}</SelectItem>
									<SelectItem value="maintenance">{dict.today.types.maintenance}</SelectItem>
									<SelectItem value="learning">{dict.today.types.learning}</SelectItem>
									<SelectItem value="review">{dict.today.types.review}</SelectItem>
									<SelectItem value="rest">{dict.today.types.rest}</SelectItem>
								</SelectContent>
							</Select>
							<input type="hidden" name="type" value={type} />
						</div>

						<div className="space-y-2">
							<Label>{dict.today.priorityLabel}</Label>
							<Select value={priority} onValueChange={setPriority}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="high">{dict.goals.priority.high}</SelectItem>
									<SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
									<SelectItem value="low">{dict.goals.priority.low}</SelectItem>
								</SelectContent>
							</Select>
							<input type="hidden" name="priority" value={priority} />
						</div>
					</div>

					{error ? <div className="text-sm text-destructive">{error}</div> : null}

					<div className="flex items-center justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
							{dict.common.cancel}
						</Button>
						<Button type="submit" disabled={isPending || !goalId || !title.trim()}>
							{isPending ? (
								<>
									<LoadingSpinner className="mr-2 h-4 w-4" />
									{dict.common.saving}
								</>
							) : (
								dict.inbox.convertCta
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
