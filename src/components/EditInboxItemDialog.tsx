'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { updateInboxItem } from '@/app/(authenticated)/inbox/actions'

type Dict = typeof en

export function EditInboxItemDialog({
	item,
	dict,
	trigger,
	open: openProp,
	onOpenChange
}: {
	item: { id: string; content: string; note: string; tags: string[] }
	dict: Dict
	trigger?: React.ReactNode
	open?: boolean
	onOpenChange?: (next: boolean) => void
}) {
	const [openInternal, setOpenInternal] = useState(false)
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
		if (!next) return
		setError(null)
		setContent(item.content)
		setNote(item.note)
		setTags(initialTags)
	}

	useEffect(() => {
		if (!open) return
		contentRef.current?.focus()
	}, [open])

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await updateInboxItem(formData)
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
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{dict.inbox.editTitle}</DialogTitle>
				</DialogHeader>
				<form action={handleSubmit} className="space-y-4">
					<input type="hidden" name="id" value={item.id} />

					<div className="space-y-2">
						<Label htmlFor={`content-${item.id}`}>{dict.inbox.ideaContentLabel}</Label>
						<Textarea
							ref={contentRef}
							id={`content-${item.id}`}
							name="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={4}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`note-${item.id}`}>{dict.quickCapture.noteLabel}</Label>
						<Textarea
							id={`note-${item.id}`}
							name="note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							rows={3}
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
								dict.inbox.editCta
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
