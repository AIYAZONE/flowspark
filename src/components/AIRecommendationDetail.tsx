'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AIRecommendationDetailRow } from '@/lib/ai/analyticsStore'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  formatAIBooleanLabel,
  formatAIConfidenceLabel,
  formatAIFallbackLabel,
  formatAIFrictionLabel,
  formatAIModelLabel,
  formatAIOptionLabel,
  formatAIStrategyLabel,
  formatAIStatusLabel,
  formatAIPromptLabel,
  getAIFieldHelpText,
} from '@/lib/ai/analyticsPresentation'

type RecommendationDetailDict = {
  aiAnalyticsDetailTitle: string
  aiAnalyticsDetailEmpty: string
  aiAnalyticsDetailGeneratedAt: string
  aiAnalyticsDetailSignalsTitle: string
  aiAnalyticsDetailGenerationTitle: string
  aiAnalyticsDetailWhyTitle: string
  aiAnalyticsDetailVariantsTitle: string
  aiAnalyticsDetailStrategy: string
  aiAnalyticsDetailPrompt: string
  aiAnalyticsDetailModel: string
  aiAnalyticsDetailConfidence: string
  aiAnalyticsDetailFallback: string
  aiAnalyticsDetailOutcome: string
  aiAnalyticsDetailOutput: string
  aiAnalyticsDetailFirstStep: string
  aiAnalyticsDetailDone: string
  aiAnalyticsDetailReason: string
  aiAnalyticsDetailRisk: string
  aiAnalyticsDetailIfThen: string
  aiAnalyticsDetailSelectedOption: string
  aiAnalyticsDetailCompletionMinutes: string
  aiAnalyticsDetailStrategySummary: string
  aiAnalyticsDetailQualityLabels: string
  aiAnalyticsStatusGenerated: string
  aiAnalyticsStatusAdopted: string
  aiAnalyticsStatusCompleted: string
  aiAnalyticsStatusDismissed: string
  aiAnalyticsStatusFallback: string
  aiAnalyticsTechnicalTitle: string
  aiAnalyticsTechnicalDesc: string
  aiAnalyticsFeedbackTitle: string
  aiAnalyticsFeedbackUseful: string
  aiAnalyticsFeedbackNotUseful: string
  aiAnalyticsFeedbackSubmitted: string
  aiAnalyticsFeedbackReasonTitle: string
  aiAnalyticsFeedbackReasonNoTime: string
  aiAnalyticsFeedbackReasonNotFitGoal: string
  aiAnalyticsFeedbackReasonNotFitAction: string
  aiAnalyticsFeedbackReasonNotFitTone: string
  aiAnalyticsFeedbackReasonTooHard: string
  aiAnalyticsFeedbackReasonAlreadyPlanned: string
  aiAnalyticsFeedbackReasonOther: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function renderStatus(detail: AIRecommendationDetailRow, dict: RecommendationDetailDict) {
  return formatAIStatusLabel({
    completed: detail.completed,
    adopted: detail.adopted,
    status: detail.status,
    feedbackLabel: detail.feedback_label,
    fallbackUsed: detail.fallback_used,
  }, dict.aiAnalyticsStatusGenerated === '已生成' ? 'zh' : 'en')
}

function variantRows(output: unknown) {
  const record = asRecord(output)
  const recommendations = Array.isArray(record?.recommendations) ? record?.recommendations : []
  const first = asRecord(recommendations[0])
  const variants = Array.isArray(first?.variants) ? first?.variants : []
  return variants
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      return {
        minutes: typeof row.minutes === 'number' ? `${row.minutes}m` : null,
        title: asString(row.title),
        firstStep: asString(row.first_step),
        done: asString(row.definition_of_done),
      }
    })
    .filter(Boolean) as Array<{
      minutes: string | null
      title: string | null
      firstStep: string | null
      done: string | null
    }>
}

function renderOutput(detail: AIRecommendationDetailRow, dict: RecommendationDetailDict, locale: 'zh' | 'en') {
  const output = asRecord(detail.output_payload)
  if (!output) {
    return <div className="text-sm text-muted-foreground">{dict.aiAnalyticsDetailEmpty}</div>
  }

  if (detail.scene === 'today_plan') {
    const recommendations = Array.isArray(output.recommendations) ? output.recommendations : []
    const first = asRecord(recommendations[0])
    return [
      <div key="why" className="rounded-xl border bg-muted/10 p-3">
        <div className="text-sm font-semibold">{dict.aiAnalyticsDetailWhyTitle}</div>
        <div className="mt-2 text-sm leading-6 text-muted-foreground">{asString(first?.reason) || '-'}</div>
      </div>,
      <div key="variants" className="space-y-3">
        <div className="text-sm font-semibold">{dict.aiAnalyticsDetailVariantsTitle}</div>
        {variantRows(output).map((item, index) => (
          <details key={`${item.minutes || 'variant'}-${index}`} className="rounded-xl border bg-muted/10 p-3">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium leading-6">{item.title || '-'}</div>
                {item.minutes ? (
                  <div className="shrink-0 rounded-full bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.minutes}
                  </div>
                ) : null}
              </div>
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-6">
              {item.firstStep ? (
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs font-medium text-muted-foreground">{dict.aiAnalyticsDetailFirstStep}</div>
                  <div className="mt-1">{item.firstStep}</div>
                </div>
              ) : null}
              {item.done ? (
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs font-medium text-muted-foreground">{dict.aiAnalyticsDetailDone}</div>
                  <div className="mt-1">{item.done}</div>
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </div>,
    ]
  }

  if (detail.scene === 'rescue') {
    const minimal = asRecord(output.minimal_variant)
    const ifThen = asRecord(output.if_then)
    const reason = formatAIFrictionLabel(asString(output.reason_tag), locale)
    const ifText = asString(ifThen?.if)
    const thenText = asString(ifThen?.then)
    return [
      <div key="main" className="space-y-3">
        {reason && reason !== '-' ? (
          <div className="rounded-xl border bg-muted/10 p-3">
            <div className="text-sm font-semibold">{dict.aiAnalyticsDetailWhyTitle}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{reason}</div>
          </div>
        ) : null}
        <div className="rounded-xl border bg-muted/10 p-3">
          <div className="text-sm font-semibold">{asString(minimal?.title) || '-'}</div>
          <div className="mt-3 space-y-3 text-sm leading-6">
            {asString(minimal?.first_step) ? (
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs font-medium text-muted-foreground">{dict.aiAnalyticsDetailFirstStep}</div>
                <div className="mt-1">{asString(minimal?.first_step)}</div>
              </div>
            ) : null}
            {asString(minimal?.definition_of_done) ? (
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs font-medium text-muted-foreground">{dict.aiAnalyticsDetailDone}</div>
                <div className="mt-1">{asString(minimal?.definition_of_done)}</div>
              </div>
            ) : null}
          </div>
        </div>
        {(ifText || thenText) ? (
          <details className="rounded-xl border bg-muted/10 p-3">
            <summary className="cursor-pointer list-none">
              <div className="text-sm font-semibold">{dict.aiAnalyticsDetailIfThen}</div>
            </summary>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {ifText ? <div>{locale === 'zh' ? '如果：' : 'IF: '}{ifText}</div> : null}
              {thenText ? <div>{locale === 'zh' ? '那么：' : 'THEN: '}{thenText}</div> : null}
            </div>
          </details>
        ) : null}
      </div>,
    ]
  }

  if (detail.scene === 'review') {
    const tomorrow = asRecord(output.tomorrow_card)
    const ifThen = asRecord(tomorrow?.if_then)
    const summary = asString(output.summary_sentence)
    const risk = asString(tomorrow?.risk)
    const ifText = asString(ifThen?.if)
    const thenText = asString(ifThen?.then)
    const direction = asString(tomorrow?.suggested_core_action_direction)
    return [
      <div key="review" className="space-y-3">
        {direction ? (
          <div className="rounded-xl border bg-muted/10 p-3">
            <div className="text-sm font-semibold">{dict.aiAnalyticsDetailWhyTitle}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{direction}</div>
          </div>
        ) : null}
        {summary ? (
          <div className="rounded-xl border bg-muted/10 p-3">
            <div className="text-sm font-semibold">{dict.aiAnalyticsDetailOutput}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</div>
          </div>
        ) : null}
        {risk ? (
          <div className="rounded-xl border bg-muted/10 p-3">
            <div className="text-sm font-semibold">{dict.aiAnalyticsDetailRisk}</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{risk}</div>
          </div>
        ) : null}
        {(ifText || thenText) ? (
          <details className="rounded-xl border bg-muted/10 p-3">
            <summary className="cursor-pointer list-none">
              <div className="text-sm font-semibold">{dict.aiAnalyticsDetailIfThen}</div>
            </summary>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {ifText ? <div>{locale === 'zh' ? '如果：' : 'IF: '}{ifText}</div> : null}
              {thenText ? <div>{locale === 'zh' ? '那么：' : 'THEN: '}{thenText}</div> : null}
            </div>
          </details>
        ) : null}
      </div>,
    ].filter(Boolean)
  }

  if (detail.scene === 'weekly_insight') {
    const summary = asString(output.summary)
    const recommendation = asString(output.recommendation)
    const friction = formatAIFrictionLabel(asString(output.topFriction), locale)
    return [
      summary ? (
        <div key="summary" className="rounded-xl border bg-muted/10 p-3">
          <div className="text-sm font-semibold">{dict.aiAnalyticsDetailOutput}</div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</div>
        </div>
      ) : null,
      recommendation ? (
        <div key="recommendation" className="rounded-xl border bg-muted/10 p-3">
          <div className="text-sm font-semibold">{dict.aiAnalyticsDetailWhyTitle}</div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation}</div>
        </div>
      ) : null,
      friction && friction !== '-' ? (
        <div key="friction" className="rounded-xl border bg-muted/10 p-3">
          <div className="text-sm font-semibold">{dict.aiAnalyticsDetailRisk}</div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{friction}</div>
        </div>
      ) : null,
    ].filter(Boolean)
  }

  return <div className="text-sm text-muted-foreground">{dict.aiAnalyticsDetailEmpty}</div>
}

function strategyRows(detail: AIRecommendationDetailRow, locale: 'zh' | 'en') {
  const summary = asRecord(detail.strategy_summary)
  if (!summary) return []
  const hints = Array.isArray(summary.groundingHints)
    ? summary.groundingHints.filter(item => typeof item === 'string')
    : []
  return [
    { label: locale === 'zh' ? '难度模式' : 'Difficulty mode', value: asString(summary.difficultyMode) },
    { label: locale === 'zh' ? '风险级别' : 'Risk level', value: asString(summary.riskLevel) },
    { label: locale === 'zh' ? '关联目标' : 'Linked goal', value: asString(summary.selectedGoalId) },
    { label: locale === 'zh' ? '生成线索' : 'Grounding hints', value: hints.length ? hints.join(' / ') : null },
  ].filter(row => row.value)
}

function qualityRows(detail: AIRecommendationDetailRow, locale: 'zh' | 'en') {
  const quality = asRecord(detail.quality_labels)
  if (!quality) return []
  const reasons = Array.isArray(quality.reasons)
    ? quality.reasons.filter(item => typeof item === 'string')
    : []
  return [
    { label: locale === 'zh' ? '结构有效' : 'Schema valid', value: typeof quality.schema_valid === 'boolean' ? formatAIBooleanLabel(quality.schema_valid, locale) : null },
    { label: 'score', value: typeof quality.actionability_score === 'number' ? String(quality.actionability_score) : null },
    { label: locale === 'zh' ? '可直接采纳' : 'Adoption ready', value: typeof quality.adoption_ready === 'boolean' ? formatAIBooleanLabel(quality.adoption_ready, locale) : null },
    { label: locale === 'zh' ? '需要规则兜底' : 'Needs fallback', value: typeof quality.requires_fallback === 'boolean' ? formatAIBooleanLabel(quality.requires_fallback, locale) : null },
    { label: locale === 'zh' ? '原因' : 'Reasons', value: reasons.length ? reasons.join(' / ') : null },
  ].filter(row => row.value)
}

export function AIRecommendationDetail(props: {
  detail: AIRecommendationDetailRow | null
  dict: RecommendationDetailDict
  locale: 'zh-CN' | 'en-US'
}) {
  const detail = props.detail
  const uiLocale = props.locale === 'zh-CN' ? 'zh' : 'en'
  const detailRef = useRef<HTMLDivElement | null>(null)
  const recommendationId = detail?.recommendation_id || null
  const [feedbackLabel, setFeedbackLabel] = useState<string | null>(detail?.feedback_label ?? null)
  const [isSubmitting, startSubmitting] = useTransition()
  const [reasonOpen, setReasonOpen] = useState(false)

  const allowed = new Set([
    'useful',
    'no_time',
    'not_fit',
    'not_fit_goal',
    'not_fit_action',
    'not_fit_tone',
    'too_hard',
    'already_planned',
    'other',
  ])
  const normalizedFeedback = typeof feedbackLabel === 'string' ? feedbackLabel : null
  const existingFeedback = normalizedFeedback && allowed.has(normalizedFeedback) ? normalizedFeedback : null

  function feedbackText(label: string) {
    if (label === 'useful') return uiLocale === 'zh' ? '有用' : 'Useful'
    if (label === 'no_time') return uiLocale === 'zh' ? '没时间' : 'No time'
    if (label === 'not_fit' || label === 'not_fit_goal') return uiLocale === 'zh' ? '目标不贴合' : 'Goal not a fit'
    if (label === 'not_fit_action') return uiLocale === 'zh' ? '当前行动不贴合' : 'Action not a fit'
    if (label === 'not_fit_tone') return uiLocale === 'zh' ? '表达方式不舒服' : 'Tone not a fit'
    if (label === 'too_hard') return uiLocale === 'zh' ? '太难了' : 'Too hard'
    if (label === 'already_planned') return uiLocale === 'zh' ? '我已经有计划' : 'Already planned'
    return uiLocale === 'zh' ? '其他' : 'Other'
  }

  function submitFeedback(label: string) {
    if (!detail) return
    startSubmitting(async () => {
      try {
        const res = await fetch(`/api/ai/recommendations/${detail.recommendation_id}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackLabel: label }),
        })
        if (!res.ok) return
        setFeedbackLabel(label)
      } catch {
      }
    })
  }

  useEffect(() => {
    if (!recommendationId) return
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#detail') return
    detailRef.current?.scrollIntoView({ block: 'start' })
  }, [recommendationId])

  if (!detail) {
    return (
      <div ref={detailRef} id="detail" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle>{props.dict.aiAnalyticsDetailTitle}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {props.dict.aiAnalyticsDetailEmpty}
          </CardContent>
        </Card>
      </div>
    )
  }

  const strategyInfo = strategyRows(detail, uiLocale)
  const qualityInfo = qualityRows(detail, uiLocale)

  return (
    <div ref={detailRef} id="detail" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <CardTitle>{props.dict.aiAnalyticsDetailTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="text-xs font-medium text-muted-foreground">{props.dict.aiAnalyticsDetailOutcome}</div>
              <div className="mt-1 text-sm font-medium">{renderStatus(detail, props.dict)}</div>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="text-xs font-medium text-muted-foreground">{props.dict.aiAnalyticsDetailGeneratedAt}</div>
              <div className="mt-1 text-sm font-medium">
                {detail.created_at ? new Date(detail.created_at).toLocaleString(props.locale) : '-'}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border p-4">
            <div className="text-sm font-semibold">{props.dict.aiAnalyticsDetailOutput}</div>
            <div className="space-y-3">{renderOutput(detail, props.dict, uiLocale)}</div>
          </div>

          <div className="space-y-3 rounded-2xl border p-4">
            <div className="text-sm font-semibold">{props.dict.aiAnalyticsDetailSignalsTitle}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/10 p-3">
                <div className="text-xs font-medium text-muted-foreground">{props.dict.aiAnalyticsDetailFallback}</div>
                <div className="mt-1 text-sm font-medium">{formatAIFallbackLabel(detail.fallback_used, uiLocale)}</div>
              </div>
              <div className="rounded-xl border bg-muted/10 p-3">
                <div className="text-xs font-medium text-muted-foreground">{props.dict.aiAnalyticsDetailConfidence}</div>
                <div className="mt-1 text-sm font-medium">{formatAIConfidenceLabel(detail.confidence, uiLocale)}</div>
              </div>
              <div className="rounded-xl border bg-muted/10 p-3">
                <div className="text-xs font-medium text-muted-foreground">{props.dict.aiAnalyticsDetailSelectedOption}</div>
                <div className="mt-1 text-sm font-medium">{formatAIOptionLabel(detail.option_selected || detail.feedback_label, uiLocale)}</div>
              </div>
              <div className="rounded-xl border bg-muted/10 p-3">
                <div className="text-xs font-medium text-muted-foreground">{props.dict.aiAnalyticsDetailCompletionMinutes}</div>
                <div className="mt-1 text-sm font-medium">
                  {detail.completion_minutes == null ? '-' : `${detail.completion_minutes}m`}
                </div>
              </div>
            </div>
          </div>

          <details className="rounded-2xl border bg-muted/10 p-4">
            <summary className="cursor-pointer list-none">
              <div className="space-y-1">
                <div className="text-sm font-semibold">{props.dict.aiAnalyticsDetailGenerationTitle}</div>
                <div className="text-sm text-muted-foreground">{getAIFieldHelpText('technical', uiLocale)}</div>
              </div>
            </summary>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailStrategy}</span>
                <span className="text-right">
                  <span className="block font-medium">{formatAIStrategyLabel(detail.scene, detail.strategy_version, uiLocale)}</span>
                  <span className="block text-xs text-muted-foreground">{detail.strategy_version || '-'}</span>
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailPrompt}</span>
                <span className="text-right">
                  <span className="block font-medium">{formatAIPromptLabel(detail.scene, detail.prompt_version, uiLocale)}</span>
                  <span className="block text-xs text-muted-foreground">{detail.prompt_version || '-'}</span>
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailModel}</span>
                <span className="text-right">
                  <span className="block font-medium">{formatAIModelLabel(detail.model, uiLocale)}</span>
                  <span className="block text-xs text-muted-foreground">{detail.model || '-'}</span>
                </span>
              </div>
            </div>
          </details>

        {(strategyInfo.length > 0 || qualityInfo.length > 0) ? (
          <details className="rounded-2xl border bg-muted/10 p-4">
            <summary className="cursor-pointer list-none">
              <div className="space-y-1">
                <div className="text-sm font-semibold">{props.dict.aiAnalyticsTechnicalTitle}</div>
                <div className="text-sm text-muted-foreground">{props.dict.aiAnalyticsTechnicalDesc || getAIFieldHelpText('technical', uiLocale)}</div>
              </div>
            </summary>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border bg-background p-4">
                <div className="text-sm font-semibold">{props.dict.aiAnalyticsDetailStrategySummary}</div>
                <div className="space-y-3 text-sm">
                  {strategyInfo.map((row, index) => (
                    <div key={`${row.label}-${index}`} className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-right font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border bg-background p-4">
                <div className="text-sm font-semibold">{props.dict.aiAnalyticsDetailQualityLabels}</div>
                <div className="space-y-3 text-sm">
                  {qualityInfo.map((row, index) => (
                    <div key={`${row.label}-${index}`} className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-right font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        ) : null}

          <div className="rounded-2xl border bg-muted/10 p-4">
            <div className="text-sm font-semibold">{props.dict.aiAnalyticsFeedbackTitle}</div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              {existingFeedback ? (
                <div className="text-sm text-muted-foreground">
                  {props.dict.aiAnalyticsFeedbackSubmitted}：{feedbackText(existingFeedback)}
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={isSubmitting}
                    onClick={() => submitFeedback('useful')}
                  >
                    {isSubmitting ? <LoadingSpinner size={16} /> : null}
                    <span className={isSubmitting ? 'ml-2' : ''}>{props.dict.aiAnalyticsFeedbackUseful}</span>
                  </Button>
                  <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <LoadingSpinner size={16} /> : null}
                        <span className={isSubmitting ? 'ml-2' : ''}>{props.dict.aiAnalyticsFeedbackNotUseful}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>{props.dict.aiAnalyticsFeedbackReasonTitle}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        {[
                          { key: 'no_time', label: props.dict.aiAnalyticsFeedbackReasonNoTime },
                          { key: 'not_fit_goal', label: props.dict.aiAnalyticsFeedbackReasonNotFitGoal },
                          { key: 'not_fit_action', label: props.dict.aiAnalyticsFeedbackReasonNotFitAction },
                          { key: 'not_fit_tone', label: props.dict.aiAnalyticsFeedbackReasonNotFitTone },
                          { key: 'too_hard', label: props.dict.aiAnalyticsFeedbackReasonTooHard },
                          { key: 'already_planned', label: props.dict.aiAnalyticsFeedbackReasonAlreadyPlanned },
                          { key: 'other', label: props.dict.aiAnalyticsFeedbackReasonOther },
                        ].map(item => (
                          <Button
                            key={item.key}
                            type="button"
                            variant="outline"
                            className="w-full justify-start"
                            disabled={isSubmitting}
                            onClick={() => {
                              setReasonOpen(false)
                              submitFeedback(item.key)
                            }}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
