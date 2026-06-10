'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, Clock3, Sparkles } from 'lucide-react'
import { applyAITodayPlanToExistingAction, createActionAndReturnId } from '@/app/(authenticated)/goals/actions'
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
import type { CommonErrorDictionary, DashboardPlanningDictionary } from '@/i18n/types'
import { DESKTOP_MODAL_SHELL_CLASS } from '@/components/responsive-classes'

type GoalCandidate = {
  id: string
  title: string
  priority?: string | null
  start_date?: string | null
  end_date?: string | null
  success_criteria?: string | null
  stop_criteria?: string | null
}

type ActionCandidate = {
  id: string
  title: string
  description?: string | null
  goal_id?: string | null
  goal_title?: string | null
  type?: string | null
  priority?: string | null
  completed?: boolean
  start_date?: string | null
  end_date?: string | null
}

function buildPlanDescription(params: {
  locale: 'zh' | 'en'
  sourceActionTitle?: string | null
  firstStep: string
  definitionOfDone: string
  reason: string
}) {
  const { locale, sourceActionTitle, firstStep, definitionOfDone, reason } = params
  const isZh = locale === 'zh'
  return [
    sourceActionTitle
      ? (isZh ? `基于任务：${sourceActionTitle}` : `Based on: ${sourceActionTitle}`)
      : null,
    isZh ? `第一步：${firstStep}` : `First step: ${firstStep}`,
    isZh ? `完成标准：${definitionOfDone}` : `DoD: ${definitionOfDone}`,
    isZh ? `建议原因：${reason}` : `Reason: ${reason}`,
  ]
    .filter(Boolean)
    .join('\n')
}

interface Props {
  dict?: {
    common?: {
      locale?: string
      cancel?: string
      errors?: CommonErrorDictionary
    }
    dashboard?: {
      planning?: DashboardPlanningDictionary
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goals: any[]
  actions?: ActionCandidate[]
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
  actions = [],
  defaultDate,
  ab1TodayPlanVariant = null,
  source = 'today',
  triggerLabel,
  triggerVariant = 'outline',
  triggerClassName,
  triggerSize = 'lg',
  trigger,
}: Props) {
  const planning: Partial<DashboardPlanningDictionary> = dict?.dashboard?.planning ?? {}
  const commonErrors = dict?.common?.errors
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

  const candidateActions = useMemo(() => {
    const list = Array.isArray(actions) ? actions : []
    return list
      .map(action => ({
        id: typeof action.id === 'string' ? action.id : '',
        title: typeof action.title === 'string' ? action.title : '',
        description: typeof action.description === 'string' ? action.description : null,
        goal_id: typeof action.goal_id === 'string' ? action.goal_id : null,
        goal_title: typeof action.goal_title === 'string' ? action.goal_title : null,
        type: typeof action.type === 'string' ? action.type : null,
        priority: typeof action.priority === 'string' ? action.priority : null,
        completed: typeof action.completed === 'boolean' ? action.completed : false,
        start_date: typeof action.start_date === 'string' ? action.start_date : null,
        end_date: typeof action.end_date === 'string' ? action.end_date : null,
      }))
      .filter(action => action.id && action.title)
  }, [actions])

  const actionMap = useMemo(
    () => new Map(candidateActions.map(action => [action.id, action])),
    [candidateActions]
  )

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
    if (minutes === 5) return planning.aiPlanVariant5 || '5 分钟起步'
    if (minutes === 10) return planning.aiPlanVariant10 || '10 分钟推进'
    return planning.aiPlanVariant20 || '20 分钟完成一段'
  }

  function getApplyButtonLabel() {
    if (!aiResult || !selected) return planning.aiPlanApplyBtn || 'Apply & Create'
    const recommendation = aiResult.recommendations[selected.recIndex]
    if (recommendation?.source_type === 'existing_action' && recommendation?.source_action_id) {
      return planning.aiPlanApplyExistingBtn || (locale === 'zh' ? '采用并推进现有任务' : 'Apply to Existing Task')
    }
    return planning.aiPlanApplyBtn || 'Apply & Create'
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
        body: JSON.stringify({ today: defaultDate, goals: candidateGoals, actions: candidateActions, locale }),
      })
      const json = (await res.json()) as TodayPlanApiResponse & { error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        const msg = commonErrors?.[key as keyof CommonErrorDictionary]
        setAiError(msg || commonErrors?.operation_failed || 'Operation failed')
        return
      }

      if (!json.ok || !json.data || !json.recommendationId) {
        setAiError(commonErrors?.operation_failed || 'Operation failed')
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
      setAiError(commonErrors?.operation_failed || 'Operation failed')
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

    const sourceAction = recommendation.source_action_id ? actionMap.get(recommendation.source_action_id) : null
    const goalId = recommendation.goal_id || sourceAction?.goal_id || pickFallbackGoalId()
    if (!goalId) return
    const optionSelected = `${selected.minutes}m` as '5m' | '10m' | '20m'
    const adoptionMode = recommendation.source_type === 'existing_action' && sourceAction?.id
      ? 'existing_action'
      : 'new_action'

    setAiLoading(true)
    try {
      let actionId: string | null = null

      if (adoptionMode === 'existing_action' && sourceAction?.id) {
        const formData = new FormData()
        formData.set('action_id', sourceAction.id)
        formData.set('ai_recommendation_id', aiRecommendationId)
        formData.set('first_step', variant.first_step)
        formData.set('definition_of_done', variant.definition_of_done)
        formData.set('reason', recommendation.reason)
        formData.set('variant_label', getVariantLabel(selected.minutes))
        formData.set('source_action_title', recommendation.source_action_title || sourceAction.title)
        formData.set('locale', locale)
        const applied = await applyAITodayPlanToExistingAction(formData) as { actionId?: string | null }
        actionId = applied?.actionId || sourceAction.id
      } else {
        const formData = new FormData()
        formData.set('goal_id', goalId)
        formData.set('title', variant.title)
        formData.set('type', 'core')
        formData.set('priority', 'medium')
        formData.set(
          'description',
          buildPlanDescription({
            locale,
            sourceActionTitle: recommendation.source_action_title,
            firstStep: variant.first_step,
            definitionOfDone: variant.definition_of_done,
            reason: recommendation.reason,
          })
        )
        formData.set('start_date', defaultDate)
        formData.set('end_date', defaultDate)
        formData.set('ai_recommendation_id', aiRecommendationId)
        const created = await createActionAndReturnId(formData) as { actionId?: string | null }
        actionId = created?.actionId || null
      }

      setAiOutcomeState('adopted')
      void fetch(`/api/ai/recommendations/${aiRecommendationId}/adopt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionSelected,
          actionId,
        }),
      }).catch(() => {
      })
      logAIEvent('ai_today_plan_apply', {
        option: optionSelected,
        goal_id: goalId,
        variant: ab1TodayPlanVariant,
        adoption_mode: adoptionMode,
      }, {
        recommendation_id: aiRecommendationId,
        scene: 'today_plan',
        strategy_version: aiMeta?.strategyVersion || null,
        prompt_version: aiMeta?.promptVersion || null,
        model: aiMeta?.model || null,
        variant_minutes: selected.minutes,
        source_action_id: sourceAction?.id || null,
      })
      sendAIFeedback('ai_today_plan_apply', {
        option: optionSelected,
        goal_id: goalId,
        variant: ab1TodayPlanVariant,
        adoption_mode: adoptionMode,
        recommendation_id: aiRecommendationId,
        scene: 'today_plan',
        strategy_version: aiMeta?.strategyVersion || null,
        prompt_version: aiMeta?.promptVersion || null,
        model: aiMeta?.model || null,
        variant_minutes: selected.minutes,
        source_action_id: sourceAction?.id || null,
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
            || planning?.aiPlanBtn
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
        <DialogFormContent className={`flex max-h-[92dvh] max-w-none flex-col overflow-hidden border-border/60 bg-background p-0 shadow-2xl ${DESKTOP_MODAL_SHELL_CLASS} md:max-w-[min(92vw,72rem)]! md:max-h-[88dvh]`}>
          <DialogHeader className="shrink-0 border-b border-border/40 bg-linear-to-b from-primary/5 to-transparent px-4 pb-4 pt-4 md:px-6 md:pb-4 md:pt-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI Coach
            </div>
            <DialogTitle className="max-w-none text-[1.8rem] leading-tight tracking-[-0.02em] md:text-[2rem]">
              {planning?.aiPlanTitle || 'AI Core Action (Draft)'}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
            {aiError && <div className="mb-4 text-sm text-destructive">{aiError}</div>}

            {aiResult ? (
              <div className="space-y-3 md:space-y-4">
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/8 px-4 py-3 text-sm text-muted-foreground">
                  <div className="inline-flex items-start gap-2 font-medium text-foreground">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {planning?.aiPlanDurationHint || '下面的选项表示预计投入时间。'}
                    </span>
                  </div>
                </div>

                {aiResult.recommendations.map((recommendation, idx) => {
                  const currentVariant = recommendation.variants.find(item => item.minutes === selected?.minutes)
                  const isSelectedRecommendation = selected?.recIndex === idx
                  const sourceAction = recommendation.source_action_id ? actionMap.get(recommendation.source_action_id) : null
                  const sourceGoalTitle = sourceAction?.goal_title
                    || candidateGoals.find(goal => goal.id === recommendation.goal_id)?.title
                    || null
                  const whyTodayLabel = locale === 'zh' ? '为什么是今天' : 'Why today'
                  const selectedVersionLabel = locale === 'zh' ? '当前选择' : 'Current choice'
                  return (
                    <div
                      key={`${recommendation.kind}-${idx}`}
                      className={`rounded-[24px] border p-4 transition-all md:p-5 ${
                        isSelectedRecommendation
                          ? 'border-primary/25 bg-primary/[0.035] shadow-sm'
                          : 'border-border/60 bg-card/90'
                      }`}
                    >
                      <div className="space-y-4 md:space-y-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-3">
                            <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                              {recommendation.kind === 'core'
                                ? (planning?.aiPlanRecommendedLabel
                                  || planning?.aiPlanCoreLabel
                                  || '推荐')
                                : (planning?.aiPlanAlternativeLabel
                                  || planning?.aiPlanAltLabel
                                  || '备选')}
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
                              <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                                {whyTodayLabel}
                              </div>
                              <div className="max-w-none text-[15px] leading-8 text-muted-foreground md:text-base">
                                {recommendation.reason}
                              </div>
                            </div>
                            {recommendation.source_action_title ? (
                              <div className="grid gap-2 rounded-2xl border border-border/60 bg-background/80 p-2 text-xs text-muted-foreground lg:grid-cols-3 lg:p-3">
                                <div className="rounded-xl bg-muted/35 px-3 py-2.5">
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                                    {planning.aiPlanBasedOn || '基于当前任务'}
                                  </div>
                                  <div className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
                                    {recommendation.source_action_title}
                                  </div>
                                </div>
                                <div className="rounded-xl bg-muted/35 px-3 py-2.5">
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                                    {planning.aiPlanGoalLabel || '所属目标'}
                                  </div>
                                  <div className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
                                    {sourceGoalTitle || '—'}
                                  </div>
                                </div>
                                <div className="rounded-xl bg-muted/35 px-3 py-2.5">
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
                                    {planning.aiPlanSourceMode || '建议方式'}
                                  </div>
                                  <div className="text-sm font-medium leading-6 text-foreground">
                                    {recommendation.source_type === 'existing_action'
                                      ? (planning.aiPlanSourceExisting || '继续推进现有任务')
                                      : (planning.aiPlanSourceNew || '创建新的今日动作')}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 lg:gap-3">
                          {recommendation.variants.map(variant => {
                            const active = selected?.recIndex === idx && selected.minutes === variant.minutes
                            return (
                              <Button
                                key={variant.minutes}
                                type="button"
                                variant={active ? 'default' : 'outline'}
                                onClick={() => setSelected({ recIndex: idx, minutes: variant.minutes })}
                                disabled={aiLoading}
                                className={`h-auto min-h-15 whitespace-normal rounded-2xl px-4 py-3 text-sm leading-5 transition-all ${
                                  active
                                    ? 'shadow-sm ring-1 ring-primary/20'
                                    : 'border-border/70 bg-background hover:border-primary/30 hover:bg-primary/3'
                                }`}
                              >
                                <span className="flex flex-col items-center gap-1 text-center">
                                  <span>{getVariantLabel(variant.minutes)}</span>
                                  {active ? (
                                    <span className="text-[11px] font-medium opacity-80">
                                      {selectedVersionLabel}
                                    </span>
                                  ) : null}
                                </span>
                              </Button>
                            )
                          })}
                        </div>

                        {isSelectedRecommendation && currentVariant ? (
                          <div className="rounded-[22px] border border-border/60 bg-background/90 p-4 text-sm shadow-sm md:p-5">
                            <div className="grid gap-4 xl:grid-cols-[1.85fr_1fr] xl:gap-5">
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <div className="inline-flex rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-xs font-medium text-primary">
                                    {selectedVersionLabel}: {getVariantLabel(currentVariant.minutes)}
                                  </div>
                                  <div className="text-lg font-semibold leading-8 tracking-[-0.01em] lg:text-xl">{currentVariant.title}</div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {planning?.aiPlanFirstStep || '第一步'}
                                  </div>
                                  <div className="rounded-2xl bg-muted/25 px-4 py-3 leading-7">{currentVariant.first_step}</div>
                                </div>
                              </div>
                              <div className="rounded-2xl border border-border/50 bg-muted/35 p-4">
                                <div className="space-y-2">
                                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground inline-flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {planning?.aiPlanDefinitionOfDone || '完成标准'}
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

                <div className="flex flex-col-reverse gap-3 border-t border-border/50 pt-5 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] md:flex-row md:items-center md:justify-between md:gap-3 md:pb-0">
                  <div className="hidden text-xs text-muted-foreground md:block">
                    {selected ? getVariantLabel(selected.minutes) : ''}
                  </div>
                  <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-2">
                    <Button type="button" variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading} className="w-full rounded-full px-5 md:w-auto">
                      {dict?.common?.cancel || 'Cancel'}
                    </Button>
                    <Button type="button" onClick={applySelected} disabled={aiLoading || !selected} className="w-full rounded-full px-5 md:w-auto">
                      {aiLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
                      {getApplyButtonLabel()}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-sm text-muted-foreground">
                {aiLoading
                  ? (planning?.aiPlanLoading || 'Generating...')
                  : (planning?.aiPlanHint || 'Click to generate suggestions')}
              </div>
            )}
          </div>
        </DialogFormContent>
      </Dialog>
    </>
  )
}
