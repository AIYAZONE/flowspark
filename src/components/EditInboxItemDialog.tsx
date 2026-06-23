'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { updateInboxItem } from '@/app/(authenticated)/inbox/actions'
import { useMobileInputVisible, useMobileKeyboardInset } from '@/components/ui/use-mobile-input-visible'
import { cn } from '@/lib/utils'
import { ModalActionFooter } from '@/components/ModalActionFooter'
import { ModalHeaderActions } from '@/components/ModalHeaderActions'
import { DESKTOP_MODAL_SHELL_CLASS } from '@/components/responsive-classes'

type Dict = typeof en

export function EditInboxItemDialog({
	item,
	dict,
	trigger,
	open: openProp,
	onOpenChange,
	onSuccess
}: {
	item: { id: string; content: string; note: string; tags: string[] }
	dict: Dict
	trigger?: React.ReactNode
	open?: boolean
	onOpenChange?: (next: boolean) => void
	onSuccess?: () => void
}) {
	const [openInternal, setOpenInternal] = useState(false)
	const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const contentRef = useRef<HTMLTextAreaElement | null>(null)
	const open = openProp ?? openInternal

	function setOpen(next: boolean) {
		if (onOpenChange) onOpenChange(next)
		if (openProp === undefined) setOpenInternal(next)
	}

	const initialTags = useMemo(() => item.tags.join(', '), [item.tags])
	const [content, setContent] = useState(item.content)
	const [note, setNote] = useState(item.note)
	const [tags, setTags] = useState(initialTags)

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) {
			setIsDesktopFullscreen(false)
			return
		}
		setError(null)
		setContent(item.content)
		setNote(item.note)
		setTags(initialTags)
	}

	useMobileInputVisible(open, contentRef)
	const keyboardInset = useMobileKeyboardInset(open)

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await updateInboxItem(formData)
				setOpen(false)
				onSuccess?.()
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogFormContent
				mobileMode="fullscreen"
				hideCloseButton
				className={cn(
					'p-0',
					DESKTOP_MODAL_SHELL_CLASS,
					isDesktopFullscreen
						? 'md:inset-0! md:h-dvh! md:w-screen! md:max-w-none! md:translate-x-0! md:translate-y-0! md:rounded-none! md:border-0!'
						: 'md:left-[50%]! md:right-auto! md:top-[50%]! md:bottom-auto! md:h-auto! md:w-full! md:max-w-3xl! md:translate-x-[-50%]! md:translate-y-[-50%]! md:rounded-lg! md:border!'
				)}
			>
				<div className={cn('flex flex-col', isDesktopFullscreen ? 'h-full' : 'h-full md:max-h-[90dvh]')}>
					<DialogHeader className="border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6">
						<div className="flex items-start justify-between gap-3">
							<DialogTitle className="min-w-0 flex-1 text-left leading-snug">{dict.inbox.editTitle}</DialogTitle>
							<ModalHeaderActions
								isFullscreen={isDesktopFullscreen}
								onToggleFullscreen={() => setIsDesktopFullscreen((value) => !value)}
								fullscreenLabel={dict.common.fullscreen}
								exitFullscreenLabel={dict.common.exitFullscreen}
								renderCloseButton={(button) => <DialogClose asChild>{button}</DialogClose>}
							/>
						</div>
					</DialogHeader>

					<form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
						<input type="hidden" name="id" value={item.id} />

						<div
							className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6"
							style={{ paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined }}
						>
							<div className="space-y-2">
								<Label htmlFor={`content-${item.id}`}>{dict.inbox.ideaContentLabel}</Label>
								<Textarea
									ref={contentRef}
									id={`content-${item.id}`}
									name="content"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder={dict.quickCapture.contentPlaceholder}
									rows={8}
									required
									className="min-h-[30dvh] md:min-h-[220px]"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`note-${item.id}`}>{dict.quickCapture.noteLabel}</Label>
								<Textarea
									id={`note-${item.id}`}
									name="note"
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder={dict.quickCapture.notePlaceholder}
									rows={8}
									className="min-h-[28dvh] md:min-h-[220px]"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`tags-${item.id}`}>{dict.quickCapture.tagsLabel}</Label>
								<Input
									id={`tags-${item.id}`}
									name="tags"
									value={tags}
									onChange={(e) => setTags(e.target.value)}
									placeholder={dict.quickCapture.tagsPlaceholder}
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
										dict.inbox.editCta
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
