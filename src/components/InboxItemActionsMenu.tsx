'use client'

import { useTransition, useState } from 'react'
import type en from '@/i18n/en.json'
import { MoreHorizontal, Pencil, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { archiveInboxItem } from '@/app/(authenticated)/inbox/actions'
import { EditInboxItemDialog } from '@/components/EditInboxItemDialog'
import { ConfirmDeleteInboxItemDialog } from '@/components/ConfirmDeleteInboxItemDialog'

type Dict = typeof en

export function InboxItemActionsMenu({
	item,
	dict
}: {
	item: { id: string; content: string; note: string; tags: string[] }
	dict: Dict
}) {
	const [open, setOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [isArchiving, startArchiving] = useTransition()

	function handleArchive() {
		startArchiving(async () => {
			const formData = new FormData()
			formData.set('id', item.id)
			await archiveInboxItem(formData)
			setOpen(false)
		})
	}

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-9 w-9 rounded-full sm:hidden"
						aria-label={dict.inbox.moreActions}
						title={dict.inbox.moreActions}
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-xs">
					<DialogHeader>
						<DialogTitle>{dict.inbox.moreActions}</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Button
							type="button"
							variant="outline"
							className="w-full justify-start gap-2"
							onClick={() => {
								setOpen(false)
								setEditOpen(true)
							}}
						>
							<Pencil className="h-4 w-4" />
							<span>{dict.common.edit}</span>
						</Button>
						<Button
							type="button"
							variant="outline"
							className="w-full justify-start gap-2"
							onClick={handleArchive}
							disabled={isArchiving}
						>
							{isArchiving ? <LoadingSpinner size={16} /> : <Archive className="h-4 w-4" />}
							<span>{dict.inbox.archiveAction}</span>
						</Button>
						<ConfirmDeleteInboxItemDialog
							id={item.id}
							dict={dict}
							trigger={
								<Button type="button" variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
									<Trash2 className="h-4 w-4" />
									<span>{dict.common.delete}</span>
								</Button>
							}
						/>
					</div>
				</DialogContent>
			</Dialog>
			<EditInboxItemDialog
				item={item}
				dict={dict}
				open={editOpen}
				onOpenChange={setEditOpen}
			/>
		</>
	)
}
