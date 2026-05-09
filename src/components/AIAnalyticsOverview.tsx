import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AIMetricRow } from '@/lib/ai/analyticsStore'

interface Props {
  dict: Record<string, string>
  metrics: AIMetricRow[]
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function AIAnalyticsOverview({ dict, metrics }: Props) {
  const total = metrics.reduce((sum, item) => sum + item.recommendation_count, 0)
  const adopted = metrics.reduce((sum, item) => sum + item.adopted_count, 0)
  const completed = metrics.reduce((sum, item) => sum + item.completed_count, 0)
  const fallback = metrics.reduce((sum, item) => sum + Math.round(item.fallback_rate * item.recommendation_count), 0)

  const cards = [
    {
      title: dict.aiAnalyticsTotal || '总建议数',
      value: String(total),
      helpText: dict.aiAnalyticsTotalHelp || '这段时间系统一共给了你多少条 AI 建议。',
    },
    {
      title: dict.aiAnalyticsAdoptionRate || '采纳率',
      value: total ? formatPercent(adopted / total) : '0%',
      helpText: dict.aiAnalyticsAdoptionRateHelp || '你看到建议后，愿意采纳继续执行的比例。',
    },
    {
      title: dict.aiAnalyticsCompletionRate || '完成率',
      value: total ? formatPercent(completed / total) : '0%',
      helpText: dict.aiAnalyticsCompletionRateHelp || '被采纳的建议里，最终推进到完成的比例。',
    },
    {
      title: dict.aiAnalyticsFallbackRate || 'Fallback 占比',
      value: total ? formatPercent(fallback / total) : '0%',
      helpText: dict.aiAnalyticsFallbackRateHelp || '系统没用 AI 主结果，而是改走规则兜底的比例。',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">{card.helpText}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
