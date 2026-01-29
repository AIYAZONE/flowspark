'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import { AnimatePresence, motion } from 'framer-motion'
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
import { NewGoalForm } from './NewGoalForm'
import { createGoalModal } from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'
import { logEvent } from '@/lib/analytics'
import { GoalRequiredIntroCard } from './GoalRequiredIntroCard'

type Dict = typeof en

interface AddActionDialogProps {
    goalId?: string
    activeGoals?: { id: string; title: string }[]
    dict: Dict
    tz?: string
    trigger?: React.ReactNode
}

export function AddActionDialog({ goalId, activeGoals, dict, tz = 'Asia/Shanghai', trigger }: AddActionDialogProps) {
    const [open, setOpen] = useState(false)
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
    const titleRef = useRef<HTMLInputElement | null>(null)

    function handleOpenChange(next: boolean) {
        setOpen(next)
        if (next) {
            setSubmitted(false)
            setError(null)
            setShowGoalCreatedBanner(false)
            setActionTitle('')
            setActionDescription('')
            setActionType('core')
            setActionPriority('medium')
            logEvent('action_click_open')
            if (!goalId && (!activeGoals || activeGoals.length === 0)) {
                setStep('intro')
                logEvent('intro_shown', { reason: 'no_goals' })
            } else {
                setStep('action')
            }
        } else {
            if (!submitted) {
                logEvent('dialog_close_without_submit', { step })
            }
        }
    }

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            try {
                await createAction(formData)
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
        if (showGoalCreatedBanner) {
            const id = window.setTimeout(() => setShowGoalCreatedBanner(false), 1500)
            return () => window.clearTimeout(id)
        }
    }, [open, step, showGoalCreatedBanner])

    useEffect(() => {
        if (!open) return
        if (step !== 'action') return
        if (!titleRef.current) return
        titleRef.current.focus()
    }, [open, step])

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
            <DialogContent
                className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-0 overflow-hidden block"
            >
                {step === 'intro' ? (
                    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background px-6 pb-8 pt-10">
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
                    <div className="p-6">
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
                                        <DialogHeader>
                                            <DialogTitle>{dict.goals.detail.addAction}</DialogTitle>
                                        </DialogHeader>
                                        <form action={handleSubmit} className="space-y-4 mt-4">
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
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="description">{dict.today.descriptionLabel}</Label>
                                                <Textarea
                                                    id="description"
                                                    name="description"
                                                    placeholder={dict.today.descriptionPlaceholder}
                                                    className="min-h-[120px]"
                                                    value={actionDescription}
                                                    onChange={(e) => setActionDescription(e.target.value)}
                                                />
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

                                            <Button type="submit" className="w-full" disabled={isPending || !valid || (!goalId && !selectedGoalId)}>
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
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
