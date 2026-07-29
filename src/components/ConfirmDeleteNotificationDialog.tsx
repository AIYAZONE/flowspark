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

type Dict = typeof en

export function ConfirmDeleteNotificationDialog({
	dict,
	trigger,
	title,
	description,
	onConfirm
}: {
	dict: Dict
	trigger: React.ReactNode
	title: string
	description: string
	onConfirm: () => Promise<void>
}) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()

	function handleConfirm() {
		startTransition(async () => {
			await onConfirm()
			setOpen(false)
		})
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>{dict.common.cancel}</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault()
							handleConfirm()
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
