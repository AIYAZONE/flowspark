import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getCurrentLocale, getDictionary } from '@/i18n/get-dictionary'
import { AIAnalyticsOverview } from '@/components/AIAnalyticsOverview'
import { AIAnalyticsFrictionTop } from '@/components/AIAnalyticsFrictionTop'
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
import {
  formatAIConfidenceLabel,
  formatAIModelLabel,
  formatAIOptionLabel,
  formatAIStrategyLabel,
  formatAIStatusLabel,
  formatAIPromptLabel,
  getAIFieldHelpText,
} from '@/lib/ai/analyticsPresentation'

const VALID_SCENES = ['today_plan', 'rescue', 'review', 'weekly_insight'] as const

type SceneAnalyticsDict = {
  aiAnalyticsTitle: string
  aiAnalyticsScenePurposeTitle: string
  aiAnalyticsScenePurposePoint1: string
  aiAnalyticsScenePurposePoint2: string
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
  aiAnalyticsDetailStrategySummary: string
  aiAnalyticsDetailQualityLabels: string
  aiAnalyticsDetailMoreTitle: string
  aiAnalyticsDetailMoreDesc: string
  aiAnalyticsDetailBackToList: string
  aiAnalyticsDetailSignalsTitle: string
  aiAnalyticsDetailGenerationTitle: string
  aiAnalyticsDetailWhyTitle: string
  aiAnalyticsDetailVariantsTitle: string
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
  aiAnalyticsStatusGenerated: string
  aiAnalyticsStatusAdopted: string
  aiAnalyticsStatusCompleted: string
  aiAnalyticsStatusDismissed: string
  aiAnalyticsStatusFallback: string
  aiAnalyticsTechnicalTitle: string
  aiAnalyticsTechnicalDesc: string
  aiAnalyticsFrictionTitle: string
  aiAnalyticsFrictionTitleScene: string
  aiAnalyticsFrictionDesc: string
  aiAnalyticsFrictionEmpty: string
  aiAnalyticsFrictionSuggestionNoTime: string
  aiAnalyticsFrictionSuggestionTooHard: string
  aiAnalyticsFrictionSuggestionNotFit: string
  aiAnalyticsFrictionSuggestionAlreadyPlanned: string
  aiAnalyticsFrictionSuggestionOther: string
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function buildSceneAdjustmentNote(
  recent: Array<{ option_selected: string | null; feedback_label: string | null }>,
  locale: 'zh' | 'en'
) {
  const slice = recent.slice(0, 12)
  const short = slice.filter(item => item.option_selected === '5m' || item.option_selected === '10m').length
  const long = slice.filter(item => item.option_selected === '20m').length
  const reasons = new Map<string, number>()
  for (const item of slice) {
    let label = item.feedback_label || ''
    if (!label) continue
    if (label === 'dismiss' || label === 'close_result') continue
    if (label === 'useful') continue
    if (label.startsWith('not_fit')) label = 'not_fit'
    reasons.set(label, (reasons.get(label) || 0) + 1)
  }
  let topReason: string | null = null
  for (const [key, count] of reasons.entries()) {
    if (!topReason || count > (reasons.get(topReason) || 0)) topReason = key
  }
  const hasSignal = short + long >= 3 || topReason != null
  if (!hasSignal) return null

  if (topReason === 'no_time') {
    return locale === 'zh'
      ? '系统会更倾向提供更低摩擦的起步版本（因为你最近更常反馈“没时间”）。'
      : 'The system will lean toward lower-friction starter options (since “no time” is common lately).'
  }
  if (topReason === 'not_fit') {
    return locale === 'zh'
      ? '系统会更强依赖你的目标与现有行动来生成建议（因为你最近更常反馈“不贴合”）。'
      : 'The system will rely more on your goals and existing actions (since “not a fit” is common lately).'
  }
  if (short >= long * 2) {
    return locale === 'zh'
      ? '系统会优先给更容易开始的建议（因为你最近更常选择 5/10 分钟版本）。'
      : 'The system will prefer easier-to-start suggestions (since you often choose 5/10-minute options).'
  }
  return locale === 'zh'
    ? '系统会根据你的采纳与反馈逐步调整后续建议，让它越来越贴合你。'
    : 'The system will gradually adapt based on your adoption and feedback so suggestions fit you better.'
}

function formatStatus(value: {
  completed: boolean | null
  adopted: boolean | null
  status: string
  feedback_label: string | null
  fallback_used: boolean
}, dict: SceneAnalyticsDict) {
  return formatAIStatusLabel({
    completed: value.completed,
    adopted: value.adopted,
    status: value.status,
    feedbackLabel: value.feedback_label,
    fallbackUsed: value.fallback_used,
  }, dict.aiAnalyticsStatusGenerated === '已生成' ? 'zh' : 'en')
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
  const isDetailMode = Boolean(detailId)

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
  const presentationLocale = currentLocale === 'zh' ? 'zh' : 'en'
  const adjustmentNote = buildSceneAdjustmentNote(sceneDetail.recentRecommendations, presentationLocale)

  const buildSceneHref = (rid?: string) => {
    const params = new URLSearchParams()
    if (days) params.set('range', String(days))
    if (rid) params.set('rid', rid)
    const query = params.toString()
    return `/profile/ai-insights/${scene}${query ? `?${query}` : ''}${rid ? '#detail' : ''}`
  }

  return (
    <div className="space-y-6">
      <AISceneHeader
        scene={scene}
        locale={currentLocale}
        days={days}
        dict={profileDict}
      />

      {isDetailMode ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={buildSceneHref()}>{profileDict.aiAnalyticsDetailBackToList}</Link>
            </Button>
          </div>

          <AIRecommendationDetail
            key={recommendationDetail?.recommendation_id || 'empty'}
            detail={recommendationDetail}
            dict={profileDict}
            locale={locale}
          />

          <details className="rounded-2xl border bg-card p-5">
            <summary className="cursor-pointer list-none">
              <div className="space-y-1">
                <div className="text-sm font-semibold">{profileDict.aiAnalyticsDetailMoreTitle}</div>
                <div className="text-sm text-muted-foreground">{profileDict.aiAnalyticsDetailMoreDesc}</div>
              </div>
            </summary>
            <div className="mt-5 space-y-6">
              <AIAnalyticsOverview dict={profileDict} metrics={[sceneDetail.summary]} />

              <div className="rounded-2xl border bg-card p-5">
                <div className="text-sm font-semibold">{profileDict.aiAnalyticsScenePurposeTitle}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>{profileDict.aiAnalyticsScenePurposePoint1}</li>
                  <li>{profileDict.aiAnalyticsScenePurposePoint2}</li>
                </ul>
                {adjustmentNote ? (
                  <div className="mt-3 text-sm leading-6 text-muted-foreground">{adjustmentNote}</div>
                ) : null}
              </div>

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

              <AIAnalyticsFrictionTop
                dict={profileDict}
                locale={presentationLocale}
                recent={sceneDetail.recentRecommendations}
                scope="scene"
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
                  <div key="strategy" className="space-y-1">
                    <div className="font-medium">{formatAIStrategyLabel(scene, row.strategy_version, presentationLocale)}</div>
                    <div className="text-xs text-muted-foreground">{row.strategy_version || '-'}</div>
                  </div>,
                  <div key="model" className="space-y-1">
                    <div className="font-medium">{formatAIModelLabel(row.model, presentationLocale)}</div>
                    <div className="text-xs text-muted-foreground">{row.model || '-'}</div>
                  </div>,
                  formatStatus(row, profileDict),
                  formatAIOptionLabel(row.option_selected || row.feedback_label, presentationLocale),
                  row.created_at ? new Date(row.created_at).toLocaleString(locale) : '-',
                  <Button key="detail" asChild size="sm" variant={row.recommendation_id === selectedId ? 'secondary' : 'outline'} className="rounded-full">
                    <Link href={buildSceneHref(row.recommendation_id)}>{profileDict.aiAnalyticsOpenDetail}</Link>
                  </Button>,
                ])}
              />

              <details className="rounded-2xl border bg-card p-5">
                <summary className="cursor-pointer list-none">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">
                      {profileDict.aiAnalyticsTechnicalTitle || (presentationLocale === 'zh' ? '技术参考（可折叠）' : 'Technical reference (collapsible)')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {profileDict.aiAnalyticsTechnicalDesc || getAIFieldHelpText('technical', presentationLocale)}
                    </div>
                  </div>
                </summary>
                <div className="mt-5 space-y-6">
                  <AIAnalyticsTable
                    title={profileDict.aiAnalyticsStrategy}
                    description={getAIFieldHelpText('strategy', presentationLocale)}
                    columns={[
                      profileDict.aiAnalyticsColumnStrategy,
                      profileDict.aiAnalyticsColumnPrompt,
                      profileDict.aiAnalyticsColumnRecommendations,
                      profileDict.aiAnalyticsColumnAdoptionRate,
                      profileDict.aiAnalyticsColumnCompletionRate,
                    ]}
                    rows={formatMetricRows(sceneDetail.strategyMetrics, row => [
                      <div key="strategy" className="space-y-1">
                        <div className="font-medium">{formatAIStrategyLabel(scene, row.strategy_version, presentationLocale)}</div>
                        <div className="text-xs text-muted-foreground">{row.strategy_version || '-'}</div>
                      </div>,
                      <div key="prompt" className="space-y-1">
                        <div className="font-medium">{formatAIPromptLabel(scene, row.prompt_version, presentationLocale)}</div>
                        <div className="text-xs text-muted-foreground">{row.prompt_version || '-'}</div>
                      </div>,
                      String(row.recommendation_count),
                      formatPercent(row.adoption_rate),
                      formatPercent(row.completion_rate),
                    ])}
                  />

                  <AIAnalyticsTable
                    title={profileDict.aiAnalyticsModel}
                    description={getAIFieldHelpText('model', presentationLocale)}
                    columns={[
                      profileDict.aiAnalyticsColumnModel,
                      profileDict.aiAnalyticsColumnRecommendations,
                      profileDict.aiAnalyticsColumnAdoptionRate,
                      profileDict.aiAnalyticsColumnCompletionRate,
                      profileDict.aiAnalyticsColumnConfidence,
                    ]}
                    rows={formatMetricRows(sceneDetail.modelMetrics, row => [
                      <div key="model" className="space-y-1">
                        <div className="font-medium">{formatAIModelLabel(row.model, presentationLocale)}</div>
                        <div className="text-xs text-muted-foreground">{row.model || '-'}</div>
                      </div>,
                      String(row.recommendation_count),
                      formatPercent(row.adoption_rate),
                      formatPercent(row.completion_rate),
                      row.avg_confidence_score == null
                        ? '-'
                        : formatAIConfidenceLabel(
                            row.avg_confidence_score >= 2.5 ? 'high' : row.avg_confidence_score >= 1.5 ? 'medium' : 'low',
                            presentationLocale
                          ),
                    ])}
                  />
                </div>
              </details>
            </div>
          </details>
        </>
      ) : (
        <>
          <AIAnalyticsOverview dict={profileDict} metrics={[sceneDetail.summary]} />

          <div className="rounded-2xl border bg-card p-5">
            <div className="text-sm font-semibold">{profileDict.aiAnalyticsScenePurposeTitle}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
              <li>{profileDict.aiAnalyticsScenePurposePoint1}</li>
              <li>{profileDict.aiAnalyticsScenePurposePoint2}</li>
            </ul>
            {adjustmentNote ? (
              <div className="mt-3 text-sm leading-6 text-muted-foreground">{adjustmentNote}</div>
            ) : null}
          </div>

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

          <AIAnalyticsFrictionTop
            dict={profileDict}
            locale={presentationLocale}
            recent={sceneDetail.recentRecommendations}
            scope="scene"
          />

          <AIRecommendationDetail
            key={recommendationDetail?.recommendation_id || 'empty'}
            detail={recommendationDetail}
            dict={profileDict}
            locale={locale}
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
              <div key="strategy" className="space-y-1">
                <div className="font-medium">{formatAIStrategyLabel(scene, row.strategy_version, presentationLocale)}</div>
                <div className="text-xs text-muted-foreground">{row.strategy_version || '-'}</div>
              </div>,
              <div key="model" className="space-y-1">
                <div className="font-medium">{formatAIModelLabel(row.model, presentationLocale)}</div>
                <div className="text-xs text-muted-foreground">{row.model || '-'}</div>
              </div>,
              formatStatus(row, profileDict),
              formatAIOptionLabel(row.option_selected || row.feedback_label, presentationLocale),
              row.created_at ? new Date(row.created_at).toLocaleString(locale) : '-',
              <Button key="detail" asChild size="sm" variant={row.recommendation_id === selectedId ? 'secondary' : 'outline'} className="rounded-full">
                <Link href={buildSceneHref(row.recommendation_id)}>{profileDict.aiAnalyticsOpenDetail}</Link>
              </Button>,
            ])}
          />

          <details className="rounded-2xl border bg-card p-5">
            <summary className="cursor-pointer list-none">
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {profileDict.aiAnalyticsTechnicalTitle || (presentationLocale === 'zh' ? '技术参考（可折叠）' : 'Technical reference (collapsible)')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {profileDict.aiAnalyticsTechnicalDesc || getAIFieldHelpText('technical', presentationLocale)}
                </div>
              </div>
            </summary>
            <div className="mt-5 space-y-6">
              <AIAnalyticsTable
                title={profileDict.aiAnalyticsStrategy}
                description={getAIFieldHelpText('strategy', presentationLocale)}
                columns={[
                  profileDict.aiAnalyticsColumnStrategy,
                  profileDict.aiAnalyticsColumnPrompt,
                  profileDict.aiAnalyticsColumnRecommendations,
                  profileDict.aiAnalyticsColumnAdoptionRate,
                  profileDict.aiAnalyticsColumnCompletionRate,
                ]}
                rows={formatMetricRows(sceneDetail.strategyMetrics, row => [
                  <div key="strategy" className="space-y-1">
                    <div className="font-medium">{formatAIStrategyLabel(scene, row.strategy_version, presentationLocale)}</div>
                    <div className="text-xs text-muted-foreground">{row.strategy_version || '-'}</div>
                  </div>,
                  <div key="prompt" className="space-y-1">
                    <div className="font-medium">{formatAIPromptLabel(scene, row.prompt_version, presentationLocale)}</div>
                    <div className="text-xs text-muted-foreground">{row.prompt_version || '-'}</div>
                  </div>,
                  String(row.recommendation_count),
                  formatPercent(row.adoption_rate),
                  formatPercent(row.completion_rate),
                ])}
              />

              <AIAnalyticsTable
                title={profileDict.aiAnalyticsModel}
                description={getAIFieldHelpText('model', presentationLocale)}
                columns={[
                  profileDict.aiAnalyticsColumnModel,
                  profileDict.aiAnalyticsColumnRecommendations,
                  profileDict.aiAnalyticsColumnAdoptionRate,
                  profileDict.aiAnalyticsColumnCompletionRate,
                  profileDict.aiAnalyticsColumnConfidence,
                ]}
                rows={formatMetricRows(sceneDetail.modelMetrics, row => [
                  <div key="model" className="space-y-1">
                    <div className="font-medium">{formatAIModelLabel(row.model, presentationLocale)}</div>
                    <div className="text-xs text-muted-foreground">{row.model || '-'}</div>
                  </div>,
                  String(row.recommendation_count),
                  formatPercent(row.adoption_rate),
                  formatPercent(row.completion_rate),
                  row.avg_confidence_score == null
                    ? '-'
                    : formatAIConfidenceLabel(
                        row.avg_confidence_score >= 2.5 ? 'high' : row.avg_confidence_score >= 1.5 ? 'medium' : 'low',
                        presentationLocale
                      ),
                ])}
              />
            </div>
          </details>
        </>
      )}
    </div>
  )
}
