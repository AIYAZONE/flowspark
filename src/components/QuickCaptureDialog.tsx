'use client'

import { useRef, useState, useTransition } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
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
	const contentRef = useRef<HTMLInputElement | null>(null)

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
		? 'sm:inset-0! sm:h-dvh! sm:w-screen! sm:max-w-none! sm:translate-x-0! sm:translate-y-0! sm:rounded-none! sm:border-0!'
		: 'sm:left-[50%]! sm:right-auto! sm:top-[50%]! sm:bottom-auto! sm:h-auto! sm:w-full! sm:max-w-3xl! sm:translate-x-[-50%]! sm:translate-y-[-50%]! sm:rounded-lg! sm:border! sm:pb-6!'

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogFormContent mobileMode="fullscreen" hideCloseButton className={cn('p-0', desktopDialogClassName)}>
				<div className={cn('flex flex-col', isDesktopFullscreen ? 'h-full' : 'h-full sm:max-h-[90dvh]')}>
					<DialogHeader className="border-b border-border/60 px-4 pb-3 pt-4 text-left sm:px-6 sm:pb-4 sm:pt-6">
						<div className="flex items-start justify-between gap-3">
							<DialogTitle className="min-w-0 flex-1 text-left leading-snug">{dict.quickCapture.title}</DialogTitle>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="hidden h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
									onClick={() => setIsDesktopFullscreen((value) => !value)}
								>
									{isDesktopFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
									<span className="sr-only">
										{isDesktopFullscreen ? dict.common.exitFullscreen : dict.common.fullscreen}
									</span>
								</Button>
								<DialogClose asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
									>
										<X className="h-4 w-4" />
										<span className="sr-only">Close</span>
									</Button>
								</DialogClose>
							</div>
						</div>
					</DialogHeader>

					<form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
						<div
							className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
							style={{ paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined }}
						>
							<div className="space-y-2">
								<Label htmlFor="content" required>
									{dict.quickCapture.contentLabel}
								</Label>
								<Input
									ref={contentRef}
									id="content"
									name="content"
									placeholder={dict.quickCapture.contentPlaceholder}
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

						<div
							className="border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:bg-background/95 sm:px-6 sm:py-4"
							style={{ paddingBottom: open && keyboardInset > 0 ? `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` : undefined }}
						>
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
						</div>
					</form>
				</div>
			</DialogFormContent>
		</Dialog>
	)
}
