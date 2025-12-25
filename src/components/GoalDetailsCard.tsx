'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateGoal } from '@/app/(authenticated)/goals/actions'
import { DeleteGoalButton } from '@/components/DeleteGoalButton'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import type en from '@/i18n/en.json'

interface Goal {
    id: string
    title: string
    description: string
    start_date: string
    end_date: string
    success_criteria: string
    stop_criteria: string
    status: string
    priority?: string
    category?: string
}

interface GoalDetailsCardProps {
    goal: Goal
    dict: typeof en
}

export function GoalDetailsCard({ goal, dict }: GoalDetailsCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            await updateGoal(formData)
            setIsEditing(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isEditing) {
        return (
            <Card className="relative overflow-hidden border-primary/20 bg-background/60 backdrop-blur-xl transition-all duration-300">
                <form action={handleSubmit}>
                    <input type="hidden" name="id" value={goal.id} />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold text-primary">{dict.common.edit}</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={isLoading}
                            >
                                <X className="h-4 w-4 mr-1" />
                                {dict.common.cancel}
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isLoading}
                                className="bg-primary/80 hover:bg-primary"
                            >
                                <Save className="h-4 w-4 mr-1" />
                                {dict.common.save}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{dict.goals.new.titleLabel}</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={goal.title}
                                required
                                className="bg-background/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{dict.goals.detail.description}</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={goal.description}
                                className="min-h-[100px] bg-background/50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">{dict.goals.category.label}</Label>
                                <select
                                    id="category"
                                    name="category"
                                    defaultValue={goal.category || 'other'}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="other">{dict.goals.category.other}</option>
                                    <option value="health">{dict.goals.category.health}</option>
                                    <option value="career">{dict.goals.category.career}</option>
                                    <option value="learning">{dict.goals.category.learning}</option>
                                    <option value="finance">{dict.goals.category.finance}</option>
                                    <option value="lifestyle">{dict.goals.category.lifestyle}</option>
                                    <option value="social">{dict.goals.category.social}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">{dict.goals.priority.label}</Label>
                                <select
                                    id="priority"
                                    name="priority"
                                    defaultValue={goal.priority || 'medium'}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="high">{dict.goals.priority.high}</option>
                                    <option value="medium">{dict.goals.priority.medium}</option>
                                    <option value="low">{dict.goals.priority.low}</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">{dict.goals.status.label}</Label>
                            <select
                                id="status"
                                name="status"
                                defaultValue={goal.status}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="active">{dict.goals.status.active}</option>
                                <option value="completed">{dict.goals.status.completed}</option>
                                <option value="abandoned">{dict.goals.status.abandoned}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">{dict.goals.detail.startDate}</Label>
                                <Input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    defaultValue={new Date(goal.start_date).toISOString().split('T')[0]}
                                    required
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">{dict.goals.detail.endDate}</Label>
                                <Input
                                    id="end_date"
                                    name="end_date"
                                    type="date"
                                    defaultValue={new Date(goal.end_date).toISOString().split('T')[0]}
                                    required
                                    className="bg-background/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="success_criteria">{dict.goals.detail.successCriteria}</Label>
                            <Textarea
                                id="success_criteria"
                                name="success_criteria"
                                defaultValue={goal.success_criteria}
                                className="bg-background/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stop_criteria">{dict.goals.detail.abandonCriteria}</Label>
                            <Textarea
                                id="stop_criteria"
                                name="stop_criteria"
                                defaultValue={goal.stop_criteria}
                                className="bg-background/50"
                            />
                        </div>
                    </CardContent>
                </form>
            </Card>
        )
    }

    return (
        <Card className="group relative overflow-hidden border-border/40 bg-card/80 backdrop-blur-xl shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
                <CardTitle className="text-lg font-semibold tracking-tight">{dict.goals.detail.details}</CardTitle>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    >
                        <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                            <Pencil className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{dict.common.edit}</span>
                    </Button>
                    <DeleteGoalButton id={goal.id} title={goal.title} dict={dict} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-1.5">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.detail.description}</h3>
                    <p className="text-sm leading-relaxed text-foreground/90">{goal.description || dict.common.noDescription}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.detail.startDate}</h3>
                        <p className="text-sm font-medium text-foreground/90 font-mono">
                            {format(new Date(goal.start_date), 'yyyy-MM-dd')}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.detail.endDate}</h3>
                        <p className="text-sm font-medium text-foreground/90 font-mono">
                            {format(new Date(goal.end_date), 'yyyy-MM-dd')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.priority.label}</h3>
                        <p className="text-sm font-medium text-foreground/90 capitalize">
                            {dict.goals.priority[goal.priority as keyof typeof dict.goals.priority] || goal.priority || dict.goals.priority.medium}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.category.label}</h3>
                        <p className="text-sm font-medium text-foreground/90 capitalize">
                            {dict.goals.category[goal.category as keyof typeof dict.goals.category] || goal.category || dict.goals.category.other}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.status.label}</h3>
                        <div className="flex">
                            <GoalStatusBadge
                                status={goal.status}
                                label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.detail.successCriteria}</h3>
                    <div className="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90 border border-border/40">
                        <p className="whitespace-pre-wrap">{goal.success_criteria}</p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.detail.abandonCriteria}</h3>
                    <div className="rounded-lg bg-destructive/5 p-3 text-sm leading-relaxed text-foreground/90 border border-destructive/10">
                        <p className="whitespace-pre-wrap">{goal.stop_criteria}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
