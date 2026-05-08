'use client'

import { Calendar, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SetCoreActionSheet } from '@/components/SetCoreActionSheet'
import { createActionAndReturnId } from '@/app/(authenticated)/goals/actions'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogFormContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TodayPlanOutput } from '@/lib/ai/phase2aSchemas'
import type { TodayPlanApiResponse } from '@/lib/ai/types'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'

// We need to pass through the props required by SetCoreActionSheet
// Since SetCoreActionSheet is complex, we assume the parent passes down compatible props or the component itself.
// But DailyPlanningCard is client-side, and SetCoreActionSheet is client-side.
// We'll accept the necessary data props.

interface PlanningDict {
  title: string
  desc: string
  planBtn: string
  yesterdayReview: string
}

interface DailyPlanningCardProps {
  dict: PlanningDict
  activeGoalsCount: number
  yesterdayScore: number | null
  // Props for SetCoreActionSheet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goals: any[] 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictFull: any 
  defaultDate: string
  showAIPlan?: boolean
  ab1TodayPlanVariant?: 'A' | 'B' | null
  className?: string
}

export function DailyPlanningCard({
  dict,
  activeGoalsCount,
  yesterdayScore,
  goals,
  dictFull,
  defaultDate,
  showAIPlan = true,
  ab1TodayPlanVariant = null,
  className
}: DailyPlanningCardProps) {
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<TodayPlanOutput | null>(null)
  const [aiRecommendationId, setAiRecommendationId] = useState<string | null>(null)
  const [aiOutcomeState, setAiOutcomeState] = useState<'idle' | 'adopted' | 'dismissed'>('idle')
  const [selected, setSelected] = useState<{ recIndex: number; minutes: 5 | 10 | 20 } | null>(null)

  const locale = useMemo(() => {
    const l = String(dictFull?.common?.locale || '').toLowerCase()
    return l.startsWith('zh') ? 'zh' : 'en'
  }, [dictFull])

  const candidateGoals = useMemo(() => {
    const list = Array.isArray(goals) ? goals : []
    return list
      .map(g => {
        const obj = g as Record<string, unknown>
        return {
          id: typeof obj.id === 'string' ? obj.id : '',
          title: typeof obj.title === 'string' ? obj.title : '',
          priority: typeof obj.priority === 'string' ? obj.priority : null,
          start_date: typeof obj.start_date === 'string' ? obj.start_date : null,
          end_date: typeof obj.end_date === 'string' ? obj.end_date : null,
          success_criteria: typeof obj.success_criteria === 'string' ? obj.success_criteria : null,
          stop_criteria: typeof obj.stop_criteria === 'string' ? obj.stop_criteria : null
        }
      })
      .filter(g => g.id && g.title)
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

  async function openAIPlan() {
    setAiOpen(true)
    setAiError(null)
    setAiResult(null)
    setAiRecommendationId(null)
    setAiOutcomeState('idle')
    setSelected(null)
    if (candidateGoals.length === 0) return
    logEvent('ai_today_plan_click', { source: 'dashboard', variant: ab1TodayPlanVariant })
    sendAIFeedback('ai_today_plan_click', { source: 'dashboard', variant: ab1TodayPlanVariant })

    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/today-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ today: defaultDate, goals: candidateGoals, locale })
      })
      const json = (await res.json()) as TodayPlanApiResponse & { error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        const msg = (dictFull?.common?.errors as Record<string, string> | undefined)?.[key]
        setAiError(msg || dictFull?.common?.errors?.operation_failed || 'Operation failed')
        return
      }
      if (!json.ok || !json.data || !json.recommendationId) {
        setAiError(dictFull?.common?.errors?.operation_failed || 'Operation failed')
        return
      }
      setAiResult(json.data)
      setAiRecommendationId(json.recommendationId)
      logEvent('ai_today_plan_suggested', { options: json.data.recommendations.length, variant: ab1TodayPlanVariant })
      sendAIFeedback('ai_today_plan_suggested', { options: json.data.recommendations.length, variant: ab1TodayPlanVariant })
    } catch {
      setAiError(dictFull?.common?.errors?.operation_failed || 'Operation failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function dismissRecommendation() {
    if (!aiRecommendationId || aiOutcomeState !== 'idle') return
    setAiOutcomeState('dismissed')
    logEvent('ai_today_plan_dismiss', { source: 'dashboard', variant: ab1TodayPlanVariant })
    sendAIFeedback('ai_today_plan_dismiss', { source: 'dashboard', variant: ab1TodayPlanVariant })
    try {
      await fetch(`/api/ai/recommendations/${aiRecommendationId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackLabel: 'dismiss' })
      })
    } catch {
    }
  }

  async function applySelected() {
    if (!aiResult || !selected || !aiRecommendationId) return
    const rec = aiResult.recommendations[selected.recIndex]
    const variant = rec?.variants.find(v => v.minutes === selected.minutes)
    if (!rec || !variant) return

    const goalId = rec.goal_id || pickFallbackGoalId()
    if (!goalId) return

    const formData = new FormData()
    formData.set('goal_id', goalId)
    formData.set('title', variant.title)
    formData.set('type', 'core')
    formData.set('priority', 'medium')
    formData.set('description', [`First step: ${variant.first_step}`, `DoD: ${variant.definition_of_done}`, `Reason: ${rec.reason}`].join('\n'))
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
          actionId: created?.actionId || null
        })
      }).catch(() => {
      })
      logEvent('ai_today_plan_apply', { option: `${selected.minutes}m`, goal_id: goalId, variant: ab1TodayPlanVariant })
      sendAIFeedback('ai_today_plan_apply', { option: `${selected.minutes}m`, goal_id: goalId, variant: ab1TodayPlanVariant })
      setAiOpen(false)
    } catch {
      setAiError(dictFull?.common?.errors?.operation_failed || 'Operation failed')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Card className="h-full overflow-hidden border-dashed border-2 border-muted hover:border-primary/20 transition-colors">
        <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight mb-2">
            {dict.title}
          </h3>

          <p className="text-muted-foreground max-w-md mb-8">
            {dict.desc.replace('{count}', activeGoalsCount.toString())}
          </p>

          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="w-full">
              <SetCoreActionSheet 
                goals={goals} 
                dict={dictFull} 
                defaultDate={defaultDate}
                trigger={
                  <Button size="lg" className="w-full rounded-full shadow-md">
                    {dict.planBtn} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                }
              />
            </div>

            {showAIPlan ? (
              <div className="w-full">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={openAIPlan}
                  disabled={aiLoading || candidateGoals.length === 0}
                >
                  {aiLoading && <LoadingSpinner size={16} className="mr-2 text-current" />}
                  {(dictFull?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanBtn || 'AI 给我一个今日核心行动（草案）'}
                </Button>
              </div>
            ) : null}
            
            {yesterdayScore !== null && (
              <p className="text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                {dict.yesterdayReview.replace('{score}', yesterdayScore.toString())}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={aiOpen}
        onOpenChange={(open) => {
          if (!open && aiOpen && aiResult && !aiLoading && aiOutcomeState === 'idle') {
            void dismissRecommendation()
          }
          setAiOpen(open)
        }}
      >
        <DialogFormContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{(dictFull?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanTitle || 'AI 今日核心行动（草案）'}</DialogTitle>
          </DialogHeader>

          {aiError && <div className="text-sm text-destructive">{aiError}</div>}

          {aiResult ? (
            <div className="space-y-4">
              {aiResult.recommendations.map((rec, idx) => (
                <div key={`${rec.kind}-${idx}`} className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                  <div className="text-sm font-medium">{rec.kind === 'core' ? ((dictFull?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanCoreLabel || '核心') : ((dictFull?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanAltLabel || '备选')}</div>
                  <div className="text-sm text-muted-foreground">{rec.reason}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {rec.variants.map(v => {
                      const active = selected?.recIndex === idx && selected.minutes === v.minutes
                      return (
                        <Button
                          key={v.minutes}
                          type="button"
                          variant={active ? 'default' : 'outline'}
                          onClick={() => setSelected({ recIndex: idx, minutes: v.minutes })}
                          disabled={aiLoading}
                        >
                          {v.minutes}m
                        </Button>
                      )
                    })}
                  </div>

                  {selected?.recIndex === idx ? (
                    <div className="rounded-md border bg-background/50 p-3 text-sm space-y-1">
                      <div className="font-medium">{rec.variants.find(v => v.minutes === selected.minutes)?.title}</div>
                      <div className="text-xs text-muted-foreground">{rec.variants.find(v => v.minutes === selected.minutes)?.first_step}</div>
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading}>
                  {dictFull?.common?.cancel || 'Cancel'}
                </Button>
                <Button type="button" onClick={applySelected} disabled={aiLoading || !selected}>
                  {aiLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
                  {(dictFull?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanApplyBtn || '采用并创建'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {aiLoading ? ((dictFull?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanLoading || '正在生成...') : ((dictFull?.dashboard?.planning as Record<string, string> | undefined)?.aiPlanHint || '点击按钮生成今日建议')}
            </div>
          )}
        </DialogFormContent>
      </Dialog>
    </div>
  )
}
