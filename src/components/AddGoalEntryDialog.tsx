'use client'

import { useRef, useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import type en from '@/i18n/en.json'
import { Dialog, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { useMobileInputVisible } from '@/components/ui/use-mobile-input-visible'

type Dict = typeof en

export function AddGoalEntryDialog({
	goalId,
	kind,
	dict,
	trigger
}: {
	goalId: string
	kind: 'inspiration' | 'journey'
	dict: Dict
	trigger?: React.ReactNode | null
}) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [content, setContent] = useState('')
	const [note, setNote] = useState('')
	const contentRef = useRef<HTMLTextAreaElement | null>(null)

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) return
		setError(null)
		setContent('')
		setNote('')
	}

	useMobileInputVisible(open, contentRef)

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await createGoalEntry(formData)
				setOpen(false)
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	const title =
		kind === 'inspiration' ? dict.goals.detail.addInspiration : dict.goals.detail.addJourney
	const contentPlaceholder =
		kind === 'inspiration'
			? dict.goals.detail.inspirationContentPlaceholder
			: dict.goals.detail.journeyContentPlaceholder
	const notePlaceholder =
		kind === 'inspiration'
			? dict.goals.detail.inspirationNotePlaceholder
			: dict.goals.detail.journeyNotePlaceholder

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				{trigger ? (
					trigger
				) : (
					<Button size="sm" className="gap-1">
						<Sparkles className="h-4 w-4" />
						{title}
					</Button>
				)}
			</DialogTrigger>
			<DialogFormContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4">
					<input type="hidden" name="goal_id" value={goalId} />
					<input type="hidden" name="kind" value={kind} />

					<div className="space-y-2">
						<Label htmlFor={`content-${kind}`}>{dict.goals.detail.entryContentLabel}</Label>
						<Textarea
							ref={contentRef}
							id={`content-${kind}`}
							name="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder={contentPlaceholder}
							rows={3}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`note-${kind}`}>{dict.quickCapture.noteLabel}</Label>
						<Textarea
							id={`note-${kind}`}
							name="note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={notePlaceholder}
							rows={5}
						/>
					</div>

					{error ? <div className="text-sm text-destructive">{error}</div> : null}

					<div className="flex items-center justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
							{dict.common.cancel}
						</Button>
						<Button type="submit" disabled={isPending || !content.trim()}>
							{isPending ? (
								<>
									<LoadingSpinner className="mr-2 h-4 w-4 text-current" />
									{dict.common.saving}
								</>
							) : (
								dict.common.save
							)}
						</Button>
					</div>
				</form>
			</DialogFormContent>
		</Dialog>
	)
}
