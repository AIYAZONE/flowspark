'use client'

import { useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createInboxItem } from '@/app/(authenticated)/inbox/actions'
import { useMobileInputVisible, useMobileKeyboardInset } from '@/components/ui/use-mobile-input-visible'
import { cn } from '@/lib/utils'
import { ModalHeaderActions } from '@/components/ModalHeaderActions'
import { ModalActionFooter } from '@/components/ModalActionFooter'
import { DESKTOP_MODAL_SHELL_CLASS } from '@/components/responsive-classes'

type Dict = typeof en

export function QuickCaptureDialog({
	dict,
	trigger
}: {
	dict: Dict
	trigger: React.ReactNode
}) {
	const [open, setOpen] = useState(false)
	const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false)
	const [expanded, setExpanded] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const contentRef = useRef<HTMLTextAreaElement | null>(null)

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen)
		if (!nextOpen) {
			setIsDesktopFullscreen(false)
			return
		}
		setExpanded(false)
		setError(null)
	}

	useMobileInputVisible(open, contentRef)
	const keyboardInset = useMobileKeyboardInset(open)

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await createInboxItem(formData)
				setOpen(false)
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	const desktopDialogClassName = isDesktopFullscreen
		? 'md:inset-0! md:h-dvh! md:w-screen! md:max-w-none! md:translate-x-0! md:translate-y-0! md:rounded-none! md:border-0!'
		: 'md:left-[50%]! md:right-auto! md:top-[50%]! md:bottom-auto! md:h-auto! md:w-full! md:max-w-3xl! md:translate-x-[-50%]! md:translate-y-[-50%]! md:rounded-lg! md:border!'

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogFormContent mobileMode="fullscreen" hideCloseButton className={cn('p-0', DESKTOP_MODAL_SHELL_CLASS, desktopDialogClassName)}>
				<div className={cn('flex flex-col', isDesktopFullscreen ? 'h-full' : 'h-full md:max-h-[90dvh]')}>
					<DialogHeader className="border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6">
						<div className="flex items-start justify-between gap-3">
							<DialogTitle className="min-w-0 flex-1 text-left leading-snug">{dict.quickCapture.title}</DialogTitle>
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
						<div
							className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6"
							style={{ paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined }}
						>
							<div className="space-y-2">
								<Label htmlFor="content" required>
									{dict.quickCapture.contentLabel}
								</Label>
								<Textarea
									ref={contentRef}
									id="content"
									name="content"
									placeholder={dict.quickCapture.contentPlaceholder}
									rows={7}
									className="min-h-[30dvh] md:min-h-[220px]"
									required
								/>
							</div>

							{expanded ? (
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="note">{dict.quickCapture.noteLabel}</Label>
										<Textarea id="note" name="note" rows={5} placeholder={dict.quickCapture.notePlaceholder} />
									</div>
									<div className="space-y-2">
										<Label htmlFor="tags">{dict.quickCapture.tagsLabel}</Label>
										<Input id="tags" name="tags" placeholder={dict.quickCapture.tagsPlaceholder} />
									</div>
								</div>
							) : null}

							{error ? <div className="text-sm text-destructive">{error}</div> : null}
						</div>

						<ModalActionFooter insetBottom={open && keyboardInset > 0 ? `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` : undefined}>
							<div className="flex items-center justify-between gap-2">
								<Button type="button" variant="ghost" onClick={() => setExpanded((v) => !v)} disabled={isPending}>
									{expanded ? dict.common.showLess : dict.common.showMore}
								</Button>
								<div className="flex items-center gap-2">
									<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
										{dict.common.cancel}
									</Button>
									<Button type="submit" disabled={isPending}>
										{isPending ? (
											<>
												<LoadingSpinner className="mr-2 h-4 w-4" />
												{dict.common.saving}
											</>
										) : (
											dict.quickCapture.saveCta
										)}
									</Button>
								</div>
							</div>
						</ModalActionFooter>
					</form>
				</div>
			</DialogFormContent>
		</Dialog>
	)
}
