'use client'

import { useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BasicRichTextEditor } from '@/components/BasicRichTextEditor'
import { updateGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { useMobileInputVisible, useMobileKeyboardInset } from '@/components/ui/use-mobile-input-visible'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ModalActionFooter } from '@/components/ModalActionFooter'
import { ModalHeaderActions } from '@/components/ModalHeaderActions'
import { DESKTOP_MODAL_SHELL_CLASS } from '@/components/responsive-classes'

type Dict = typeof en

export function EditGoalEntryDialog({
	entry,
	goalId,
	dict,
	trigger,
	onSuccess
}: {
	entry: { id: string; kind: 'inspiration' | 'journey'; content: string; note: string }
	goalId: string
	dict: Dict
	trigger: React.ReactNode
	onSuccess?: () => void
}) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const contentRef = useRef<HTMLDivElement | null>(null)

	const [content, setContent] = useState(entry.content)
	const [note, setNote] = useState(entry.note || '')

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) {
			setIsDesktopFullscreen(false)
			return
		}
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
				onSuccess?.()
				setOpen(false)
				router.refresh()
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
	const desktopDialogClassName = isDesktopFullscreen
		? 'md:inset-0! md:h-dvh! md:w-screen! md:max-w-none! md:translate-x-0! md:translate-y-0! md:rounded-none! md:border-0!'
		: 'md:left-[50%]! md:right-auto! md:top-[50%]! md:bottom-auto! md:h-auto! md:w-full! md:max-w-3xl! md:translate-x-[-50%]! md:translate-y-[-50%]! md:rounded-lg! md:border!'
	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogFormContent
				mobileMode={isJourney ? 'fullscreen' : 'sheet'}
				hideCloseButton
				className={cn('p-0', DESKTOP_MODAL_SHELL_CLASS, desktopDialogClassName)}
			>
				<div className={cn('flex flex-col', isDesktopFullscreen ? 'h-full' : 'h-full md:max-h-[90dvh]')}>
					<DialogHeader
						className="border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6"
					>
						<div className="flex items-start justify-between gap-3">
							<DialogTitle className="min-w-0 flex-1 text-left leading-snug">{title}</DialogTitle>
							<ModalHeaderActions
								isFullscreen={isDesktopFullscreen}
								onToggleFullscreen={() => setIsDesktopFullscreen((value) => !value)}
								fullscreenLabel={dict.common.fullscreen}
								exitFullscreenLabel={dict.common.exitFullscreen}
								hideFullscreenOnMobile
								renderCloseButton={(button) => <DialogClose asChild>{button}</DialogClose>}
							/>
						</div>
					</DialogHeader>
					<form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
						<input type="hidden" name="id" value={entry.id} />
						<input type="hidden" name="goal_id" value={goalId} />

						<div
							className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6"
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
									minHeightClassName={entry.kind === 'journey' ? 'min-h-[180px] md:min-h-[220px]' : 'min-h-[160px] md:min-h-[200px]'}
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
									rows={entry.kind === 'journey' ? 10 : 6}
									className={entry.kind === 'journey' ? 'min-h-[38dvh] md:min-h-[320px]' : 'min-h-[28dvh] md:min-h-[240px]'}
								/>
							</div>

							{error ? <div className="text-sm text-destructive">{error}</div> : null}
						</div>

						<ModalActionFooter insetBottom={open && keyboardInset > 0 ? `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` : undefined}>
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
						</ModalActionFooter>
					</form>
				</div>
			</DialogFormContent>
		</Dialog>
	)
}
