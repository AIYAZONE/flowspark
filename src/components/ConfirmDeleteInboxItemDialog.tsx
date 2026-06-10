'use client'

import { useState, useTransition } from 'react'
import type en from '@/i18n/en.json'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { deleteInboxItem } from '@/app/(authenticated)/inbox/actions'

type Dict = typeof en

export function ConfirmDeleteInboxItemDialog({
	id,
	dict,
	trigger,
	onSuccess
}: {
	id: string
	dict: Dict
	trigger: React.ReactNode
	onSuccess?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()

	function handleDelete() {
		startTransition(async () => {
			const formData = new FormData()
			formData.set('id', id)
			await deleteInboxItem(formData)
			setOpen(false)
			onSuccess?.()
		})
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{dict.inbox.deleteConfirmTitle}</AlertDialogTitle>
					<AlertDialogDescription>{dict.inbox.deleteConfirmDesc}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>{dict.common.cancel}</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault()
							handleDelete()
						}}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={isPending}
					>
						{isPending ? (
							<>
								<LoadingSpinner size={16} className="mr-2 text-destructive-foreground" />
								{dict.common.saving}
							</>
						) : (
							dict.common.delete
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
