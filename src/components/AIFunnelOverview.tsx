import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AIFunnelOverviewRow } from '@/lib/ai/analyticsStore'

interface Props {
  dict: Record<string, string>
  overview: AIFunnelOverviewRow
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function AIFunnelOverview({ dict, overview }: Props) {
  const cards = [
    {
      title: dict.aiFunnelPageViewDays || '访问人天',
      value: String(overview.page_view_days),
      helpText: dict.aiFunnelPageViewDaysHelp || '这段时间里，有过 Dashboard / Today 访问的 user-day 数。',
    },
    {
      title: dict.aiFunnelPlanExposureRate || 'Plan 曝光率',
      value: formatPercent(overview.today_plan_exposure_rate),
      helpText: dict.aiFunnelPlanExposureRateHelp || '访问后，至少看到一次 Today Plan 的 user-day 占比。',
    },
    {
      title: dict.aiFunnelPlanApplyRate || 'Plan 采纳率',
      value: formatPercent(overview.today_plan_apply_rate),
      helpText: dict.aiFunnelPlanApplyRateHelp || '看到 Today Plan 后，至少应用一次建议的 user-day 占比。',
    },
    {
      title: dict.aiFunnelNextDayReturnRate || '次日回访率',
      value: formatPercent(overview.returned_next_day_rate),
      helpText: dict.aiFunnelNextDayReturnRateHelp || '本日访问后，次日再次访问 Dashboard / Today 的 user-day 占比。',
    },
    {
      title: dict.aiFunnelReviewExposed || 'Review 曝光人天',
      value: String(overview.review_exposed_user_days),
      helpText: dict.aiFunnelReviewExposedHelp || '至少看到一次 Review 入口的 user-day 数。',
    },
    {
      title: dict.aiFunnelRescueClicks || 'Rescue 点击人天',
      value: String(overview.rescue_click_user_days),
      helpText: dict.aiFunnelRescueClicksHelp || '至少点击一次 Rescue 的 user-day 数。',
    },
    {
      title: dict.aiFunnelCoreActionSet || '核心行动设定人天',
      value: String(overview.core_action_set_user_days),
      helpText: dict.aiFunnelCoreActionSetHelp || '至少有一个 AI 关联核心行动被设定的 user-day 数。',
    },
    {
      title: dict.aiFunnelCoreActionCompletionRate || '核心行动完成率',
      value: formatPercent(overview.core_action_completion_rate),
      helpText: dict.aiFunnelCoreActionCompletionRateHelp || '已设定 AI 关联核心行动的 user-day 中，当天至少完成一次的占比。',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
