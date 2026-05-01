'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createInboxItem } from '@/app/(authenticated)/inbox/actions'
import { useMobileInputVisible } from '@/components/ui/use-mobile-input-visible'

type Dict = typeof en

export function QuickCaptureDialog({
	dict,
	trigger
}: {
	dict: Dict
	trigger: React.ReactNode
}) {
	const [open, setOpen] = useState(false)
	const [expanded, setExpanded] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const [keyboardInset, setKeyboardInset] = useState(0)
	const contentRef = useRef<HTMLInputElement | null>(null)

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen)
		if (nextOpen) {
			setExpanded(false)
			setError(null)
		}
	}

	useMobileInputVisible(open, contentRef)

	useEffect(() => {
		if (!open) return
		if (typeof window === 'undefined' || !window.visualViewport) return
		const vv = window.visualViewport
		const updateInset = () => {
			const inset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
			setKeyboardInset(inset)
		}
		updateInset()
		vv.addEventListener('resize', updateInset)
		vv.addEventListener('scroll', updateInset)
		return () => {
			vv.removeEventListener('resize', updateInset)
			vv.removeEventListener('scroll', updateInset)
		}
	}, [open])

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

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogFormContent mobileMode="fullscreen" className="sm:max-w-md">
				<div className="flex h-dvh flex-col sm:h-auto">
					<DialogHeader className="border-b border-border/60 px-4 pb-3 pt-5 text-left sm:border-b-0 sm:px-0 sm:pb-0 sm:pt-0">
						<DialogTitle>{dict.quickCapture.title}</DialogTitle>
					</DialogHeader>

					<form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
						<div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-0" style={{ paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined }}>
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
							className="border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0"
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
