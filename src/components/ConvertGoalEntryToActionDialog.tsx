'use client'

import { useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { convertGoalEntryToAction } from '@/app/(authenticated)/goals/entries/actions'
import { useMobileInputVisible } from '@/components/ui/use-mobile-input-visible'

type Dict = typeof en

export function ConvertGoalEntryToActionDialog({
	entry,
	goalId,
	dict,
	startDefault,
	endDefault,
	trigger
}: {
	entry: { id: string; content: string; note: string }
	goalId: string
	dict: Dict
	startDefault: string
	endDefault: string
	trigger: React.ReactNode
}) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const titleRef = useRef<HTMLInputElement | null>(null)

	const [title, setTitle] = useState(entry.content)
	const [description, setDescription] = useState(entry.note || '')
	const [type, setType] = useState('core')
	const [priority, setPriority] = useState('medium')

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) return
		setError(null)
		setTitle(entry.content)
		setDescription(entry.note || '')
		setType('core')
		setPriority('medium')
	}

	useMobileInputVisible(open, titleRef)

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await convertGoalEntryToAction(formData)
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
			<DialogFormContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{dict.goals.detail.convertToAction}</DialogTitle>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4">
					<input type="hidden" name="entry_id" value={entry.id} />
					<input type="hidden" name="goal_id" value={goalId} />

					<div className="space-y-2">
						<Label htmlFor={`title-${entry.id}`}>{dict.inbox.actionTitleLabel}</Label>
						<Input
							ref={titleRef}
							id={`title-${entry.id}`}
							name="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`desc-${entry.id}`}>{dict.inbox.actionDescLabel}</Label>
						<Textarea
							id={`desc-${entry.id}`}
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
						<Button type="submit" disabled={isPending || !title.trim()}>
							{isPending ? (
								<>
									<LoadingSpinner className="mr-2 h-4 w-4" />
									{dict.common.saving}
								</>
							) : (
								dict.goals.detail.convertToAction
							)}
						</Button>
					</div>
				</form>
			</DialogFormContent>
		</Dialog>
	)
}
