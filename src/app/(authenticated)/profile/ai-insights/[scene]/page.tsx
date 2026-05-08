import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getCurrentLocale, getDictionary } from '@/i18n/get-dictionary'
import { AIAnalyticsOverview } from '@/components/AIAnalyticsOverview'
import {
  AIAnalyticsTable,
  formatMetricRows,
  formatRecentRows,
} from '@/components/AIAnalyticsTable'
import { AISceneHeader } from '@/components/AISceneHeader'
import { AIRecommendationDetail } from '@/components/AIRecommendationDetail'
import {
  getAISceneDetail,
  getRecommendationDetail,
} from '@/lib/ai/analyticsStore'

const VALID_SCENES = ['today_plan', 'rescue', 'review', 'weekly_insight'] as const

type SceneAnalyticsDict = {
  aiAnalyticsTitle: string
  aiAnalyticsScene: string
  aiAnalyticsStrategy: string
  aiAnalyticsModel: string
  aiAnalyticsRecent: string
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
  aiAnalyticsTotal: string
  aiAnalyticsAdoptionRate: string
  aiAnalyticsCompletionRate: string
  aiAnalyticsFallbackRate: string
  aiAnalyticsBackToOverview: string
  aiAnalyticsOpenDetail: string
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

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatStatus(value: {
  completed: boolean | null
  adopted: boolean | null
  status: string
  feedback_label: string | null
  fallback_used: boolean
}, dict: SceneAnalyticsDict) {
  if (value.completed) return dict.aiAnalyticsStatusCompleted
  if (value.adopted) return dict.aiAnalyticsStatusAdopted
  if (value.status === 'dismissed' || value.feedback_label === 'dismiss' || value.feedback_label === 'close_result') {
    return dict.aiAnalyticsStatusDismissed
  }
  if (value.fallback_used) return dict.aiAnalyticsStatusFallback
  return dict.aiAnalyticsStatusGenerated
}

export default async function AISceneInsightsPage(props: {
  params: Promise<{ scene: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { scene } = await props.params
  if (!VALID_SCENES.includes(scene as typeof VALID_SCENES[number])) {
    notFound()
  }

  const supabase = await createClient()
  const dict = await getDictionary()
  const currentLocale = await getCurrentLocale()
  const searchParams = await props.searchParams
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profileDict = dict.profile as unknown as SceneAnalyticsDict
  const rangeParam = Array.isArray(searchParams?.range) ? searchParams?.range[0] : searchParams?.range
  const detailId = Array.isArray(searchParams?.rid) ? searchParams?.rid[0] : searchParams?.rid
  const days =
    rangeParam === '7' ? 7
    : rangeParam === '30' ? 30
    : rangeParam === '90' ? 90
    : undefined

  const sceneDetail = await getAISceneDetail({
    supabase,
    userId: user.id,
    scene,
    days,
  })

  const selectedId = detailId || sceneDetail.recentRecommendations[0]?.recommendation_id
  const recommendationDetail = selectedId
    ? await getRecommendationDetail({ supabase, userId: user.id, recommendationId: selectedId })
    : null
  const locale = currentLocale === 'zh' ? 'zh-CN' : 'en-US'

  const buildSceneHref = (rid?: string) => {
    const params = new URLSearchParams()
    if (days) params.set('range', String(days))
    if (rid) params.set('rid', rid)
    const query = params.toString()
    return `/profile/ai-insights/${scene}${query ? `?${query}` : ''}`
  }

  return (
    <div className="space-y-6">
      <AISceneHeader
        scene={scene}
        locale={currentLocale}
        days={days}
        dict={profileDict}
      />

      <AIAnalyticsOverview dict={profileDict} metrics={[sceneDetail.summary]} />

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: profileDict.aiAnalyticsRangeAll, href: buildSceneHref() },
          { key: '7', label: profileDict.aiAnalyticsRange7, href: `/profile/ai-insights/${scene}?range=7` },
          { key: '30', label: profileDict.aiAnalyticsRange30, href: `/profile/ai-insights/${scene}?range=30` },
          { key: '90', label: profileDict.aiAnalyticsRange90, href: `/profile/ai-insights/${scene}?range=90` },
        ].map(option => {
          const active = (option.key === 'all' && !days) || String(days || '') === option.key
          return (
            <Button key={option.key} asChild variant={active ? 'default' : 'outline'} size="sm" className="rounded-full">
              <Link href={option.href}>{option.label}</Link>
            </Button>
          )
        })}
      </div>

      <AIAnalyticsTable
        title={profileDict.aiAnalyticsStrategy}
        columns={[
          profileDict.aiAnalyticsColumnStrategy,
          profileDict.aiAnalyticsColumnPrompt,
          profileDict.aiAnalyticsColumnRecommendations,
          profileDict.aiAnalyticsColumnAdoptionRate,
          profileDict.aiAnalyticsColumnCompletionRate,
        ]}
        rows={formatMetricRows(sceneDetail.strategyMetrics, row => [
          <div className="font-medium">{row.strategy_version || '-'}</div>,
          row.prompt_version || '-',
          String(row.recommendation_count),
          formatPercent(row.adoption_rate),
          formatPercent(row.completion_rate),
        ])}
      />

      <AIAnalyticsTable
        title={profileDict.aiAnalyticsModel}
        columns={[
          profileDict.aiAnalyticsColumnModel,
          profileDict.aiAnalyticsColumnRecommendations,
          profileDict.aiAnalyticsColumnAdoptionRate,
          profileDict.aiAnalyticsColumnCompletionRate,
          profileDict.aiAnalyticsColumnConfidence,
        ]}
        rows={formatMetricRows(sceneDetail.modelMetrics, row => [
          <div className="font-medium">{row.model || '-'}</div>,
          String(row.recommendation_count),
          formatPercent(row.adoption_rate),
          formatPercent(row.completion_rate),
          row.avg_confidence_score == null ? '-' : String(row.avg_confidence_score),
        ])}
      />

      <AIAnalyticsTable
        title={profileDict.aiAnalyticsRecent}
        columns={[
          profileDict.aiAnalyticsColumnStrategy,
          profileDict.aiAnalyticsColumnModel,
          profileDict.aiAnalyticsColumnStatus,
          profileDict.aiAnalyticsColumnOption,
          profileDict.aiAnalyticsColumnCreatedAt,
          profileDict.aiAnalyticsOpenDetail,
        ]}
        rows={formatRecentRows(sceneDetail.recentRecommendations, row => [
          <div className="font-medium">{row.strategy_version || '-'}</div>,
          row.model || '-',
          formatStatus(row, profileDict),
          row.option_selected || row.feedback_label || '-',
          row.created_at ? new Date(row.created_at).toLocaleString(locale) : '-',
          <Button asChild size="sm" variant={row.recommendation_id === selectedId ? 'secondary' : 'outline'} className="rounded-full">
            <Link href={buildSceneHref(row.recommendation_id)}>{profileDict.aiAnalyticsOpenDetail}</Link>
          </Button>,
        ])}
      />

      <AIRecommendationDetail
        detail={recommendationDetail}
        dict={profileDict}
        locale={locale}
      />
    </div>
  )
}
