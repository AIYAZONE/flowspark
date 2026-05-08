import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AIRecommendationDetailRow } from '@/lib/ai/analyticsStore'

type RecommendationDetailDict = {
  aiAnalyticsDetailTitle: string
  aiAnalyticsDetailEmpty: string
  aiAnalyticsDetailGeneratedAt: string
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
  aiAnalyticsStatusGenerated: string
  aiAnalyticsStatusAdopted: string
  aiAnalyticsStatusCompleted: string
  aiAnalyticsStatusDismissed: string
  aiAnalyticsStatusFallback: string
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
  if (detail.completed) return dict.aiAnalyticsStatusCompleted
  if (detail.adopted) return dict.aiAnalyticsStatusAdopted
  if (detail.status === 'dismissed' || detail.feedback_label === 'dismiss' || detail.feedback_label === 'close_result') {
    return dict.aiAnalyticsStatusDismissed
  }
  if (detail.fallback_used) return dict.aiAnalyticsStatusFallback
  return dict.aiAnalyticsStatusGenerated
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

function outputSummary(detail: AIRecommendationDetailRow, dict: RecommendationDetailDict) {
  const output = asRecord(detail.output_payload)
  if (!output) return []

  if (detail.scene === 'today_plan') {
    const recommendations = Array.isArray(output.recommendations) ? output.recommendations : []
    const first = asRecord(recommendations[0])
    const rows = [
      { label: dict.aiAnalyticsDetailReason, value: asString(first?.reason) },
    ]
    const variants = variantRows(output)
    return [
      ...rows.filter(row => row.value),
      ...variants.flatMap(item => ([
        { label: item.minutes || '-', value: item.title },
        { label: dict.aiAnalyticsDetailFirstStep, value: item.firstStep },
        { label: dict.aiAnalyticsDetailDone, value: item.done },
      ])),
    ]
  }

  if (detail.scene === 'rescue') {
    const minimal = asRecord(output.minimal_variant)
    const ifThen = asRecord(output.if_then)
    return [
      { label: dict.aiAnalyticsDetailReason, value: asString(output.reason_tag) },
      { label: '-', value: asString(minimal?.title) },
      { label: dict.aiAnalyticsDetailFirstStep, value: asString(minimal?.first_step) },
      { label: dict.aiAnalyticsDetailDone, value: asString(minimal?.definition_of_done) },
      { label: dict.aiAnalyticsDetailIfThen, value: [asString(ifThen?.if), asString(ifThen?.then)].filter(Boolean).join(' -> ') || null },
    ].filter(row => row.value)
  }

  if (detail.scene === 'review') {
    const tomorrow = asRecord(output.tomorrow_card)
    const ifThen = asRecord(tomorrow?.if_then)
    return [
      { label: '-', value: asString(output.summary_sentence) },
      { label: dict.aiAnalyticsDetailRisk, value: asString(tomorrow?.risk) },
      { label: dict.aiAnalyticsDetailIfThen, value: [asString(ifThen?.if), asString(ifThen?.then)].filter(Boolean).join(' -> ') || null },
      { label: dict.aiAnalyticsDetailReason, value: asString(tomorrow?.suggested_core_action_direction) },
    ].filter(row => row.value)
  }

  if (detail.scene === 'weekly_insight') {
    return [
      { label: '-', value: asString(output.summary) },
      { label: dict.aiAnalyticsDetailReason, value: asString(output.recommendation) },
      { label: dict.aiAnalyticsDetailRisk, value: asString(output.topFriction) },
    ].filter(row => row.value)
  }

  return []
}

export function AIRecommendationDetail(props: {
  detail: AIRecommendationDetailRow | null
  dict: RecommendationDetailDict
  locale: 'zh-CN' | 'en-US'
}) {
  if (!props.detail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{props.dict.aiAnalyticsDetailTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {props.dict.aiAnalyticsDetailEmpty}
        </CardContent>
      </Card>
    )
  }

  const detail = props.detail
  const outputRows = outputSummary(detail, props.dict)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.dict.aiAnalyticsDetailTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {props.dict.aiAnalyticsDetailGeneratedAt}
            </div>
            <div className="mt-1 text-sm font-medium">
              {detail.created_at ? new Date(detail.created_at).toLocaleString(props.locale) : '-'}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {props.dict.aiAnalyticsDetailOutcome}
            </div>
            <div className="mt-1 text-sm font-medium">{renderStatus(detail, props.dict)}</div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {props.dict.aiAnalyticsDetailFallback}
            </div>
            <div className="mt-1 text-sm font-medium">{detail.fallback_used ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-3 rounded-2xl border p-4">
            <div className="text-sm font-semibold">{props.dict.aiAnalyticsDetailOutput}</div>
            {outputRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">{props.dict.aiAnalyticsDetailEmpty}</div>
            ) : (
              <div className="space-y-3">
                {outputRows.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="rounded-xl border bg-muted/10 p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</div>
                    <div className="mt-1 text-sm leading-6">{row.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border p-4">
            <div className="text-sm font-semibold">{props.dict.aiAnalyticsDetailOutcome}</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailStrategy}</span>
                <span className="text-right font-medium">{detail.strategy_version || '-'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailPrompt}</span>
                <span className="text-right font-medium">{detail.prompt_version || '-'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailModel}</span>
                <span className="text-right font-medium">{detail.model || '-'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailConfidence}</span>
                <span className="text-right font-medium">{detail.confidence || '-'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailSelectedOption}</span>
                <span className="text-right font-medium">{detail.option_selected || detail.feedback_label || '-'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{props.dict.aiAnalyticsDetailCompletionMinutes}</span>
                <span className="text-right font-medium">
                  {detail.completion_minutes == null ? '-' : `${detail.completion_minutes}m`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
