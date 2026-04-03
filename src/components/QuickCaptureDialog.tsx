'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createInboxItem } from '@/app/(authenticated)/inbox/actions'

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
	const contentRef = useRef<HTMLInputElement | null>(null)

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen)
		if (nextOpen) {
			setExpanded(false)
			setError(null)
		}
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
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{dict.quickCapture.title}</DialogTitle>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4">
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
								<Textarea id="note" name="note" rows={4} placeholder={dict.quickCapture.notePlaceholder} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="tags">{dict.quickCapture.tagsLabel}</Label>
								<Input id="tags" name="tags" placeholder={dict.quickCapture.tagsPlaceholder} />
							</div>
						</div>
					) : null}

					<div className="flex items-center justify-between">
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

					{error ? <div className="text-sm text-destructive">{error}</div> : null}
				</form>
			</DialogContent>
		</Dialog>
	)
}
