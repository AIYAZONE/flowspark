'use client'

import { useState } from 'react'
import { Archive, RotateCcw } from 'lucide-react'
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
import { updateGoalStatus } from '@/app/(authenticated)/goals/actions'

interface ArchiveGoalButtonProps {
    id: string
    isArchived: boolean
    dict: any // Using any to avoid complex type duplication, or we can define a smaller interface
}

export function ArchiveGoalButton({ id, isArchived, dict }: ArchiveGoalButtonProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleArchive() {
        setIsLoading(true)
        try {
            await updateGoalStatus(id, isArchived ? 'active' : 'archived')
            setOpen(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isArchived) {
         return (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleArchive} 
                disabled={isLoading}
                className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
                <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                    {isLoading ? <LoadingSpinner size={16} /> : <RotateCcw className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium">{dict.goals.detail.unarchive}</span>
            </Button>
         )
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                    <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                        <Archive className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{dict.goals.detail.archive}</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dict.goals.detail.archiveConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dict.goals.detail.archiveConfirmDesc}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{dict.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault()
                            handleArchive()
                        }}
                        disabled={isLoading}
                    >
                        {isLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground" />}
                        {dict.goals.detail.archive}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
