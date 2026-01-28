'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangeFields } from '@/components/DateRangeFields'
import { createAction } from '@/app/(authenticated)/goals/actions'
import { NewGoalForm } from './NewGoalForm'
import { createGoalModal } from '@/app/(authenticated)/goals/actions'
import { logEvent } from '@/lib/analytics'
import type en from '@/i18n/en.json'
import { AnimatePresence, motion } from 'framer-motion'
import { GoalRequiredIntroCard } from './GoalRequiredIntroCard'
import { Target } from 'lucide-react'
type Dict = typeof en

type Goal = {
  id: string
  title: string
}

interface SetCoreActionSheetProps {
  goals: Goal[] | null
  dict: Dict
  defaultDate: string
}

export function SetCoreActionSheet({ goals, dict, defaultDate }: SetCoreActionSheetProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [valid, setValid] = useState(true)
  const [step, setStep] = useState<'intro' | 'goal' | 'action'>('action')
  const [goalList, setGoalList] = useState<Goal[]>(goals || [])
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(undefined)
  const [submitted, setSubmitted] = useState(false)
  const [showGoalCreatedBanner, setShowGoalCreatedBanner] = useState(false)
  const [actionTitle, setActionTitle] = useState('')
  const titleRef = useRef<HTMLInputElement | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      await createAction(formData)
      setSubmitted(true)
      logEvent('action_create_success', { goalId: selectedGoalId, source: 'dashboard_core_action' })
      setOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setSubmitted(false)
      setShowGoalCreatedBanner(false)
      logEvent('action_click_open')
      if (!goalList || goalList.length === 0) {
        setStep('intro')
        logEvent('intro_shown', { reason: 'no_goals' })
      } else {
        setStep('action')
      }
    } else {
      if (!submitted) {
        logEvent('dialog_close_without_submit', { step, source: 'dashboard_core_action' })
      }
    }
  }

  useEffect(() => {
    if (!open) return
    if (step !== 'action') return
    if (!showGoalCreatedBanner) return
    const id = window.setTimeout(() => setShowGoalCreatedBanner(false), 1500)
    return () => window.clearTimeout(id)
  }, [open, step, showGoalCreatedBanner])

  useEffect(() => {
    if (!open) return
    if (step !== 'action') return
    if (!titleRef.current) return
    titleRef.current.focus()
  }, [open, step])

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="link" className="px-0 text-primary underline">
          {dict.dashboard.setCoreAction}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="sm:max-w-sm p-0"
      >
        {step === 'intro' ? (
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background px-6 pb-8 pt-10">
            <div className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl" />
            <AnimatePresence mode="wait">
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
              >
                <SheetHeader>
                  <SheetTitle className="sr-only">{dict.today.addActionIntroTitle}</SheetTitle>
                </SheetHeader>
                <GoalRequiredIntroCard
                  title={dict.today.addActionIntroTitle}
                  description={dict.today.addActionIntroDesc}
                  points={dict.today.addActionIntroPoints}
                  icon={<Target className="h-5 w-5" />}
                  primaryLabel={dict.today.createGoalAndContinue}
                  secondaryLabel={dict.today.later}
                  onPrimary={() => { setStep('goal'); logEvent('intro_continue', { source: 'dashboard_core_action' }) }}
                  onSecondary={() => { setOpen(false); logEvent('intro_cancel', { source: 'dashboard_core_action' }) }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
              >
                {step === 'goal' ? (
                  <>
                    <SheetHeader>
                      <SheetTitle>{dict.goals.new.title}</SheetTitle>
                    </SheetHeader>
                    <NewGoalForm
                      dict={dict}
                      action={createGoalModal}
                      onSuccess={(created) => {
                        if (created?.id && created.title) {
                          setGoalList(prev => [...prev, { id: created.id!, title: created.title! }])
                          setSelectedGoalId(created.id)
                          setShowGoalCreatedBanner(true)
                          logEvent('goal_create_success_from_action_flow', { goalId: created.id, source: 'dashboard_core_action' })
                          logEvent('goal_create_success_banner', { source: 'dashboard_core_action' })
                        }
                        setStep('action')
                      }}
                    />
                  </>
                ) : (
                  <>
                    <SheetHeader>
                      <SheetTitle>{dict.dashboard.setCoreAction}</SheetTitle>
                    </SheetHeader>
                    <form action={handleSubmit} className="space-y-4 mt-4">
                      <input type="hidden" name="type" value="core" />

                      {showGoalCreatedBanner && (
                        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm" role="status">
                          {dict.today.goalCreatedAutoselected}
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label htmlFor="goal_id">{dict.today.goalLabel}</Label>
                        <Select name="goal_id" value={selectedGoalId} onValueChange={setSelectedGoalId} required>
                          <SelectTrigger>
                            <SelectValue placeholder={dict.today.selectGoal} />
                          </SelectTrigger>
                          <SelectContent>
                            {goalList?.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(!goalList || goalList.length === 0) && (
                          <Button type="button" variant="link" className="px-0 text-primary underline" onClick={() => setStep('goal')}>
                            {dict.goals.newGoal}
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="title">{dict.today.actionTitleLabel}</Label>
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

                      <DateRangeFields
                        defaultStart={defaultDate}
                        defaultEnd={defaultDate}
                        labels={{ start: dict.today.startTime, end: dict.today.endTime, error: dict.common.dateRangeInvalid }}
                        onValidityChange={setValid}
                      />

                      <SheetFooter>
                        <Button type="submit" disabled={isLoading || (!selectedGoalId) || !valid} className="w-full">
                          {isLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground" />}
                          {dict.dashboard.setCoreAction}
                        </Button>
                      </SheetFooter>
                    </form>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
