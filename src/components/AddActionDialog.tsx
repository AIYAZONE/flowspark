'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createAction } from '@/app/(authenticated)/goals/actions'

interface AddActionDialogProps {
    goalId: string
    dict: any
}

export function AddActionDialog({ goalId, dict }: AddActionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            await createAction(formData)
            setOpen(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    {dict.goals.detail.addAction}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dict.goals.detail.addAction}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 mt-4">
                    <input type="hidden" name="goal_id" value={goalId} />

                    <div className="grid gap-2">
                        <Label htmlFor="title">{dict.today.actionTitleLabel}</Label>
                        <Input id="title" name="title" placeholder={dict.today.actionTitlePlaceholder} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type">{dict.today.typeLabel}</Label>
                        <select
                            name="type"
                            id="type"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="core">{dict.today.types.core}</option>
                            <option value="maintain">{dict.today.types.maintain}</option>
                            <option value="explore">{dict.today.types.explore}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start_date">{dict.today.startTime}</Label>
                            <Input
                                id="start_date"
                                name="start_date"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end_date">{dict.today.endTime}</Label>
                            <Input
                                id="end_date"
                                name="end_date"
                                type="date"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Saving..." : dict.goals.detail.addAction}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
