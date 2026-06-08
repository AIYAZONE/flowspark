'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Maximize2, Minimize2, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRangeFields } from '@/components/DateRangeFields'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Dialog,
    DialogFormContent,
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
import { createActionWithSubItems } from '@/app/(authenticated)/goals/actions'
import { NewGoalForm } from './NewGoalForm'
import { createGoalModal } from '@/app/(authenticated)/goals/actions'
import type { Dictionary, GoalNewDictionary, TodayDictionary, CommonErrorDictionary } from '@/i18n/types'
import { logEvent } from '@/lib/analytics'
import { GoalRequiredIntroCard } from './GoalRequiredIntroCard'
import type { AIBreakdownActionDraft } from '@/lib/ai/breakdown'
import { useMobileInputVisible, useMobileKeyboardInset } from '@/components/ui/use-mobile-input-visible'
import { createClient } from '@/lib/supabase/client'
import { ActionDescriptionEditor, type ActionAttachmentDraft } from '@/components/ActionDescriptionEditor'
import type { ActionRecurrenceRule } from '@/lib/actionRecurrence'

type Dict = Dictionary

interface AddActionDialogProps {
    goalId?: string
    activeGoals?: { id: string; title: string }[]
    dict: Dict
    tz?: string
    trigger?: React.ReactNode
}

type SubItemDraft = {
    id: string
    title: string
}

function makeDraftId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function AddActionDialog({ goalId, activeGoals, dict, tz = 'Asia/Shanghai', trigger }: AddActionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [valid, setValid] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'intro' | 'goal' | 'action'>('action')
    const [goals, setGoals] = useState(activeGoals || [])
    const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(goalId || undefined)
    const [submitted, setSubmitted] = useState(false)
    const [showGoalCreatedBanner, setShowGoalCreatedBanner] = useState(false)
    const [actionTitle, setActionTitle] = useState('')
    const [actionDescription, setActionDescription] = useState('')
    const [actionType, setActionType] = useState('core')
    const [actionPriority, setActionPriority] = useState('medium')
    const [actionRepeatRule, setActionRepeatRule] = useState<ActionRecurrenceRule>('none')
    const [actionStartDate, setActionStartDate] = useState('')
    const [actionEndDate, setActionEndDate] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiError, setAiError] = useState<string | null>(null)
    const [aiDrafts, setAiDrafts] = useState<AIBreakdownActionDraft[]>([])
    const [subItemsDraft, setSubItemsDraft] = useState<SubItemDraft[]>([])
    const [attachmentsDraft, setAttachmentsDraft] = useState<ActionAttachmentDraft[]>([])
    const [descriptionUploading, setDescriptionUploading] = useState(false)
    const [uploadUserId, setUploadUserId] = useState<string>('')
    const titleRef = useRef<HTMLInputElement | null>(null)
    const todayText: TodayDictionary = dict.today
    const goalNewText: GoalNewDictionary = dict.goals.new
    const commonErrors: CommonErrorDictionary = dict.common.errors

    function handleOpenChange(next: boolean) {
        setOpen(next)
        if (next) {
            setIsFullscreen(false)
            setSubmitted(false)
            setError(null)
            setShowGoalCreatedBanner(false)
            setActionTitle('')
            setActionDescription('')
            setActionType('core')
            setActionPriority('medium')
            setActionRepeatRule('none')
            setAiLoading(false)
            setAiError(null)
            setAiDrafts([])
            setSubItemsDraft([])
            setAttachmentsDraft([])
            setDescriptionUploading(false)
            logEvent('action_click_open')
            if (!goalId && (!activeGoals || activeGoals.length === 0)) {
                setStep('intro')
                logEvent('intro_shown', { reason: 'no_goals' })
            } else {
                setStep('action')
            }
        } else {
            setIsFullscreen(false)
            if (!submitted) {
                logEvent('dialog_close_without_submit', { step })
            }
        }
    }

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            try {
                const normalizedSubItems = subItemsDraft
                    .map((item, idx) => ({ title: item.title.trim(), sort_order: idx }))
                    .filter((item) => item.title.length > 0)
                formData.set('sub_items', JSON.stringify(normalizedSubItems))
                await createActionWithSubItems(formData)
                setSubmitted(true)
                logEvent('action_create_success', { goalId: goalId || selectedGoalId })
                setOpen(false)
            } catch (error) {
                console.error(error)
                setError(error instanceof Error ? error.message : 'Failed to create action')
            }
        })
    }

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

    useEffect(() => {
        if (!open) return
        if (step !== 'action') return
        setActionStartDate(today)
        setActionEndDate(today)
    }, [open, step, today])

    async function handleAISplitAction() {
        setAiError(null)
        setAiDrafts([])
        const targetGoalId = goalId || selectedGoalId || ''
        const goalTitle = goals.find((g) => g.id === targetGoalId)?.title || actionTitle.trim()
        const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'

        if (!targetGoalId || !actionTitle.trim()) {
            setAiError(dict.common.errors.missing_fields)
            return
        }

        setAiLoading(true)
        try {
            const res = await fetch('/api/ai/breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalTitle,
                    goalDescription: actionTitle.trim(),
                    startDate: actionStartDate || today,
                    endDate: actionEndDate || today,
                    locale
                })
            })
            const json = (await res.json()) as { actions?: AIBreakdownActionDraft[]; error?: string }
            if (!res.ok) {
                const key = json.error || 'operation_failed'
                setAiError(commonErrors[key as keyof CommonErrorDictionary] || commonErrors.operation_failed)
                return
            }

            const drafts = Array.isArray(json.actions) ? json.actions : []
            if (drafts.length === 0) {
                setAiError(dict.common.errors.operation_failed)
                return
            }
            setAiDrafts(drafts.slice(0, 5))
        } catch {
            setAiError(dict.common.errors.operation_failed)
        } finally {
            setAiLoading(false)
        }
    }

    function applyAIDraft(draft: AIBreakdownActionDraft) {
        const title = draft.title.trim()
        if (!title) return
        setSubItemsDraft((prev) => {
            if (prev.some((item) => item.title.trim() === title)) return prev
            return [...prev, { id: makeDraftId(), title }]
        })
        setAiError(null)
    }

    function importAllAIDraftsAsSubItems() {
        if (aiDrafts.length === 0) return
        setSubItemsDraft((prev) => {
            const existing = new Set(prev.map((item) => item.title.trim()))
            const imported = aiDrafts
                .map((draft) => draft.title.trim())
                .filter((title) => title && !existing.has(title))
                .map((title) => ({ id: makeDraftId(), title }))
            return [...prev, ...imported]
        })
    }

    useEffect(() => {
        if (!open) return
        if (step !== 'action') return
        if (showGoalCreatedBanner) {
            const id = window.setTimeout(() => setShowGoalCreatedBanner(false), 1500)
            return () => window.clearTimeout(id)
        }
    }, [open, step, showGoalCreatedBanner])

    useEffect(() => {
        if (!open) return
        const supabase = createClient()
        void supabase.auth.getUser().then(({ data }) => {
            const uid = data.user?.id || ''
            setUploadUserId(uid)
        })
    }, [open])

    useMobileInputVisible(open && step === 'action', titleRef)
    const keyboardInset = useMobileKeyboardInset(open && step === 'action')

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        {dict.goals.detail.addAction}
                    </Button>
                )}
            </DialogTrigger>
            <DialogFormContent
                mobileMode={isFullscreen ? 'fullscreen' : 'sheet'}
                className={isFullscreen ? 'p-0' : 'p-0 block sm:max-w-[600px] sm:max-h-[85vh]'}
            >
                {step === 'intro' ? (
                    <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-primary/10 via-background to-background px-6 pb-8 pt-10">
                        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.16 }}
                            >
                                <DialogHeader>
                                    <DialogTitle className="sr-only">{dict.today.addActionIntroTitle}</DialogTitle>
                                </DialogHeader>
                                <GoalRequiredIntroCard
                                    title={dict.today.addActionIntroTitle}
                                    description={dict.today.addActionIntroDesc}
                                    points={dict.today.addActionIntroPoints}
                                    icon={<Target className="h-5 w-5" />}
                                    primaryLabel={dict.today.createGoalAndContinue}
                                    secondaryLabel={dict.today.later}
                                    onPrimary={() => { setStep('goal'); logEvent('intro_continue') }}
                                    onSecondary={() => { setOpen(false); logEvent('intro_cancel') }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className={isFullscreen ? 'flex h-full flex-col p-6' : 'flex max-h-[85dvh] flex-col p-6 sm:max-h-none'}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.16 }}
                            >
                                {step === 'goal' ? (
                                    <>
                                        <DialogHeader>
                                            <DialogTitle>{dict.goals.new.title}</DialogTitle>
                                        </DialogHeader>
                                        <NewGoalForm
                                            dict={dict}
                                            action={createGoalModal}
                                            onSuccess={(created) => {
                                                if (created?.id && created.title) {
                                                    setGoals(prev => [...prev, { id: created.id!, title: created.title! }])
                                                    setSelectedGoalId(created.id)
                                                    setShowGoalCreatedBanner(true)
                                                    logEvent('goal_create_success_from_action_flow', { goalId: created.id })
                                                    logEvent('goal_create_success_banner')
                                                }
                                                setStep('action')
                                            }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <DialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                                            <DialogTitle>{dict.goals.detail.addAction}</DialogTitle>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="shrink-0 gap-2"
                                                onClick={() => setIsFullscreen((value) => !value)}
                                            >
                                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                                {isFullscreen ? dict.common.exitFullscreen : dict.common.fullscreen}
                                            </Button>
                                        </DialogHeader>
                                        <form action={handleSubmit} className="mt-4 flex min-h-0 flex-1 flex-col">
                                            <div
                                                className={isFullscreen ? 'min-h-0 flex-1 space-y-4 overflow-y-auto pr-1' : 'min-h-0 flex-1 space-y-4 overflow-y-auto'}
                                                style={{ paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined }}
                                            >
                                            {showGoalCreatedBanner && (
                                                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm" role="status">
                                                    {dict.today.goalCreatedAutoselected}
                                                </div>
                                            )}
                                            {goalId ? (
                                                <input type="hidden" name="goal_id" value={goalId} />
                                            ) : (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="goal_id" required>{dict.today.goalLabel}</Label>
                                                    <Select name="goal_id" value={selectedGoalId} onValueChange={setSelectedGoalId} required>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder={dict.today.selectGoal} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {goals?.map(goal => (
                                                                <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {(!goals || goals.length === 0) && (
                                                        <Button type="button" variant="link" className="px-0 text-primary underline" onClick={() => setStep('goal')}>
                                                            {dict.goals.newGoal}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid gap-2">
                                                <Label htmlFor="title" required>{dict.today.actionTitleLabel}</Label>
                                                <Input
                                                    ref={titleRef}
                                                    id="title"
                                                    name="title"
                                                    placeholder={dict.today.actionTitlePlaceholder}
                                                    required
                                                    value={actionTitle}
                                                    onChange={(e) => setActionTitle(e.target.value)}
                                                />
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleAISplitAction}
                                                        disabled={aiLoading || !actionTitle.trim() || (!goalId && !selectedGoalId)}
                                                    >
                                                        {aiLoading ? dict.common.loading : dict.goals.new.aiSplitButton}
                                                    </Button>
                                                </div>
                                                {aiError ? (
                                                    <div className="text-sm text-destructive">{aiError}</div>
                                                ) : null}
                                            </div>

                                            <div className="grid gap-2">
                                                {uploadUserId ? (
                                                    <ActionDescriptionEditor
                                                        userId={uploadUserId}
                                                        value={actionDescription}
                                                        onChange={setActionDescription}
                                                        attachments={attachmentsDraft}
                                                        onAttachmentsChange={setAttachmentsDraft}
                                                        onUploadingChange={setDescriptionUploading}
                                                        dict={dict}
                                                    />
                                                ) : (
                                                    <div className="text-xs text-muted-foreground">{dict.common.loading}</div>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label>{goalNewText.subItemsLabel || '子行动'}</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSubItemsDraft((prev) => [...prev, { id: makeDraftId(), title: '' }])}
                                                    >
                                                        {goalNewText.subItemsAdd || '新增子行动'}
                                                    </Button>
                                                </div>
                                                {subItemsDraft.length === 0 ? (
                                                    <div className="text-xs text-muted-foreground">
                                                        {goalNewText.subItemsEmptyHint || '可手动添加，或使用 AI 拆解后导入为子行动'}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {subItemsDraft.map((item, idx) => (
                                                            <div key={item.id} className="flex items-center gap-2">
                                                                <Input
                                                                    value={item.title}
                                                                    placeholder={`${goalNewText.subItemsPlaceholder || '子行动'} ${idx + 1}`}
                                                                    onChange={(e) => {
                                                                        const nextTitle = e.target.value
                                                                        setSubItemsDraft((prev) => prev.map((x) => x.id === item.id ? { ...x, title: nextTitle } : x))
                                                                    }}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setSubItemsDraft((prev) => prev.filter((x) => x.id !== item.id))}
                                                                >
                                                                    {(dict.common.delete || '删除')}
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="type">{dict.today.typeLabel}</Label>
                                                    <Select name="type" value={actionType} onValueChange={setActionType}>
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
                                                    <Select name="priority" value={actionPriority} onValueChange={setActionPriority}>
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

                                            <div className="grid gap-2">
                                                <Label htmlFor="repeat_rule">{todayText.repeatLabel || '重复规则'}</Label>
                                                <input type="hidden" name="repeat_rule" value={actionRepeatRule} />
                                                <Select value={actionRepeatRule} onValueChange={(value) => setActionRepeatRule(value as ActionRecurrenceRule)}>
                                                    <SelectTrigger id="repeat_rule" className="w-full">
                                                        <SelectValue placeholder={todayText.repeatLabel || '重复规则'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{todayText.repeatNone || '不重复'}</SelectItem>
                                                        <SelectItem value="daily">{todayText.repeatDaily || '每天'}</SelectItem>
                                                        <SelectItem value="weekly">{todayText.repeatWeekly || '每周'}</SelectItem>
                                                        <SelectItem value="monthly">{todayText.repeatMonthly || '每月'}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <DateRangeFields
                                                key={`${actionStartDate}-${actionEndDate}`}
                                                defaultStart={actionStartDate || today}
                                                defaultEnd={actionEndDate || today}
                                                labels={{
                                                    start: dict.today.startTime,
                                                    end: dict.today.endTime,
                                                    error: dict.common.dateRangeInvalid
                                                }}
                                                onValidityChange={setValid}
                                            />

                                            {aiDrafts.length > 0 ? (
                                                <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-sm font-medium">{dict.goals.new.aiSuggestionsTitle}</div>
                                                        <Button type="button" variant="outline" size="sm" onClick={importAllAIDraftsAsSubItems}>
                                                            {goalNewText.aiImportSubItems || '全部导入为子行动'}
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {aiDrafts.map((draft, idx) => (
                                                            <button
                                                                key={`${draft.title}-${idx}`}
                                                                type="button"
                                                                onClick={() => applyAIDraft(draft)}
                                                                className="w-full rounded-md border border-border/60 bg-background/70 p-2 text-left hover:bg-muted/40 transition-colors"
                                                            >
                                                                <div className="text-sm font-medium">{draft.title}</div>
                                                                {draft.description ? (
                                                                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{draft.description}</div>
                                                                ) : null}
                                                                <div className="mt-1 text-[11px] text-primary">
                                                                    {goalNewText.aiImportOneSubItem || '点击导入为子行动'}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {error ? <div className="text-sm text-destructive">{error}</div> : null}

                                            {descriptionUploading ? (
                                                <div className="text-xs text-muted-foreground">
                                                    {goalNewText.wait_upload_complete || '图片上传中，请稍后提交。'}
                                                </div>
                                            ) : null}
                                            </div>

                                            <div
                                                className={isFullscreen ? 'border-t border-border/50 bg-background pt-4' : 'border-t border-border/50 bg-background pt-4'}
                                                style={{ paddingBottom: open && keyboardInset > 0 ? `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` : undefined }}
                                            >
                                                <Button type="submit" className="w-full" disabled={isPending || !valid || (!goalId && !selectedGoalId) || descriptionUploading}>
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
                                            </div>
                                        </form>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </DialogFormContent>
        </Dialog>
    )
}
