'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createAction } from '@/app/(authenticated)/goals/actions'

interface AddActionDialogProps {
    goalId?: string
    activeGoals?: { id: string; title: string }[]
    dict: {
        goals: {
            detail: {
                addAction: string
            }
            priority: {
                high: string
                medium: string
                low: string
            }
        }
        today: {
            goalLabel: string
            selectGoal: string
            actionTitleLabel: string
            actionTitlePlaceholder: string
            descriptionLabel: string
            descriptionPlaceholder: string
            typeLabel: string
            priorityLabel: string
            startTime: string
            endTime: string
            types: {
                core: string
                maintenance: string
                learning: string
                review: string
                rest: string
            }
        }
        common: {
            dateRangeInvalid: string
        }
    }
}

export function AddActionDialog({ goalId, activeGoals, dict }: AddActionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [valid, setValid] = useState(true)

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

    const today = new Date().toISOString().split('T')[0]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    {dict.goals.detail.addAction}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{dict.goals.detail.addAction}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 mt-4">
                    {goalId ? (
                        <input type="hidden" name="goal_id" value={goalId} />
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="goal_id">{dict.today.goalLabel}</Label>
                            <select
                                name="goal_id"
                                id="goal_id"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                                defaultValue=""
                            >
                                <option value="" disabled>{dict.today.selectGoal}</option>
                                {activeGoals?.map(goal => (
                                    <option key={goal.id} value={goal.id}>{goal.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="title">{dict.today.actionTitleLabel}</Label>
                        <Input id="title" name="title" placeholder={dict.today.actionTitlePlaceholder} required />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">{dict.today.descriptionLabel}</Label>
                        <Textarea id="description" name="description" placeholder={dict.today.descriptionPlaceholder} className="min-h-[120px]" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">{dict.today.typeLabel}</Label>
                            <select
                                name="type"
                                id="type"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="core">{dict.today.types.core}</option>
                                <option value="maintenance">{dict.today.types.maintenance}</option>
                                <option value="learning">{dict.today.types.learning}</option>
                                <option value="review">{dict.today.types.review}</option>
                                <option value="rest">{dict.today.types.rest}</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">{dict.today.priorityLabel}</Label>
                            <select
                                name="priority"
                                id="priority"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue="medium"
                            >
                                <option value="high">{dict.goals.priority.high}</option>
                                <option value="medium">{dict.goals.priority.medium}</option>
                                <option value="low">{dict.goals.priority.low}</option>
                            </select>
                        </div>
                    </div>

                    <DateRangeFields
                        defaultStart={today}
                        defaultEnd={today}
                        labels={{
                            start: dict.today.startTime,
                            end: dict.today.endTime,
                            error: dict.common.dateRangeInvalid
                        }}
                        onValidityChange={setValid}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading || !valid}>
                        {isLoading ? (
                            <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {dict.goals.detail.addAction}
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
