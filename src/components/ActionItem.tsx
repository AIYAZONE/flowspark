'use client'

import { useFormStatus } from 'react-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function CompleteButton({ completed, type }: { completed: boolean, type: string }) {
    const { pending } = useFormStatus()

    if (pending) {
        return (
            <button disabled className="focus:outline-none flex items-center justify-center cursor-not-allowed opacity-70">
                <LoadingSpinner size={20} className={type === 'core' ? 'text-primary' : 'text-muted-foreground'} />
            </button>
        )
    }

    return (
        <button type="submit" className="focus:outline-none transition-transform hover:scale-110 flex items-center justify-center">
            {completed ? (
                <div className="rounded-full bg-primary/10 p-1">
                    <CheckCircle2 className={`h-5 w-5 ${type === 'core' ? 'text-primary' : 'text-primary'}`} />
                </div>
            ) : (
                <Circle className={`h-5 w-5 ${type === 'core' ? 'text-primary/70' : 'text-muted-foreground'}`} />
            )}
        </button>
    )
}
import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Pencil, Save, Trash2, X, AlignLeft, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import { toggleAction } from '@/app/(authenticated)/dashboard/actions'
import { deleteAction, updateAction } from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'

interface Action {
    id: string
    title: string
    completed: boolean
    type: string
    priority?: string
    description?: string
    start_date: string
    end_date?: string | null
    goal_id: string
    goals?: {
        title: string
    } | null
}

interface ActionItemProps {
    action: Action
    dict: typeof en
    showGoalTitle?: boolean
    tz?: string
}

export function ActionItem({ action, dict, showGoalTitle = false, tz = 'Asia/Shanghai' }: ActionItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [dateRangeValid, setDateRangeValid] = useState(true)

    async function handleUpdate(formData: FormData) {
        if (!dateRangeValid) return
        setIsLoading(true)
        try {
            await updateAction(formData)
            setIsEditing(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.set('id', action.id)
            formData.set('goal_id', action.goal_id)
            await deleteAction(formData)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20'
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    const getPriorityLabel = (priority?: string) => {
        return dict.goals.priority[priority as keyof typeof dict.goals.priority] || priority || dict.goals.priority.medium
    }

    if (isEditing) {
        return (
            <div className="p-4 border rounded-lg bg-background/50 backdrop-blur-sm border-primary/20">
                <form action={handleUpdate} className="space-y-4">
                    <input type="hidden" name="id" value={action.id} />
                    <input type="hidden" name="goal_id" value={action.goal_id} />

                    <div className="space-y-2">
                        <Input
                            name="title"
                            defaultValue={action.title}
                            required
                            className="bg-background/50 font-medium"
                            placeholder={dict.today.actionTitlePlaceholder}
                        />
                    </div>

                    <div className="space-y-2">
                        <Textarea
                            name="description"
                            defaultValue={action.description}
                            placeholder={dict.today.descriptionPlaceholder}
                            className="min-h-[80px] text-sm bg-background/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="type" className="text-xs text-muted-foreground mb-1 block">{dict.today.typeLabel}</Label>
                            <select
                                name="type"
                                defaultValue={action.type}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="core">{dict.today.types.core}</option>
                                <option value="maintenance">{dict.today.types.maintenance}</option>
                                <option value="learning">{dict.today.types.learning}</option>
                                <option value="review">{dict.today.types.review}</option>
                                <option value="rest">{dict.today.types.rest}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="priority" className="text-xs text-muted-foreground mb-1 block">{dict.today.priorityLabel}</Label>
                            <select
                                name="priority"
                                defaultValue={action.priority || 'medium'}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="high">{dict.goals.priority.high}</option>
                                <option value="medium">{dict.goals.priority.medium}</option>
                                <option value="low">{dict.goals.priority.low}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <DateRangeFields
                            defaultStart={action.start_date}
                            defaultEnd={action.end_date || action.start_date}
                            labels={{ start: dict.today.startTime, end: dict.today.endTime, error: dict.common.dateRangeInvalid }}
                            onValidityChange={setDateRangeValid}
                            className="grid-cols-2"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
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
                            disabled={isLoading || !dateRangeValid}
                        >
                            <Save className="h-4 w-4 mr-1" />
                            {dict.common.save}
                        </Button>
                    </div>
                </form>
            </div>
        )
    }

    const endDateStr = action.end_date || action.start_date
    const endDateVal = endDateStr.split('T')[0]
    const todayVal = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    const isOverdue = endDateVal < todayVal

    return (
        <div className="group flex flex-col p-4 border border-border/40 rounded-xl bg-card/50 hover:bg-card hover:shadow-sm hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <form action={toggleAction} className="mt-1">
                        <input type="hidden" name="id" value={action.id} />
                        <input type="hidden" name="completed" value={action.completed ? 'true' : 'false'} />
                        <CompleteButton completed={action.completed} type={action.type} />
                    </form>
                    <div className="flex-1 space-y-1 min-w-0">
                        <p className={`font-medium text-sm break-words ${action.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {action.title}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                            {isOverdue && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20">
                                    {dict.today.delayed}
                                </span>
                            )}
                            <span className="capitalize px-2 py-0.5 rounded-full bg-secondary/50 font-medium text-secondary-foreground border border-border/50">
                                {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}
                            </span>
                            <span className={cn(
                                "capitalize px-2 py-0.5 rounded-full font-medium border",
                                getPriorityColor(action.priority)
                            )}>
                                {getPriorityLabel(action.priority)}
                            </span>
                            <span className="font-mono text-[10px] opacity-70 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(action.start_date), 'MM-dd')}
                                {action.end_date && action.end_date !== action.start_date && ` ~ ${format(new Date(action.end_date), 'MM-dd')}`}
                            </span>
                            {action.goals?.title && showGoalTitle && (
                                <span className="flex items-center gap-1 opacity-70">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                    {action.goals.title}
                                </span>
                            )}
                            {action.description && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <AlignLeft className="h-3 w-3" />
                                    <span>{isExpanded ? dict.common.showLess : dict.common.showMore}</span>
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        disabled={isLoading}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">{dict.common.edit}</span>
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                disabled={isLoading}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">{dict.common.delete || '删除'}</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{dict.common.delete} {action.title}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {dict.common.confirmDelete}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {dict.common.delete || '删除'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {action.description && isExpanded && (
                <div className="mt-3 pl-11 pr-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 rounded-lg bg-secondary/30 text-sm text-muted-foreground border border-border/50 whitespace-pre-wrap leading-relaxed">
                        {action.description}
                    </div>
                </div>
            )}
        </div>
    )
}
