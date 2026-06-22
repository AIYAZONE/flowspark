import { createClient } from '@/lib/supabase/server'
import { getCurrentLocale, getDictionary } from '@/i18n/get-dictionary'
import Link from 'next/link'
import { ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIAnalyticsOverview } from '@/components/AIAnalyticsOverview'
import { AIAnalyticsFrictionTop } from '@/components/AIAnalyticsFrictionTop'
import { AIFunnelOverview } from '@/components/AIFunnelOverview'
import {
  AIAnalyticsTable,
  formatMetricRows,
  formatRecentRows,
} from '@/components/AIAnalyticsTable'
import {
  getAIFunnelBreakdown,
  getAIFunnelOverview,
  getAIModelMetrics,
  getAISceneMetrics,
  getAIStrategyMetrics,
  getRecentRecommendations,
} from '@/lib/ai/analyticsStore'
import {
  formatAIConfidenceLabel,
  formatAIModelLabel,
  formatAIOptionLabel,
  formatAISceneDescription,
  formatAISceneLabel,
  formatAIStrategyLabel,
  formatAIPromptLabel,
  getAIFieldHelpText,
} from '@/lib/ai/analyticsPresentation'
import { cn } from '@/lib/utils'
import { getUserTimezone, getTodayInTZ } from '@/lib/time'
import { getStreakSnapshot } from '@/lib/streaks'
import { buildContinuityInsightCopy } from '@/lib/continuity-insight'
import { ProfileSubPageHeader } from '@/components/profile/ProfileSubPageHeader'
import { buildSelfModelCards, summarizeRecommendationSignals } from '@/lib/self-model'

type AIAnalyticsDict = {
  aiAnalyticsTitle: string
  aiAnalyticsDesc: string
  aiAnalyticsPurposeTitle: string
  aiAnalyticsPurposePoint1: string
  aiAnalyticsPurposePoint2: string
  aiAnalyticsPurposePoint3: string
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
  aiAnalyticsSceneDesc: string
  aiAnalyticsRecentDesc: string
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
  aiFunnelTitle: string
  aiFunnelDesc: string
  aiFunnelEmpty: string
  aiFunnelPageViewDays: string
  aiFunnelPageViewDaysHelp: string
  aiFunnelPlanExposureRate: string
  aiFunnelPlanExposureRateHelp: string
  aiFunnelPlanApplyRate: string
  aiFunnelPlanApplyRateHelp: string
  aiFunnelNextDayReturnRate: string
  aiFunnelNextDayReturnRateHelp: string
  aiFunnelReviewExposed: string
  aiFunnelReviewExposedHelp: string
  aiFunnelRescueClicks: string
  aiFunnelRescueClicksHelp: string
  aiFunnelCoreActionSet: string
  aiFunnelCoreActionSetHelp: string
  aiFunnelCoreActionCompletionRate: string
  aiFunnelCoreActionCompletionRateHelp: string
  aiFunnelBreakdownTitle: string
  aiFunnelBreakdownDesc: string
  aiFunnelColumnSource: string
  aiFunnelColumnVariant: string
  aiFunnelColumnPlanExposedDays: string
  aiFunnelColumnPlanApplyDays: string
  aiFunnelColumnReviewExposedDays: string
  aiFunnelColumnRescueClickDays: string
  aiFunnelColumnCoreActionSetDays: string
  aiFunnelColumnCoreActionCompletedDays: string
  aiFunnelColumnReturnedNextDayDays: string
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function subtractDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function buildAdjustmentNote(
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
      ? '系统已观察到你最近“没时间”的情况较多，后续会更偏向提供更低摩擦的起步版本。'
      : 'The system noticed “no time” is a common reason lately, so it will lean toward lower-friction starter options.'
  }
  if (topReason === 'not_fit') {
    return locale === 'zh'
      ? '系统已观察到“建议不贴合”的反馈较多，后续会更强依赖你的目标与现有行动来生成建议。'
      : 'The system noticed “not a fit” feedback is common, so it will rely more on your goals and existing actions.'
  }
  if (short >= long * 2) {
    return locale === 'zh'
      ? '系统已观察到你更常选择 5/10 分钟版本，后续会优先给更容易开始的建议。'
      : 'The system noticed you often choose 5/10-minute options, so it will prefer easier-to-start suggestions.'
  }
  return locale === 'zh'
    ? '系统会根据你的采纳与反馈逐步调整后续建议，让它越来越贴合你。'
    : 'The system will gradually adapt based on your adoption and feedback so suggestions fit you better.'
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

  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  const since30 = subtractDays(today, 30)

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

  const [
    sceneMetrics,
    strategyMetrics,
    modelMetrics,
    recentRecommendations,
    streakSnapshot,
    streakRepairCount30,
    funnelOverview,
    funnelBreakdown,
  ] = await Promise.all([
    getAISceneMetrics({ supabase, userId: user.id, options: { days } }),
    getAIStrategyMetrics({ supabase, userId: user.id, options: { days } }),
    getAIModelMetrics({ supabase, userId: user.id, options: { days } }),
    getRecentRecommendations({ supabase, userId: user.id, limit: 80, days }),
    getStreakSnapshot({ supabase, userId: user.id, timeZone: tz, today }),
    supabase
      .from('streak_repairs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('target_date', since30)
      .then(r => r.count ?? 0),
    getAIFunnelOverview({ supabase, userId: user.id, options: { days } }),
    getAIFunnelBreakdown({ supabase, userId: user.id, options: { days } }),
  ])

  const profileDict = dict.profile as unknown as AIAnalyticsDict
  const locale = currentLocale === 'zh' ? 'zh-CN' : 'en-US'
  const presentationLocale = currentLocale === 'zh' ? 'zh' : 'en'
  const sortedSceneMetrics = sortMetricRows(sceneMetrics, sort)
  const sortedStrategyMetrics = sortMetricRows(strategyMetrics, sort)
  const sortedModelMetrics = sortMetricRows(modelMetrics, sort)
  const hasFunnelData = funnelOverview.page_view_days > 0 || funnelBreakdown.length > 0
  const hasRecommendationData = sceneMetrics.length > 0 || recentRecommendations.length > 0
  const adjustmentNote = buildAdjustmentNote(recentRecommendations, presentationLocale)
  const recommendationSignals = summarizeRecommendationSignals(recentRecommendations)
  const selfModelCards = buildSelfModelCards({
    locale: presentationLocale,
    currentStreak: streakSnapshot.currentStreak,
    completedToday: streakSnapshot.completedToday,
    signals: recommendationSignals,
  })
  const optionRows = recentRecommendations.filter(r => Boolean(r.option_selected))
  const shortOptionCount = optionRows.filter(r => r.option_selected === '5m' || r.option_selected === '10m').length
  const shortOptionShare = optionRows.length > 0 ? shortOptionCount / optionRows.length : null
  const continuityCopy = buildContinuityInsightCopy({
    locale: presentationLocale,
    currentStreak: streakSnapshot.currentStreak,
    shieldBalance: streakSnapshot.shieldBalance,
    repairCount30: streakRepairCount30,
    shortOptionShare,
  })
  const recentRowsForTable = recentRecommendations.slice(0, 20)
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

  function primaryWithRaw(key: string, primary: string, raw?: string | null, muted = true) {
    return (
      <div key={key} className="space-y-1">
        <div className="font-medium">{primary}</div>
        {raw && raw !== primary ? (
          <div className={muted ? 'text-xs text-muted-foreground' : 'text-xs'}>{raw}</div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProfileSubPageHeader
        title={profileDict.aiAnalyticsTitle}
        description={profileDict.aiAnalyticsDesc}
        backHref="/profile"
        backLabel={dict.common.back}
        breadcrumbs={[{ label: dict.profile.title, href: '/profile' }]}
        icon={<Sparkles className="h-4 w-4" />}
      />

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium">{continuityCopy.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{continuityCopy.summary}</div>
            <div className="mt-2 text-sm">{continuityCopy.advice}</div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1">
              {presentationLocale === 'zh' ? `连续 ${streakSnapshot.currentStreak} 天` : `${streakSnapshot.currentStreak}-day streak`}
            </span>
            <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1">
              {presentationLocale === 'zh' ? `护盾 ${streakSnapshot.shieldBalance}` : `Shields ${streakSnapshot.shieldBalance}`}
            </span>
            <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1">
              {presentationLocale === 'zh' ? `近 30 天恢复 ${streakRepairCount30}` : `${streakRepairCount30} recoveries (30d)`}
            </span>
          </div>
        </div>
      </div>

      <div id="system-read-explained" className="rounded-3xl border border-primary/12 bg-linear-to-br from-primary/6 via-card to-card p-5 scroll-mt-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
              {presentationLocale === 'zh' ? 'System Read Explained' : 'System Read Explained'}
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight">
              {presentationLocale === 'zh' ? '系统如何理解你，以及这种理解怎样进入今天的判断。' : 'How the system reads you, and how that read enters today’s judgment.'}
            </div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {presentationLocale === 'zh'
                ? '这里把 You 页的当前判断拆成“依据”与“对 Today 的影响”，避免它只是好看的描述卡片。'
                : 'This breaks the current read from You into evidence and Today impact so it is not just decorative copy.'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/profile#current-system-read">
                {presentationLocale === 'zh' ? '回到当前理解' : 'Back to current read'}
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/today#today-system-read">
                {presentationLocale === 'zh' ? '看今天如何执行' : 'See how Today applies it'}
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {selfModelCards.map(card => (
            <div key={card.key} className="rounded-2xl border border-border/50 bg-background/85 p-4 shadow-sm">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                {card.label}
              </div>
              <div className="mt-3 text-base font-semibold leading-7">{card.title}</div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</div>
              <div className="mt-4 rounded-2xl border border-border/50 bg-card/90 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {presentationLocale === 'zh' ? 'Why The System Thinks This' : 'Why The System Thinks This'}
                </div>
                <div className="mt-2 text-sm leading-6 text-foreground/90">{card.evidence}</div>
              </div>
              <div className="mt-3 rounded-2xl border border-primary/12 bg-primary/5 p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                  {presentationLocale === 'zh' ? 'How Today Changes' : 'How Today Changes'}
                </div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{card.todayEffect}</div>
              </div>
            </div>
          ))}
        </div>
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

      <div className="rounded-2xl border bg-card p-5">
        <div className="text-sm font-semibold">{profileDict.aiAnalyticsPurposeTitle}</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
          <li>{profileDict.aiAnalyticsPurposePoint1}</li>
          <li>{profileDict.aiAnalyticsPurposePoint2}</li>
          <li>{profileDict.aiAnalyticsPurposePoint3}</li>
        </ul>
        {adjustmentNote ? (
          <div className="mt-3 text-sm leading-6 text-muted-foreground">{adjustmentNote}</div>
        ) : null}
      </div>

      {!hasRecommendationData && !hasFunnelData ? (
        <div className="rounded-xl border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">
          {profileDict.aiAnalyticsEmpty}
        </div>
      ) : (
        <>
          {hasFunnelData ? (
            <>
              <div className="space-y-2">
                <div className="text-base font-semibold">{profileDict.aiFunnelTitle}</div>
                <div className="text-sm text-muted-foreground">{profileDict.aiFunnelDesc}</div>
              </div>
              <AIFunnelOverview dict={profileDict} overview={funnelOverview} />
              {funnelBreakdown.length > 0 ? (
                <AIAnalyticsTable
                  title={profileDict.aiFunnelBreakdownTitle}
                  description={profileDict.aiFunnelBreakdownDesc}
                  columns={[
                    profileDict.aiFunnelColumnSource,
                    profileDict.aiAnalyticsColumnScene,
                    profileDict.aiFunnelColumnVariant,
                    profileDict.aiFunnelColumnPlanExposedDays,
                    profileDict.aiFunnelColumnPlanApplyDays,
                    profileDict.aiFunnelColumnReviewExposedDays,
                    profileDict.aiFunnelColumnRescueClickDays,
                    profileDict.aiFunnelColumnCoreActionSetDays,
                    profileDict.aiFunnelColumnCoreActionCompletedDays,
                    profileDict.aiFunnelColumnReturnedNextDayDays,
                  ]}
                  rows={funnelBreakdown.map(row => [
                    row.source,
                    formatAISceneLabel(row.scene, presentationLocale),
                    row.variant,
                    String(row.today_plan_exposed_user_days),
                    String(row.today_plan_apply_user_days),
                    String(row.review_exposed_user_days),
                    String(row.rescue_click_user_days),
                    String(row.core_action_set_user_days),
                    String(row.core_action_completed_user_days),
                    String(row.returned_next_day_user_days),
                  ])}
                />
              ) : (
                <div className="rounded-xl border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">
                  {profileDict.aiFunnelEmpty}
                </div>
              )}
            </>
          ) : null}

          {hasRecommendationData ? (
            <>
          <AIAnalyticsFrictionTop
            dict={profileDict}
            locale={presentationLocale}
            recent={recentRecommendations}
            scope="global"
          />

          <AIAnalyticsOverview dict={profileDict} metrics={sortedSceneMetrics} />

          <AIAnalyticsTable
            title={profileDict.aiAnalyticsScene}
            description={profileDict.aiAnalyticsSceneDesc || getAIFieldHelpText('metrics', presentationLocale)}
            columns={[
              profileDict.aiAnalyticsColumnScene,
              profileDict.aiAnalyticsColumnRecommendations,
              profileDict.aiAnalyticsColumnAdoptionRate,
              profileDict.aiAnalyticsColumnCompletionRate,
              profileDict.aiAnalyticsColumnFallbackRate,
            ]}
            rows={formatMetricRows(sortedSceneMetrics, row => [
              row.scene ? (
                <Link key="scene" className="font-medium text-primary hover:underline" href={`/profile/ai-insights/${row.scene}${days ? `?range=${days}` : ''}`}>
                  {formatAISceneLabel(row.scene, presentationLocale)}
                </Link>
              ) : '-',
              String(row.recommendation_count),
              <span key="adoption" className="font-medium">{formatPercent(row.adoption_rate)}</span>,
              <span key="completion" className="font-medium">{formatPercent(row.completion_rate)}</span>,
              <span key="fallback" className="font-medium">{formatPercent(row.fallback_rate)}</span>,
            ])}
          />

          <AIAnalyticsTable
            title={profileDict.aiAnalyticsRecent}
            description={profileDict.aiAnalyticsRecentDesc || getAIFieldHelpText('metrics', presentationLocale)}
            columns={[
              profileDict.aiAnalyticsColumnScene,
              profileDict.aiAnalyticsColumnStatus,
              profileDict.aiAnalyticsColumnOption,
              profileDict.aiAnalyticsColumnCreatedAt,
              profileDict.aiAnalyticsOpenDetail,
            ]}
            rows={formatRecentRows(recentRowsForTable, row => [
              <div key="scene" className="space-y-1">
                <div className="font-medium">{formatAISceneLabel(row.scene, presentationLocale)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatAISceneDescription(row.scene, presentationLocale) || row.scene}
                </div>
              </div>,
              row.completed
                ? statusBadge(profileDict.aiAnalyticsStatusCompleted, 'green')
                : row.adopted
                  ? statusBadge(profileDict.aiAnalyticsStatusAdopted, 'default')
                  : row.status === 'dismissed' || row.feedback_label === 'dismiss' || row.feedback_label === 'close_result'
                    ? statusBadge(profileDict.aiAnalyticsStatusDismissed, 'gray')
                    : row.fallback_used
                      ? statusBadge(profileDict.aiAnalyticsStatusFallback, 'amber')
                      : statusBadge(profileDict.aiAnalyticsStatusGenerated, 'default'),
              formatAIOptionLabel(row.option_selected || row.feedback_label, presentationLocale),
              row.created_at
                ? new Date(row.created_at).toLocaleString(locale)
                : '-',
              <Button key="detail" asChild size="sm" variant="outline" className="rounded-full">
                <Link href={`/profile/ai-insights/${row.scene}${days ? `?range=${days}&rid=${row.recommendation_id}` : `?rid=${row.recommendation_id}`}#detail`}>
                  {profileDict.aiAnalyticsOpenDetail}
                </Link>
              </Button>,
            ])}
          />

          <details className="rounded-2xl border bg-card p-5">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">
                    {profileDict.aiAnalyticsTechnicalTitle || (presentationLocale === 'zh' ? '技术参考（可折叠）' : 'Technical reference (collapsible)')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {profileDict.aiAnalyticsTechnicalDesc || getAIFieldHelpText('technical', presentationLocale)}
                  </div>
                </div>
                <ChevronDown className="ai-details-chevron mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
              </div>
            </summary>
            <div className="mt-5 space-y-6">
              <AIAnalyticsTable
                title={profileDict.aiAnalyticsStrategy}
                description={getAIFieldHelpText('strategy', presentationLocale)}
                columns={[
                  profileDict.aiAnalyticsColumnScene,
                  profileDict.aiAnalyticsColumnStrategy,
                  profileDict.aiAnalyticsColumnPrompt,
                  profileDict.aiAnalyticsColumnRecommendations,
                  profileDict.aiAnalyticsColumnAdoptionRate,
                  profileDict.aiAnalyticsColumnCompletionRate,
                ]}
                rows={formatMetricRows(sortedStrategyMetrics, row => [
                  primaryWithRaw('scene', formatAISceneLabel(row.scene, presentationLocale), row.scene),
                  primaryWithRaw(
                    'strategy',
                    formatAIStrategyLabel(row.scene, row.strategy_version, presentationLocale),
                    row.strategy_version
                  ),
                  primaryWithRaw(
                    'prompt',
                    formatAIPromptLabel(row.scene, row.prompt_version, presentationLocale),
                    row.prompt_version
                  ),
                  String(row.recommendation_count),
                  <span key="adoption" className="font-medium">{formatPercent(row.adoption_rate)}</span>,
                  <span key="completion" className="font-medium">{formatPercent(row.completion_rate)}</span>,
                ])}
              />

              <AIAnalyticsTable
                title={profileDict.aiAnalyticsModel}
                description={getAIFieldHelpText('model', presentationLocale)}
                columns={[
                  profileDict.aiAnalyticsColumnScene,
                  profileDict.aiAnalyticsColumnModel,
                  profileDict.aiAnalyticsColumnRecommendations,
                  profileDict.aiAnalyticsColumnAdoptionRate,
                  profileDict.aiAnalyticsColumnCompletionRate,
                  profileDict.aiAnalyticsColumnConfidence,
                ]}
                rows={formatMetricRows(sortedModelMetrics, row => [
                  primaryWithRaw('scene', formatAISceneLabel(row.scene, presentationLocale), row.scene),
                  primaryWithRaw('model', formatAIModelLabel(row.model, presentationLocale), row.model),
                  String(row.recommendation_count),
                  <span key="adoption" className="font-medium">{formatPercent(row.adoption_rate)}</span>,
                  <span key="completion" className="font-medium">{formatPercent(row.completion_rate)}</span>,
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
          ) : null}
        </>
      )}
    </div>
  )
}
