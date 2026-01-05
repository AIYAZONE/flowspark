'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteGoal } from '@/app/(authenticated)/goals/actions'

interface DeleteGoalButtonProps {
    id: string
    title: string
    dict: {
        common: {
            delete: string
            confirmDelete: string
            cancel: string
        }
    }
}

export function DeleteGoalButton({ id, title, dict }: DeleteGoalButtonProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const formData = new FormData()
            formData.set('id', id)
            await deleteGoal(formData)
            setOpen(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                    disabled={isDeleting}
                >
                    <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                        <Trash2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{dict.common.delete}</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dict.common.delete} {title}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dict.common.confirmDelete}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>{dict.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                    >
                        {isDeleting && <LoadingSpinner size={16} className="mr-2 text-destructive-foreground" />}
                        {dict.common.delete || '删除'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
