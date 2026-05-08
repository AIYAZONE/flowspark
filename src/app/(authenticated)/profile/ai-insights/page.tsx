import { createClient } from '@/lib/supabase/server'
import { getCurrentLocale, getDictionary } from '@/i18n/get-dictionary'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AIAnalyticsOverview } from '@/components/AIAnalyticsOverview'
import {
  AIAnalyticsTable,
  formatMetricRows,
  formatRecentRows,
} from '@/components/AIAnalyticsTable'
import {
  getAIModelMetrics,
  getAISceneMetrics,
  getAIStrategyMetrics,
  getRecentRecommendations,
} from '@/lib/ai/analyticsStore'
import { cn } from '@/lib/utils'

type AIAnalyticsDict = {
  aiAnalyticsTitle: string
  aiAnalyticsDesc: string
  aiAnalyticsOverview: string
  aiAnalyticsScene: string
  aiAnalyticsStrategy: string
  aiAnalyticsModel: string
  aiAnalyticsRecent: string
  aiAnalyticsTotal: string
  aiAnalyticsAdoptionRate: string
  aiAnalyticsCompletionRate: string
  aiAnalyticsFallbackRate: string
  aiAnalyticsEmpty: string
  aiAnalyticsColumnScene: string
  aiAnalyticsColumnStrategy: string
  aiAnalyticsColumnPrompt: string
  aiAnalyticsColumnModel: string
  aiAnalyticsColumnRecommendations: string
  aiAnalyticsColumnAdoptionRate: string
  aiAnalyticsColumnCompletionRate: string
  aiAnalyticsColumnFallbackRate: string
  aiAnalyticsColumnConfidence: string
  aiAnalyticsColumnStatus: string
  aiAnalyticsColumnOption: string
  aiAnalyticsColumnCreatedAt: string
  aiAnalyticsRange7: string
  aiAnalyticsRange30: string
  aiAnalyticsRange90: string
  aiAnalyticsRangeAll: string
  aiAnalyticsSortRecommendations: string
  aiAnalyticsSortAdoption: string
  aiAnalyticsSortCompletion: string
  aiAnalyticsSortFallback: string
  aiAnalyticsStatusGenerated: string
  aiAnalyticsStatusAdopted: string
  aiAnalyticsStatusCompleted: string
  aiAnalyticsStatusDismissed: string
  aiAnalyticsStatusFallback: string
  aiAnalyticsOpenDetail: string
  aiAnalyticsBackToOverview: string
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function sortMetricRows(
  rows: Awaited<ReturnType<typeof getAISceneMetrics>>,
  sort: string
) {
  const cloned = [...rows]
  const sorter =
    sort === 'adoption' ? (a: typeof rows[number], b: typeof rows[number]) => b.adoption_rate - a.adoption_rate
    : sort === 'completion' ? (a: typeof rows[number], b: typeof rows[number]) => b.completion_rate - a.completion_rate
    : sort === 'fallback' ? (a: typeof rows[number], b: typeof rows[number]) => b.fallback_rate - a.fallback_rate
    : (a: typeof rows[number], b: typeof rows[number]) => b.recommendation_count - a.recommendation_count
  return cloned.sort(sorter)
}

function statusBadge(label: string, tone: 'default' | 'green' | 'amber' | 'gray') {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'green' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
        tone === 'amber' && 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
        tone === 'gray' && 'bg-muted text-muted-foreground',
        tone === 'default' && 'bg-primary/10 text-primary'
      )}
    >
      {label}
    </span>
  )
}

export default async function AIInsightsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const dict = await getDictionary()
  const currentLocale = await getCurrentLocale()
  const searchParams = await props.searchParams
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const rangeParam = Array.isArray(searchParams?.range) ? searchParams?.range[0] : searchParams?.range
  const sortParam = Array.isArray(searchParams?.sort) ? searchParams?.sort[0] : searchParams?.sort
  const days =
    rangeParam === '7' ? 7
    : rangeParam === '30' ? 30
    : rangeParam === '90' ? 90
    : undefined
  const sort = sortParam === 'adoption' || sortParam === 'completion' || sortParam === 'fallback'
    ? sortParam
    : 'recommendations'

  const [sceneMetrics, strategyMetrics, modelMetrics, recentRecommendations] = await Promise.all([
    getAISceneMetrics({ supabase, userId: user.id, options: { days } }),
    getAIStrategyMetrics({ supabase, userId: user.id, options: { days } }),
    getAIModelMetrics({ supabase, userId: user.id, options: { days } }),
    getRecentRecommendations({ supabase, userId: user.id, limit: 20, days }),
  ])

  const profileDict = dict.profile as unknown as AIAnalyticsDict
  const locale = currentLocale === 'zh' ? 'zh-CN' : 'en-US'
  const sortedSceneMetrics = sortMetricRows(sceneMetrics, sort)
  const sortedStrategyMetrics = sortMetricRows(strategyMetrics, sort)
  const sortedModelMetrics = sortMetricRows(modelMetrics, sort)
  const filterOptions = [
    { key: 'all', label: profileDict.aiAnalyticsRangeAll, href: '/profile/ai-insights' },
    { key: '7', label: profileDict.aiAnalyticsRange7, href: `/profile/ai-insights?range=7&sort=${sort}` },
    { key: '30', label: profileDict.aiAnalyticsRange30, href: `/profile/ai-insights?range=30&sort=${sort}` },
    { key: '90', label: profileDict.aiAnalyticsRange90, href: `/profile/ai-insights?range=90&sort=${sort}` },
  ]
  const sortOptions = [
    { key: 'recommendations', label: profileDict.aiAnalyticsSortRecommendations },
    { key: 'adoption', label: profileDict.aiAnalyticsSortAdoption },
    { key: 'completion', label: profileDict.aiAnalyticsSortCompletion },
    { key: 'fallback', label: profileDict.aiAnalyticsSortFallback },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{profileDict.aiAnalyticsTitle}</h1>
          <div className="text-sm text-muted-foreground">{profileDict.aiAnalyticsDesc}</div>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/profile">{dict.profile.title}</Link>
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => {
              const active =
                (option.key === 'all' && !days)
                || String(days || '') === option.key
              return (
                <Button
                  key={option.key}
                  asChild
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                >
                  <Link href={option.href}>{option.label}</Link>
                </Button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map(option => {
              const active = sort === option.key
              const query = days ? `?range=${days}&sort=${option.key}` : `?sort=${option.key}`
              return (
                <Button
                  key={option.key}
                  asChild
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-full"
                >
                  <Link href={`/profile/ai-insights${query}`}>{option.label}</Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {sceneMetrics.length === 0 && recentRecommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">
          {profileDict.aiAnalyticsEmpty}
        </div>
      ) : (
        <>
          <AIAnalyticsOverview dict={profileDict} metrics={sortedSceneMetrics} />

          <AIAnalyticsTable
            title={profileDict.aiAnalyticsScene}
            columns={[
              profileDict.aiAnalyticsColumnScene,
              profileDict.aiAnalyticsColumnRecommendations,
              profileDict.aiAnalyticsColumnAdoptionRate,
              profileDict.aiAnalyticsColumnCompletionRate,
              profileDict.aiAnalyticsColumnFallbackRate,
            ]}
            rows={formatMetricRows(sortedSceneMetrics, row => [
              row.scene ? (
                <Link className="font-medium text-primary hover:underline" href={`/profile/ai-insights/${row.scene}${days ? `?range=${days}` : ''}`}>
                  {row.scene}
                </Link>
              ) : '-',
              String(row.recommendation_count),
              <span className="font-medium">{formatPercent(row.adoption_rate)}</span>,
              <span className="font-medium">{formatPercent(row.completion_rate)}</span>,
              <span className="font-medium">{formatPercent(row.fallback_rate)}</span>,
            ])}
          />

          <AIAnalyticsTable
            title={profileDict.aiAnalyticsStrategy}
            columns={[
              profileDict.aiAnalyticsColumnScene,
              profileDict.aiAnalyticsColumnStrategy,
              profileDict.aiAnalyticsColumnPrompt,
              profileDict.aiAnalyticsColumnRecommendations,
              profileDict.aiAnalyticsColumnAdoptionRate,
              profileDict.aiAnalyticsColumnCompletionRate,
            ]}
            rows={formatMetricRows(sortedStrategyMetrics, row => [
              <div className="font-medium">{row.scene || '-'}</div>,
              row.strategy_version || '-',
              <span className="text-muted-foreground">{row.prompt_version || '-'}</span>,
              String(row.recommendation_count),
              <span className="font-medium">{formatPercent(row.adoption_rate)}</span>,
              <span className="font-medium">{formatPercent(row.completion_rate)}</span>,
            ])}
          />

          <AIAnalyticsTable
            title={profileDict.aiAnalyticsModel}
            columns={[
              profileDict.aiAnalyticsColumnScene,
              profileDict.aiAnalyticsColumnModel,
              profileDict.aiAnalyticsColumnRecommendations,
              profileDict.aiAnalyticsColumnAdoptionRate,
              profileDict.aiAnalyticsColumnCompletionRate,
              profileDict.aiAnalyticsColumnConfidence,
            ]}
            rows={formatMetricRows(sortedModelMetrics, row => [
              <div className="font-medium">{row.scene || '-'}</div>,
              row.model || '-',
              String(row.recommendation_count),
              <span className="font-medium">{formatPercent(row.adoption_rate)}</span>,
              <span className="font-medium">{formatPercent(row.completion_rate)}</span>,
              row.avg_confidence_score == null ? '-' : String(row.avg_confidence_score),
            ])}
          />

          <AIAnalyticsTable
            title={profileDict.aiAnalyticsRecent}
            columns={[
              profileDict.aiAnalyticsColumnScene,
              profileDict.aiAnalyticsColumnStrategy,
              profileDict.aiAnalyticsColumnPrompt,
              profileDict.aiAnalyticsColumnModel,
              profileDict.aiAnalyticsColumnStatus,
              profileDict.aiAnalyticsColumnOption,
              profileDict.aiAnalyticsColumnCreatedAt,
              profileDict.aiAnalyticsOpenDetail,
            ]}
            rows={formatRecentRows(recentRecommendations, row => [
              <div className="font-medium">{row.scene || '-'}</div>,
              row.strategy_version || '-',
              <span className="text-muted-foreground">{row.prompt_version || '-'}</span>,
              row.model || '-',
              row.completed
                ? statusBadge(profileDict.aiAnalyticsStatusCompleted, 'green')
                : row.adopted
                  ? statusBadge(profileDict.aiAnalyticsStatusAdopted, 'default')
                  : row.status === 'dismissed' || row.feedback_label === 'dismiss' || row.feedback_label === 'close_result'
                    ? statusBadge(profileDict.aiAnalyticsStatusDismissed, 'gray')
                    : row.fallback_used
                      ? statusBadge(profileDict.aiAnalyticsStatusFallback, 'amber')
                      : statusBadge(profileDict.aiAnalyticsStatusGenerated, 'default'),
              row.option_selected || row.feedback_label || '-',
              row.created_at
                ? new Date(row.created_at).toLocaleString(locale)
                : '-',
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href={`/profile/ai-insights/${row.scene}${days ? `?range=${days}&rid=${row.recommendation_id}` : `?rid=${row.recommendation_id}`}`}>
                  {profileDict.aiAnalyticsOpenDetail}
                </Link>
              </Button>,
            ])}
          />
        </>
      )}
    </div>
  )
}
