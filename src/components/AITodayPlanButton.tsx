'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, Clock3, Sparkles } from 'lucide-react'
import { createActionAndReturnId } from '@/app/(authenticated)/goals/actions'
import {
  Dialog,
  DialogFormContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { TodayPlanOutput } from '@/lib/ai/phase2aSchemas'
import type { TodayPlanApiResponse } from '@/lib/ai/types'
import { logAIEvent, logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'

type GoalCandidate = {
  id: string
  title: string
  priority?: string | null
  start_date?: string | null
  end_date?: string | null
  success_criteria?: string | null
  stop_criteria?: string | null
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goals: any[]
  defaultDate: string
  ab1TodayPlanVariant?: 'A' | 'B' | null
  source?: 'dashboard' | 'today'
  triggerLabel?: string
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost'
  triggerClassName?: string
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'
  trigger?: ReactNode
}

export function AITodayPlanButton({
  dict,
  goals,
  defaultDate,
  ab1TodayPlanVariant = null,
  source = 'today',
  triggerLabel,
  triggerVariant = 'outline',
  triggerClassName,
  triggerSize = 'lg',
  trigger,
}: Props) {
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<TodayPlanOutput | null>(null)
  const [aiRecommendationId, setAiRecommendationId] = useState<string | null>(null)
  const [aiOutcomeState, setAiOutcomeState] = useState<'idle' | 'adopted' | 'dismissed'>('idle')
  const [aiMeta, setAiMeta] = useState<{
    strategyVersion?: string
    promptVersion?: string
    model?: string
  } | null>(null)
  const [selected, setSelected] = useState<{ recIndex: number; minutes: 5 | 10 | 20 } | null>(null)

  const locale = useMemo(() => {
    const value = String(dict?.common?.locale || '').toLowerCase()
    return value.startsWith('zh') ? 'zh' : 'en'
  }, [dict])

  const candidateGoals = useMemo(() => {
    const list = Array.isArray(goals) ? goals : []
    return list
      .map(goal => {
        const obj = goal as Record<string, unknown>
        return {
          id: typeof obj.id === 'string' ? obj.id : '',
          title: typeof obj.title === 'string' ? obj.title : '',
          priority: typeof obj.priority === 'string' ? obj.priority : null,
          start_date: typeof obj.start_date === 'string' ? obj.start_date : null,
          end_date: typeof obj.end_date === 'string' ? obj.end_date : null,
          success_criteria: typeof obj.success_criteria === 'string' ? obj.success_criteria : null,
          stop_criteria: typeof obj.stop_criteria === 'string' ? obj.stop_criteria : null,
        }
      })
      .filter(goal => goal.id && goal.title) as GoalCandidate[]
  }, [goals])

  function pickFallbackGoalId() {
    const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
    return (
      [...candidateGoals]
        .sort((a, b) => {
          const pa = pMap[a.priority || 'medium'] ?? 2
          const pb = pMap[b.priority || 'medium'] ?? 2
          if (pa !== pb) return pb - pa
          const ea = a.end_date || '9999-12-31'
          const eb = b.end_date || '9999-12-31'
          if (ea !== eb) return ea < eb ? -1 : 1
          return a.title.localeCompare(b.title)
        })[0]?.id || null
    )
  }

  function getVariantLabel(minutes: 5 | 10 | 20) {
    const planning = (dict?.dashboard?.planning as Record<string, string> | undefined) || {}
    if (minutes === 5) return planning.aiPlanVariant5 || '5 分钟起步'
    if (minutes === 10) return planning.aiPlanVariant10 || '10 分钟推进'
    return planning.aiPlanVariant20 || '20 分钟完成一段'
  }

  async function openAIPlan() {
    setAiOpen(true)
    setAiError(null)
    setAiResult(null)
    setAiRecommendationId(null)
    setAiOutcomeState('idle')
    setAiMeta(null)
    setSelected(null)
    if (candidateGoals.length === 0) return

    logEvent('ai_today_plan_click', { source, variant: ab1TodayPlanVariant })
    sendAIFeedback('ai_today_plan_click', { source, variant: ab1TodayPlanVariant })

    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/today-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ today: defaultDate, goals: candidateGoals, locale }),
      })
      const json = (await res.json()) as TodayPlanApiResponse & { error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        const msg = (dict?.common?.errors as Record<string, string> | undefined)?.[key]
        setAiError(msg || dict?.common?.errors?.operation_failed || 'Operation failed')
        return
      }

      if (!json.ok || !json.data || !json.recommendationId) {
        setAiError(dict?.common?.errors?.operation_failed || 'Operation failed')
        return
      }

      setAiResult(json.data)
      setAiRecommendationId(json.recommendationId)
      setAiMeta({
        strategyVersion: json.strategyVersion,
        promptVersion: json.promptVersion,
        model: json.model,
      })
      const preferredIndex = json.data.recommendations.findIndex(item => item.kind === 'core')
      setSelected({
        recIndex: preferredIndex >= 0 ? preferredIndex : 0,
        minutes: 10,
      })
      logAIEvent('ai_today_plan_suggested', {
        options: json.data.recommendations.length,
        variant: ab1TodayPlanVariant,
      }, {
        recommendation_id: json.recommendationId,
        scene: json.scene,
        strategy_version: json.strategyVersion || null,
        prompt_version: json.promptVersion || null,
        model: json.model || null,
      })
      sendAIFeedback('ai_today_plan_suggested', {
        options: json.data.recommendations.length,
        variant: ab1TodayPlanVariant,
        recommendation_id: json.recommendationId,
        scene: json.scene,
        strategy_version: json.strategyVersion || null,
        prompt_version: json.promptVersion || null,
        model: json.model || null,
      })
    } catch {
      setAiError(dict?.common?.errors?.operation_failed || 'Operation failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function dismissRecommendation() {
    if (!aiRecommendationId || aiOutcomeState !== 'idle') return
    setAiOutcomeState('dismissed')
    logAIEvent('ai_today_plan_dismiss', {
      source,
      variant: ab1TodayPlanVariant,
    }, {
      recommendation_id: aiRecommendationId,
      scene: 'today_plan',
      strategy_version: aiMeta?.strategyVersion || null,
      prompt_version: aiMeta?.promptVersion || null,
      model: aiMeta?.model || null,
    })
    sendAIFeedback('ai_today_plan_dismiss', {
      source,
      variant: ab1TodayPlanVariant,
      recommendation_id: aiRecommendationId,
      scene: 'today_plan',
      strategy_version: aiMeta?.strategyVersion || null,
      prompt_version: aiMeta?.promptVersion || null,
      model: aiMeta?.model || null,
    })
    try {
      await fetch(`/api/ai/recommendations/${aiRecommendationId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackLabel: 'dismiss' }),
      })
    } catch {
    }
  }

  async function applySelected() {
    if (!aiResult || !selected || !aiRecommendationId) return
    const recommendation = aiResult.recommendations[selected.recIndex]
    const variant = recommendation?.variants.find(item => item.minutes === selected.minutes)
    if (!recommendation || !variant) return

    const goalId = recommendation.goal_id || pickFallbackGoalId()
    if (!goalId) return

    const formData = new FormData()
    formData.set('goal_id', goalId)
    formData.set('title', variant.title)
    formData.set('type', 'core')
    formData.set('priority', 'medium')
    formData.set(
      'description',
      [`First step: ${variant.first_step}`, `DoD: ${variant.definition_of_done}`, `Reason: ${recommendation.reason}`].join('\n')
    )
    formData.set('start_date', defaultDate)
    formData.set('end_date', defaultDate)
    formData.set('ai_recommendation_id', aiRecommendationId)

    setAiLoading(true)
    try {
      const created = await createActionAndReturnId(formData) as { actionId?: string | null }
      const optionSelected = `${selected.minutes}m` as '5m' | '10m' | '20m'
      setAiOutcomeState('adopted')
      void fetch(`/api/ai/recommendations/${aiRecommendationId}/adopt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionSelected,
          actionId: created?.actionId || null,
        }),
      }).catch(() => {
      })
      logAIEvent('ai_today_plan_apply', {
        option: optionSelected,
        goal_id: goalId,
        variant: ab1TodayPlanVariant,
      }, {
        recommendation_id: aiRecommendationId,
        scene: 'today_plan',
        strategy_version: aiMeta?.strategyVersion || null,
        prompt_version: aiMeta?.promptVersion || null,
        model: aiMeta?.model || null,
        variant_minutes: selected.minutes,
      })
      sendAIFeedback('ai_today_plan_apply', {
        option: optionSelected,
        goal_id: goalId,
        variant: ab1TodayPlanVariant,
        recommendation_id: aiRecommendationId,
        scene: 'today_plan',
        strategy_version: aiMeta?.strategyVersion || null,
        prompt_version: aiMeta?.promptVersion || null,
        model: aiMeta?.model || null,
        variant_minutes: selected.minutes,
      })
      setAiOpen(false)
    } catch {
      setAiError(dict?.common?.errors?.operation_failed || 'Operation failed')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={openAIPlan} className={candidateGoals.length === 0 ? 'pointer-events-none opacity-60' : undefined}>
          {trigger}
        </div>
      ) : (
        <Button
          type="button"
          size={triggerSize}
          variant={triggerVariant}
          className={triggerClassName}
          onClick={openAIPlan}
          disabled={aiLoading || candidateGoals.length === 0}
        >
          {aiLoading && <LoadingSpinner size={16} className="mr-2 text-current" />}
          {triggerLabel
            || (dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanBtn
            || 'AI Suggest a Core Action (Draft)'}
        </Button>
      )}

      <Dialog
        open={aiOpen}
        onOpenChange={(open) => {
          if (!open && aiOpen && aiResult && !aiLoading && aiOutcomeState === 'idle') {
            void dismissRecommendation()
          }
          setAiOpen(open)
        }}
      >
        <DialogFormContent className="max-w-2xl overflow-hidden border-border/60 bg-background p-0">
          <DialogHeader className="border-b border-border/50 px-6 pb-4 pt-6">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI Coach
            </div>
            <DialogTitle className="text-2xl leading-tight sm:text-[30px]">
              {(dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanTitle || 'AI Core Action (Draft)'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            {aiError && <div className="mb-4 text-sm text-destructive">{aiError}</div>}

            {aiResult ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                  <div className="inline-flex items-start gap-2 font-medium text-foreground">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {((dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanDurationHint) || '下面的选项表示预计投入时间。'}
                    </span>
                  </div>
                </div>

                {aiResult.recommendations.map((recommendation, idx) => {
                  const currentVariant = recommendation.variants.find(item => item.minutes === selected?.minutes)
                  const isSelectedRecommendation = selected?.recIndex === idx
                  return (
                    <div
                      key={`${recommendation.kind}-${idx}`}
                      className={`rounded-2xl border p-5 transition-colors ${
                        isSelectedRecommendation
                          ? 'border-primary/30 bg-primary/4'
                          : 'border-border/60 bg-card'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                              {recommendation.kind === 'core'
                                ? ((dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanRecommendedLabel
                                  || (dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanCoreLabel
                                  || '推荐')
                                : ((dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanAlternativeLabel
                                  || (dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanAltLabel
                                  || '备选')}
                            </div>
                            <div className="max-w-2xl text-sm leading-6 text-muted-foreground">{recommendation.reason}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          {recommendation.variants.map(variant => {
                            const active = selected?.recIndex === idx && selected.minutes === variant.minutes
                            return (
                              <Button
                                key={variant.minutes}
                                type="button"
                                variant={active ? 'default' : 'outline'}
                                onClick={() => setSelected({ recIndex: idx, minutes: variant.minutes })}
                                disabled={aiLoading}
                                className="h-auto min-h-14 whitespace-normal rounded-2xl px-4 py-3 text-sm leading-5"
                              >
                                {getVariantLabel(variant.minutes)}
                              </Button>
                            )
                          })}
                        </div>

                        {isSelectedRecommendation && currentVariant ? (
                          <div className="rounded-2xl border border-border/60 bg-background p-5 text-sm">
                            <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
                              <div className="space-y-4">
                                <div>
                                  <div className="text-lg font-semibold leading-8">{currentVariant.title}</div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {((dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanFirstStep) || '第一步'}
                                  </div>
                                  <div className="leading-7">{currentVariant.first_step}</div>
                                </div>
                              </div>
                              <div className="rounded-xl bg-muted/40 p-4">
                                <div className="space-y-2">
                                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground inline-flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {((dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanDefinitionOfDone) || '完成标准'}
                                  </div>
                                  <div className="leading-7">{currentVariant.definition_of_done}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}

                <div className="flex justify-end gap-2 border-t border-border/50 pt-4">
                  <Button type="button" variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading} className="rounded-full px-5">
                    {dict?.common?.cancel || 'Cancel'}
                  </Button>
                  <Button type="button" onClick={applySelected} disabled={aiLoading || !selected} className="rounded-full px-5">
                    {aiLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
                    {(dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanApplyBtn || 'Apply & Create'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-sm text-muted-foreground">
                {aiLoading
                  ? ((dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanLoading || 'Generating...')
                  : ((dict?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanHint || 'Click to generate suggestions')}
              </div>
            )}
          </div>
        </DialogFormContent>
      </Dialog>
    </>
  )
}
