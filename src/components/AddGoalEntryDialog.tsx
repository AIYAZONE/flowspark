'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import type en from '@/i18n/en.json'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createGoalEntry } from '@/app/(authenticated)/goals/entries/actions'

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
	const contentRef = useRef<HTMLInputElement | null>(null)

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) return
		setError(null)
		setContent('')
		setNote('')
	}

	useEffect(() => {
		if (!open) return
		if (!contentRef.current) return
		contentRef.current.focus()
	}, [open])

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
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4">
					<input type="hidden" name="goal_id" value={goalId} />
					<input type="hidden" name="kind" value={kind} />

					<div className="space-y-2">
						<Label htmlFor={`content-${kind}`}>{dict.quickCapture.contentLabel}</Label>
						<Input
							ref={contentRef}
							id={`content-${kind}`}
							name="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder={dict.quickCapture.contentPlaceholder}
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
							placeholder={dict.quickCapture.notePlaceholder}
							rows={4}
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
									<LoadingSpinner className="mr-2 h-4 w-4" />
									{dict.common.saving}
								</>
							) : (
								dict.common.save
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

