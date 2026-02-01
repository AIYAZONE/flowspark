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
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { motion, useAnimationControls } from 'framer-motion'
import { CheckCircle2, ChevronRight, Circle, Pencil, Save, Trash2, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/SubmitButton'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import { toggleAction } from '@/app/(authenticated)/dashboard/actions'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [panelMode, setPanelMode] = useState<'view' | 'edit'>('view')
    const [dateRangeValid, setDateRangeValid] = useState(true)
    const [swipeEnabled, setSwipeEnabled] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)
    const [draggedRecently, setDraggedRecently] = useState(false)
    const controls = useAnimationControls()

    const hasDetails = true

    const closeSwipe = () => {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 420, damping: 34 } })
    }

    const openSwipe = () => {
        controls.start({ x: -128, transition: { type: 'spring', stiffness: 420, damping: 34 } })
    }

    const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
        const shouldOpen = info.offset.x < -40 || info.velocity.x < -500
        if (shouldOpen) openSwipe()
        else closeSwipe()
        setDraggedRecently(true)
        setTimeout(() => setDraggedRecently(false), 180)
    }

    useEffect(() => {
        if (typeof window === 'undefined') return

        const mediaQueryList = window.matchMedia('(hover: none) and (pointer: coarse)')

        const sync = () => {
            const enabled = mediaQueryList.matches
            setSwipeEnabled(enabled)
            if (!enabled) {
                controls.start({ x: 0, transition: { type: 'spring', stiffness: 420, damping: 34 } })
            }
        }

        sync()

        if (typeof mediaQueryList.addEventListener === 'function') {
            mediaQueryList.addEventListener('change', sync)
            return () => mediaQueryList.removeEventListener('change', sync)
        }

        mediaQueryList.addListener(sync)
        return () => mediaQueryList.removeListener(sync)
    }, [controls])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const media = window.matchMedia('(min-width: 768px)')
        const sync = () => setIsDesktop(media.matches)
        sync()
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', sync)
            return () => media.removeEventListener('change', sync)
        }
        media.addListener(sync)
        return () => media.removeListener(sync)
    }, [])

    async function handleUpdate(formData: FormData) {
        if (!dateRangeValid) return
        setIsLoading(true)
        try {
            await updateAction(formData)
            setPanelMode('view')
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const formData = new FormData()
            formData.set('id', action.id)
            formData.set('goal_id', action.goal_id)
            await deleteAction(formData)
            setDeleteDialogOpen(false)
            setDetailsOpen(false)
            setPanelMode('view')
            closeSwipe()
        } catch (error) {
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    function openDetails() {
        if (draggedRecently) return
        closeSwipe()
        setPanelMode('view')
        setDetailsOpen(true)
    }

    function openEditPanel() {
        closeSwipe()
        setPanelMode('edit')
        setDetailsOpen(true)
    }

    const handlePanelOpenChange = (open: boolean) => {
        setDetailsOpen(open)
        if (!open) setPanelMode('view')
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

    const endDateStr = action.end_date || action.start_date
    const endDateVal = endDateStr.split('T')[0]
    const todayVal = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    const isOverdue = endDateVal < todayVal

    const metaBadges = (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="capitalize px-2 py-0.5 rounded-full bg-secondary/50 font-medium text-secondary-foreground border border-border/50">
                {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}
            </span>
            <span className={cn("capitalize px-2 py-0.5 rounded-full font-medium border", getPriorityColor(action.priority))}>
                {getPriorityLabel(action.priority)}
            </span>
            <span className="font-mono text-[11px] opacity-80 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(action.start_date), 'yyyy-MM-dd')}
                {action.end_date && action.end_date !== action.start_date && ` ~ ${format(new Date(action.end_date), 'yyyy-MM-dd')}`}
            </span>
            {action.goals?.title && !showGoalTitle && (
                <span className="flex items-center gap-1 opacity-80">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    {action.goals.title}
                </span>
            )}
        </div>
    )

    const viewDescription = action.description ? (
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {action.description}
        </div>
    ) : (
        <div className="rounded-lg border border-border/50 bg-secondary/10 p-4 text-sm text-muted-foreground/70">
            {dict.common.noDescription}
        </div>
    )

    const editForm = (
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
                    onClick={() => setPanelMode('view')}
                    disabled={isLoading}
                >
                    <X className="h-4 w-4 mr-1" />
                    {dict.common.cancel}
                </Button>
                <SubmitButton
                    size="sm"
                    disabled={!dateRangeValid}
                >
                    <Save className="h-4 w-4 mr-1" />
                    {dict.common.save}
                </SubmitButton>
            </div>
        </form>
    )

    return (
        <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 md:hover:shadow-sm md:hover:border-primary/20 md:hover:bg-muted/10">
            <div className="absolute inset-y-0 right-0 z-0 w-32 md:hidden">
                <div className="flex h-full w-full items-stretch">
                    <button
                        type="button"
                        onClick={openEditPanel}
                        className="w-1/2 bg-primary/10 text-primary flex items-center justify-center"
                    >
                        <Pencil className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => { closeSwipe(); setDeleteDialogOpen(true) }}
                        className="w-1/2 bg-destructive/10 text-destructive flex items-center justify-center"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <motion.div
                initial={{ x: 0 }}
                animate={controls}
                drag={swipeEnabled ? 'x' : false}
                dragConstraints={{ left: -128, right: 0 }}
                dragElastic={0.06}
                dragMomentum={false}
                onDragEnd={swipeEnabled ? handleDragEnd : undefined}
                style={swipeEnabled ? { touchAction: 'pan-y' } : undefined}
                className={cn(
                    "relative z-10 flex flex-col bg-card p-4",
                    swipeEnabled && "cursor-grab active:cursor-grabbing"
                )}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <form action={toggleAction} className="mt-1">
                            <input type="hidden" name="id" value={action.id} />
                            <input type="hidden" name="completed" value={action.completed ? 'true' : 'false'} />
                            <CompleteButton completed={action.completed} type={action.type} />
                        </form>
                        <button
                            type="button"
                            onClick={openDetails}
                            disabled={!hasDetails}
                            className={cn(
                                "flex-1 min-w-0 text-left rounded-lg -m-2 p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                hasDetails ? "active:bg-muted/40" : "cursor-default"
                            )}
                            aria-disabled={!hasDetails}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className={`font-medium text-sm break-words ${action.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {action.title}
                                </p>
                                {hasDetails ? (
                                    <ChevronRight className="md:hidden h-4 w-4 text-muted-foreground/70 mt-0.5 shrink-0" />
                                ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
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
                            </div>
                            {action.description ? (
                                <div className="mt-3 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                                    <div className="mb-1 font-medium opacity-70">{dict.today.descriptionLabel}</div>
                                    <div className="line-clamp-2 whitespace-pre-wrap leading-relaxed">
                                        {action.description}
                                    </div>
                                </div>
                            ) : null}
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-1 shrink-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-200">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={openEditPanel}
                            className="h-9 w-9 lg:h-8 lg:w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            disabled={isLoading}
                        >
                            <Pencil className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                            <span className="sr-only">{dict.common.edit}</span>
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => { closeSwipe(); setDeleteDialogOpen(true) }}
                            className="h-9 w-9 lg:h-8 lg:w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            disabled={isLoading || isDeleting}
                        >
                            <Trash2 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                            <span className="sr-only">{dict.common.delete || '删除'}</span>
                        </Button>
                    </div>
                </div>
            </motion.div>

            {isDesktop ? (
                <Dialog open={detailsOpen} onOpenChange={handlePanelOpenChange}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="pr-8">{panelMode === 'edit' ? dict.common.edit : action.title}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2 space-y-4">
                            {panelMode === 'edit' ? (
                                editForm
                            ) : (
                                <>
                                    {metaBadges}
                                    {viewDescription}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPanelMode('edit')}
                                            disabled={isLoading}
                                        >
                                            {dict.common.edit}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setDeleteDialogOpen(true)}
                                            disabled={isDeleting}
                                        >
                                            {dict.common.delete}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            ) : (
                <Sheet open={detailsOpen} onOpenChange={handlePanelOpenChange}>
                    <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
                        <SheetHeader className="flex flex-row items-start justify-between space-y-0 gap-3">
                            <SheetTitle className="text-base leading-snug">{panelMode === 'edit' ? dict.common.edit : action.title}</SheetTitle>
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </SheetClose>
                        </SheetHeader>

                        <div className="mt-4 space-y-4">
                            {panelMode === 'edit' ? (
                                editForm
                            ) : (
                                <>
                                    {metaBadges}
                                    {viewDescription}
                                    <div className="flex items-center justify-between gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setPanelMode('edit')}
                                            disabled={isLoading}
                                        >
                                            {dict.common.edit}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setDeleteDialogOpen(true)}
                                            disabled={isDeleting}
                                        >
                                            {dict.common.delete}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            )}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open)
                    if (!open) closeSwipe()
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dict.common.delete} {action.title}?</AlertDialogTitle>
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
                            {isDeleting && <LoadingSpinner size={16} className="mr-2 text-current" />}
                            {dict.common.delete || '删除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
