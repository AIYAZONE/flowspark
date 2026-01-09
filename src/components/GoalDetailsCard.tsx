'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Save, X, Calendar, Tag, Flag, Target, AlertCircle, LayoutDashboard, Clock, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SubmitButton } from '@/components/SubmitButton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateGoal, toggleGoalStar } from '@/app/(authenticated)/goals/actions'
import { DeleteGoalButton } from '@/components/DeleteGoalButton'
import { ArchiveGoalButton } from '@/components/ArchiveGoalButton'
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
    is_starred?: boolean
}

interface GoalDetailsCardProps {
    goal: Goal
    dict: typeof en
}

export function GoalDetailsCard({ goal, dict }: GoalDetailsCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isStarring, setIsStarring] = useState(false)

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

    async function handleToggleStar() {
        if (isStarring) return
        setIsStarring(true)
        try {
            await toggleGoalStar(goal.id, !goal.is_starred)
        } catch (error) {
            console.error(error)
        } finally {
            setIsStarring(false)
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
                            <SubmitButton
                                size="sm"
                                className="bg-primary/80 hover:bg-primary"
                            >
                                <Save className="h-4 w-4 mr-1" />
                                {dict.common.save}
                            </SubmitButton>
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

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">{dict.goals.status.label}</Label>
                                <Select name="status" defaultValue={goal.status}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder={dict.goals.status.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{dict.goals.status.active}</SelectItem>
                                        <SelectItem value="completed">{dict.goals.status.completed}</SelectItem>
                                        <SelectItem value="abandoned">{dict.goals.status.abandoned}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">{dict.goals.priority.label}</Label>
                                <Select name="priority" defaultValue={goal.priority || 'medium'}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder={dict.goals.priority.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">{dict.goals.priority.high}</SelectItem>
                                        <SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
                                        <SelectItem value="low">{dict.goals.priority.low}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">{dict.goals.category.label}</Label>
                                <Select name="category" defaultValue={goal.category || 'other'}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder={dict.goals.category.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="other">{dict.goals.category.other}</SelectItem>
                                        <SelectItem value="health">{dict.goals.category.health}</SelectItem>
                                        <SelectItem value="career">{dict.goals.category.career}</SelectItem>
                                        <SelectItem value="learning">{dict.goals.category.learning}</SelectItem>
                                        <SelectItem value="finance">{dict.goals.category.finance}</SelectItem>
                                        <SelectItem value="lifestyle">{dict.goals.category.lifestyle}</SelectItem>
                                        <SelectItem value="social">{dict.goals.category.social}</SelectItem>
                                    </SelectContent>
                                </Select>
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
        <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-xl shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{dict.goals.detail.details}</h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleStar}
                        disabled={isStarring}
                        className={`h-8 w-8 rounded-full hover:bg-yellow-500/10 hover:text-yellow-500 transition-all ${goal.is_starred ? 'text-yellow-500' : 'text-muted-foreground/30'}`}
                    >
                        {isStarring ? (
                            <LoadingSpinner size={14} className="text-current" />
                        ) : (
                            <Star className={`h-4 w-4 ${goal.is_starred ? 'fill-current' : ''}`} />
                        )}
                    </Button>
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
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="flex flex-col gap-8">
                    {/* Main Content */}
                    <div className="space-y-8">
                        {/* Description */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LayoutDashboard className="h-4 w-4" />
                                <h3 className="text-sm font-medium uppercase tracking-wider">{dict.goals.detail.description}</h3>
                            </div>
                            <div className="rounded-xl bg-secondary/20 p-4 text-base leading-relaxed text-foreground/90 border border-border/50 relative">
                                <p className={`whitespace-pre-wrap ${!isExpanded && (goal.description?.length || 0) > 200 ? 'line-clamp-3' : ''}`}>
                                    {goal.description || dict.common.noDescription}
                                </p>
                                {(goal.description?.length || 0) > 200 && (
                                    <div className="mt-3 flex justify-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="h-8 gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    {dict.common.showLess} <ChevronUp className="h-3 w-3" />
                                                </>
                                            ) : (
                                                <>
                                                    {dict.common.showMore} <ChevronDown className="h-3 w-3" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 flex flex-row justify-between gap-8">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted-foreground">{dict.goals.detail.startDate}</p>
                                    <p className="text-sm font-medium font-mono">
                                        {format(new Date(goal.start_date), dict.goals.detail.dateFormat)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted-foreground">{dict.goals.detail.endDate}</p>
                                    <p className="text-sm font-medium font-mono">
                                        {format(new Date(goal.end_date), dict.goals.detail.dateFormat)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Metadata */}
                        <div className="w-full">
                            {/* Status & Priority Card */}
                            <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-4 min-w-[280px]">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Target className="h-4 w-4" />
                                            <span>{dict.goals.status.label}</span>
                                        </div>
                                        <div className="scale-90 origin-right">
                                            <GoalStatusBadge
                                                status={goal.status}
                                                label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Flag className="h-4 w-4" />
                                            <span>{dict.goals.priority.label}</span>
                                        </div>
                                        <span className="text-sm font-medium capitalize px-2 py-0.5 rounded-md bg-secondary">
                                            {dict.goals.priority[goal.priority as keyof typeof dict.goals.priority] || goal.priority || 'Medium'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Tag className="h-4 w-4" />
                                            <span>{dict.goals.category.label}</span>
                                        </div>
                                        <span className="text-sm font-medium capitalize">
                                            {dict.goals.category[goal.category as keyof typeof dict.goals.category] || goal.category || 'Other'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Success Criteria */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4 w-4" />
                                <h3 className="text-sm font-medium uppercase tracking-wider">{dict.goals.detail.successCriteria}</h3>
                            </div>
                            <div className="rounded-xl bg-emerald-500/5 p-4 text-sm leading-relaxed text-foreground/90 border border-emerald-500/10">
                                <p className="whitespace-pre-wrap">{goal.success_criteria || '-'}</p>
                            </div>
                        </div>

                        {/* Stop Criteria */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                <h3 className="text-sm font-medium uppercase tracking-wider">{dict.goals.detail.abandonCriteria}</h3>
                            </div>
                            <div className="rounded-xl bg-destructive/5 p-4 text-sm leading-relaxed text-foreground/90 border border-destructive/10">
                                <p className="whitespace-pre-wrap">{goal.stop_criteria || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-border/50 p-6 bg-secondary/10">
                <ArchiveGoalButton id={goal.id} isArchived={goal.status === 'archived'} dict={dict} />
                <DeleteGoalButton id={goal.id} title={goal.title} dict={dict} />
            </CardFooter>
        </Card>
    )
}
