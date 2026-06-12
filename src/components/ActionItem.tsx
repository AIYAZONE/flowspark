'use client'

import { useFormStatus } from 'react-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import dynamic from 'next/dynamic'

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
import { Calendar, CheckCircle2, ChevronRight, Circle, Pencil, Sparkles, Trash2 } from 'lucide-react'
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
} from "@/components/ui/alert-dialog"
import { toggleAction } from '@/app/(authenticated)/dashboard/actions'
import { deleteAction, toggleActionSubItem } from '@/app/(authenticated)/goals/actions'
import type { Dictionary, TodayDictionary } from '@/i18n/types'
import { ActionSubItemsSection } from '@/components/ActionSubItemsSection'
import { RichTextContentView } from '@/components/RichTextContentView'
import {
    parseActionRecurrenceDescription,
    type ActionRecurrenceRule,
} from '@/lib/actionRecurrence'

const ActionItemPanel = dynamic(
    () => import('@/components/ActionItemPanel').then((m) => m.ActionItemPanel),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[60vh] items-center justify-center">
                <LoadingSpinner size={32} />
            </div>
        ),
    }
)

function decodeHtmlEntities(input: string): string {
    return input
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
}

function richTextToPlainText(input: string, locale: 'zh' | 'en'): string {
    const imageLabel = locale === 'zh' ? '图片' : 'Image'
    const normalized = decodeHtmlEntities(input)

    const withMarkdownImages = normalized.replace(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, src: string) => {
        return `\n${imageLabel}：${src}\n`
    })

    const withHtmlImages = withMarkdownImages.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (_, src: string) => {
        return `\n${imageLabel}：${src}\n`
    })

    return withHtmlImages
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, '\n')
        .replace(/<li[^>]*>/gi, '- ')
        .replace(/<[^>]+>/g, '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

interface Action {
    id: string
    title: string
    completed: boolean
    type: string
    priority?: string
    description?: string
    start_date: string
    end_date?: string | null
    ai_recommendation_id?: string | null
    goal_id: string
    goals?: {
        title: string
    } | null
    action_sub_items?: Array<{
        id: string
        title: string
        completed: boolean
        sort_order: number
    }>
}

interface ActionItemProps {
    action: Action
    dict: Dictionary
    showGoalTitle?: boolean
    tz?: string
    goals?: { id: string, title: string }[]
    isNew?: boolean
}

type EditSubItemDraft = {
    id?: string
    title: string
    completed: boolean
}

export function ActionItem({ action, dict, showGoalTitle = false, tz = 'Asia/Shanghai', goals = [], isNew = false }: ActionItemProps) {
    const recurrenceMeta = parseActionRecurrenceDescription(action.description || '')
    const todayText: TodayDictionary = dict.today
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'rescue'>('view')
    const [swipeEnabled, setSwipeEnabled] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)
    const [draggedRecently, setDraggedRecently] = useState(false)
    const controls = useAnimationControls()
    const [rescueOutcomeState, setRescueOutcomeState] = useState<'idle' | 'adopted' | 'dismissed'>('idle')
    const [subItemsOpen, setSubItemsOpen] = useState(false)
    const [subItemBusyId, setSubItemBusyId] = useState<string | null>(null)

    const hasDetails = true
    const subItems = [...(action.action_sub_items || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const subItemsCompletedCount = subItems.filter((item) => item.completed).length

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

    function openRescuePanel() {
        closeSwipe()
        setPanelMode('rescue')
        setRescueOutcomeState('idle')
        setDetailsOpen(true)
    }

    const handlePanelOpenChange = (open: boolean) => {
        setDetailsOpen(open)
        if (!open) {
            setPanelMode('view')
        }
    }

    const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
    const newBadgeText = locale === 'zh' ? '刚创建' : 'NEW'
    const goalTitle = action.goals?.title || ''
    const rescueTitleText = locale === 'zh' ? '卡住救援' : 'Rescue'
    const copyTitleText = locale === 'zh' ? '复制标题' : 'Copy title'
    const copyFullText = locale === 'zh' ? '复制标题和详情' : 'Copy title + details'
    const copiedText = locale === 'zh' ? '已复制' : 'Copied'
    const aiPlanCardTitle = locale === 'zh' ? 'AI 今日推进建议' : 'AI Today Focus'
    const aiPlanBasedOnLabel = locale === 'zh' ? '基于任务' : 'Based on'
    const aiPlanVariantLabel = locale === 'zh' ? '推进版本' : 'Focus mode'
    const aiPlanReasonLabel = locale === 'zh' ? '建议原因' : 'Why this'
    const recurrenceLabelMap: Record<ActionRecurrenceRule, string> = {
        none: todayText.repeatNone || (locale === 'zh' ? '不重复' : 'No repeat'),
        daily: todayText.repeatDaily || (locale === 'zh' ? '每天' : 'Daily'),
        weekly: todayText.repeatWeekly || (locale === 'zh' ? '每周' : 'Weekly'),
        monthly: todayText.repeatMonthly || (locale === 'zh' ? '每月' : 'Monthly'),
    }
    const closeLabel = locale === 'zh' ? '关闭' : 'Close'
    async function onToggleSubItem(id: string, currentCompleted: boolean) {
        setSubItemBusyId(id)
        try {
            const formData = new FormData()
            formData.set('id', id)
            formData.set('goal_id', action.goal_id)
            formData.set('completed', currentCompleted ? 'true' : 'false')
            await toggleActionSubItem(formData)
            // no-op
        } catch {
            // no-op
        } finally {
            setSubItemBusyId(null)
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

    const endDateStr = action.end_date || action.start_date
    const endDateVal = endDateStr.split('T')[0]
    const todayVal = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    const isOverdue = endDateVal < todayVal
    const hasAIAdopted = Boolean(action.ai_recommendation_id || rescueOutcomeState === 'adopted')
    const aiAdoptedLabel = todayText.aiAdoptedLabel || 'AI 已采纳'
    const aiAdoptedHint = todayText.aiAdoptedHint || '该行动来自 AI 建议并已被采纳'

    const stripImageUrlLines = (raw: string) => {
        const lines = (raw || '').split('\n')
        return lines
            .filter((line) => {
                const t = line.trim()
                if (!t) return false
                if (/^(图片|image)\s*[:：]\s*https?:\/\//i.test(t)) return false
                return true
            })
            .join('\n')
            .trim()
    }

    const descriptionPreviewSource = stripImageUrlLines(recurrenceMeta.cleanDescription)
    const hasDescriptionPreview = Boolean(
        richTextToPlainText(descriptionPreviewSource, locale).trim() ||
        /<img[\s\S]*?>/i.test(descriptionPreviewSource) ||
        /!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/i.test(descriptionPreviewSource) ||
        /(https?:\/\/[^\s)]+?\.(?:png|jpe?g|webp)(?:\?[^\s)]*)?)/i.test(descriptionPreviewSource)
    )

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 md:hover:shadow-sm md:hover:border-primary/20 md:hover:bg-muted/10",
            isNew && "border-primary/40 bg-primary/4"
        )}>
            <div className={cn(
                "absolute inset-y-0 right-0 z-0 w-32",
                swipeEnabled ? "block" : "hidden"
            )}>
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
                        <div
                            role={hasDetails ? 'button' : undefined}
                            tabIndex={hasDetails ? 0 : -1}
                            onClick={hasDetails ? openDetails : undefined}
                            onKeyDown={(event) => {
                                if (!hasDetails) return
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    openDetails()
                                }
                            }}
                            className={cn(
                                "flex-1 min-w-0 text-left rounded-lg -m-2 p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                hasDetails ? "active:bg-muted/40 cursor-pointer" : "cursor-default"
                            )}
                            aria-disabled={!hasDetails}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className={`font-medium text-sm wrap-break-word ${action.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {action.title}
                                </p>
                                {hasDetails ? (
                                    <ChevronRight className="md:hidden h-4 w-4 text-muted-foreground/70 mt-0.5 shrink-0" />
                                ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                                {isNew && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/30">
                                        {newBadgeText}
                                    </span>
                                )}
                                {hasAIAdopted && (
                                    <span
                                        title={aiAdoptedHint}
                                        className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 font-medium text-primary"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        {aiAdoptedLabel}
                                    </span>
                                )}
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
                                {recurrenceMeta.recurrence !== 'none' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/6 px-2 py-0.5 font-medium text-primary">
                                        {recurrenceLabelMap[recurrenceMeta.recurrence]}
                                    </span>
                                ) : null}
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
                            {hasDescriptionPreview ? (
                                <div className="mt-3 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                                    <div className="mb-1 font-medium opacity-70">{dict.today.descriptionLabel}</div>
                                    <div className="max-h-28 overflow-hidden [&_img]:max-h-24">
                                        <RichTextContentView html={descriptionPreviewSource} compact />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className={cn(
                        "hidden md:flex items-center gap-1 shrink-0 opacity-0 pointer-events-none transition-opacity duration-200",
                        "group-hover:opacity-100 group-hover:pointer-events-auto",
                        !swipeEnabled && "group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                    )}>
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

                {subItems.length > 0 ? (
                    <ActionSubItemsSection
                        items={subItems}
                        label={todayText.subItemsLabel || '子行动'}
                        completedCount={subItemsCompletedCount}
                        onToggleItem={onToggleSubItem}
                        busyId={subItemBusyId}
                        collapsible
                        expanded={subItemsOpen}
                        onExpandedChange={setSubItemsOpen}
                        showMoreLabel={dict.common.showMore}
                        showLessLabel={dict.common.showLess}
                        className="mt-2 ml-11"
                    />
                ) : null}
            </motion.div>
            {detailsOpen ? (
                <ActionItemPanel
                    open={detailsOpen}
                    onOpenChange={handlePanelOpenChange}
                    panelMode={panelMode}
                    onPanelModeChange={setPanelMode}
                    action={action}
                    dict={dict}
                    tz={tz}
                    goals={goals}
                    isDesktop={isDesktop}
                    onToggleSubItem={onToggleSubItem}
                    subItemBusyId={subItemBusyId}
                    onRequestDelete={() => setDeleteDialogOpen(true)}
                    onRescueOutcomeStateChange={setRescueOutcomeState}
                />
            ) : null}

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
