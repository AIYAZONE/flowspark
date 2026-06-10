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
import { deleteGoalEntry } from '@/app/(authenticated)/goals/entries/actions'

type Dict = typeof en

export function ConfirmDeleteGoalEntryDialog({
	id,
	goalId,
	dict,
	trigger,
	onSuccess
}: {
	id: string
	goalId: string
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
			formData.set('goal_id', goalId)
			await deleteGoalEntry(formData)
			setOpen(false)
			onSuccess?.()
		})
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{dict.goals.detail.deleteEntryConfirmTitle}</AlertDialogTitle>
					<AlertDialogDescription>{dict.goals.detail.deleteEntryConfirmDesc}</AlertDialogDescription>
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
