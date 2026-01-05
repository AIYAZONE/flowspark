'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
                label: string
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
            saving: string
        }
    }
    tz?: string
}

export function AddActionDialog({ goalId, activeGoals, dict, tz = 'Asia/Shanghai' }: AddActionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [valid, setValid] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            try {
                await createAction(formData)
                setOpen(false)
            } catch (error) {
                console.error(error)
                setError(error instanceof Error ? error.message : 'Failed to create action')
            }
        })
    }

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

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
                            <Select name="goal_id" defaultValue="" required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={dict.today.selectGoal} />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeGoals?.map(goal => (
                                        <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <Select name="type" defaultValue="core">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={dict.today.typeLabel} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="core">{dict.today.types.core}</SelectItem>
                                    <SelectItem value="maintenance">{dict.today.types.maintenance}</SelectItem>
                                    <SelectItem value="learning">{dict.today.types.learning}</SelectItem>
                                    <SelectItem value="review">{dict.today.types.review}</SelectItem>
                                    <SelectItem value="rest">{dict.today.types.rest}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">{dict.today.priorityLabel}</Label>
                            <Select name="priority" defaultValue="medium">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={dict.goals.priority.label} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">{dict.goals.priority.high}</SelectItem>
                                    <SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
                                    <SelectItem value="low">{dict.goals.priority.low}</SelectItem>
                                </SelectContent>
                            </Select>
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

                    <Button type="submit" className="w-full" disabled={isPending || !valid}>
                        {isPending ? (
                            <>
                                <LoadingSpinner size={16} className="mr-2 text-current" />
                                {dict.common.saving}
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
