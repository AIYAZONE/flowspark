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
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 rounded-full px-3 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    {dict.common.edit}
                </Button>
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
