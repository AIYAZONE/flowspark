'use client'

import { useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BasicRichTextEditor } from '@/components/BasicRichTextEditor'
import { updateGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { useMobileInputVisible, useMobileKeyboardInset } from '@/components/ui/use-mobile-input-visible'
import { cn } from '@/lib/utils'

type Dict = typeof en

export function EditGoalEntryDialog({
	entry,
	goalId,
	dict,
	trigger
}: {
	entry: { id: string; kind: 'inspiration' | 'journey'; content: string; note: string }
	goalId: string
	dict: Dict
	trigger: React.ReactNode
}) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const contentRef = useRef<HTMLDivElement | null>(null)

	const [content, setContent] = useState(entry.content)
	const [note, setNote] = useState(entry.note || '')

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) return
		setError(null)
		setContent(entry.content)
		setNote(entry.note || '')
	}

	useMobileInputVisible(open, contentRef)
	const keyboardInset = useMobileKeyboardInset(open)

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await updateGoalEntry(formData)
				setOpen(false)
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	const title =
		entry.kind === 'inspiration' ? dict.goals.detail.editInspiration : dict.goals.detail.editJourney
	const contentPlaceholder =
		entry.kind === 'inspiration'
			? dict.goals.detail.inspirationContentPlaceholder
			: dict.goals.detail.journeyContentPlaceholder
	const notePlaceholder =
		entry.kind === 'inspiration'
			? dict.goals.detail.inspirationNotePlaceholder
			: dict.goals.detail.journeyNotePlaceholder
	const isJourney = entry.kind === 'journey'

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogFormContent
				mobileMode={isJourney ? 'fullscreen' : 'sheet'}
				className={cn('p-0', isJourney ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
			>
				<div className={cn('flex flex-col', isJourney ? 'h-full sm:max-h-[90dvh]' : 'max-h-[85dvh] sm:max-h-none')}>
					<DialogHeader className="border-b border-border/60 px-4 pb-3 pt-5 text-left sm:border-b-0 sm:px-6 sm:pb-0 sm:pt-6">
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
						<input type="hidden" name="id" value={entry.id} />
						<input type="hidden" name="goal_id" value={goalId} />

						<div
							className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
							style={{ paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined }}
						>
							<div className="space-y-2">
								<Label htmlFor={`content-edit-${entry.id}`}>{dict.goals.detail.entryContentLabel}</Label>
								<BasicRichTextEditor
									ref={contentRef}
									id={`content-edit-${entry.id}`}
									name="content"
									value={content}
									onChange={setContent}
									placeholder={contentPlaceholder}
									minHeightClassName={isJourney ? 'min-h-[180px] sm:min-h-[220px]' : 'min-h-[140px]'}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`note-edit-${entry.id}`}>{dict.quickCapture.noteLabel}</Label>
								<Textarea
									id={`note-edit-${entry.id}`}
									name="note"
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder={notePlaceholder}
									rows={isJourney ? 10 : 5}
									className={isJourney ? 'min-h-[38dvh] sm:min-h-[320px]' : undefined}
								/>
							</div>

							{error ? <div className="text-sm text-destructive">{error}</div> : null}
						</div>

						<div
							className="border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:border-t-0 sm:bg-transparent sm:px-6 sm:pt-0"
							style={{ paddingBottom: open && keyboardInset > 0 ? `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` : undefined }}
						>
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
						</div>
					</form>
				</div>
			</DialogFormContent>
		</Dialog>
	)
}
