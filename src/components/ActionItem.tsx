'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Pencil, Save, Trash2, X } from 'lucide-react'
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
import { toggleAction } from '@/app/(authenticated)/dashboard/actions'
import { deleteAction, updateAction } from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'

interface Action {
    id: string
    title: string
    completed: boolean
    type: string
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
}

export function ActionItem({ action, dict, showGoalTitle = false }: ActionItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleUpdate(formData: FormData) {
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

    if (isEditing) {
        return (
            <div className="p-4 border rounded-lg bg-background/50 backdrop-blur-sm border-primary/20">
                <form action={handleUpdate} className="space-y-4">
                    <input type="hidden" name="id" value={action.id} />
                    <input type="hidden" name="goal_id" value={action.goal_id} />

                    <div className="flex gap-2">
                        <Input
                            name="title"
                            defaultValue={action.title}
                            required
                            className="flex-1 bg-background/50"
                            placeholder={dict.today.actionTitlePlaceholder}
                        />
                        <select
                            name="type"
                            defaultValue={action.type}
                            className="flex h-10 w-[120px] items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="core">{dict.today.types.core}</option>
                            <option value="maintain">{dict.today.types.maintain}</option>
                            <option value="explore">{dict.today.types.explore}</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="start_date" className="text-xs text-muted-foreground mb-1 block">{dict.today.startTime}</Label>
                            <Input
                                id="start_date"
                                type="date"
                                name="start_date"
                                defaultValue={new Date(action.start_date).toISOString().split('T')[0]}
                                required
                                className="bg-background/50"
                                placeholder={dict.today.startTime}
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="end_date" className="text-xs text-muted-foreground mb-1 block">{dict.today.endTime}</Label>
                            <Input
                                id="end_date"
                                type="date"
                                name="end_date"
                                defaultValue={(action.end_date ? new Date(action.end_date) : new Date(action.start_date)).toISOString().split('T')[0]}
                                className="bg-background/50"
                                placeholder={dict.today.endTime}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
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
                        >
                            <Save className="h-4 w-4 mr-1" />
                            {dict.common.save}
                        </Button>
                    </div>
                </form>
            </div>
        )
    }

    const isDelayed = new Date(action.start_date) < new Date(new Date().toISOString().split('T')[0]) && !action.completed

    return (
        <div className="group flex items-center justify-between p-4 border border-border/40 rounded-xl bg-card/50 hover:bg-card hover:shadow-sm hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center gap-4 flex-1">
                <form action={toggleAction}>
                    <input type="hidden" name="id" value={action.id} />
                    <input type="hidden" name="completed" value={action.completed ? 'true' : 'false'} />
                    <button type="submit" className="focus:outline-none transition-transform hover:scale-110 flex items-center justify-center">
                        {action.completed ? (
                            <div className="rounded-full bg-primary/10 p-1">
                                <CheckCircle2 className={`h-5 w-5 ${action.type === 'core' ? 'text-primary' : 'text-primary'}`} />
                            </div>
                        ) : (
                            <Circle className={`h-5 w-5 ${action.type === 'core' ? 'text-primary/70' : 'text-muted-foreground'}`} />
                        )}
                    </button>
                </form>
                <div className="flex-1 space-y-1">
                    <p className={`font-medium text-sm ${action.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {action.title}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                        {isDelayed && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20">
                                {dict.today.delayed}
                            </span>
                        )}
                        <span className="capitalize px-2 py-0.5 rounded-full bg-secondary/50 font-medium text-secondary-foreground border border-border/50">
                            {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}
                        </span>
                        <span className="font-mono text-[10px] opacity-70">
                            {format(new Date(action.start_date), 'yyyy-MM-dd')}
                            {action.end_date && action.end_date !== action.start_date && ` - ${format(new Date(action.end_date), 'yyyy-MM-dd')}`}
                        </span>
                        {action.goals?.title && showGoalTitle && (
                            <span className="flex items-center gap-1 opacity-70">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                {action.goals.title}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
    )
}
