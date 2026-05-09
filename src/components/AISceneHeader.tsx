import Link from 'next/link'
import { Button } from '@/components/ui/button'

type SceneHeaderDict = {
  aiAnalyticsBackToOverview: string
  aiAnalyticsRangeAll: string
  aiAnalyticsRange7: string
  aiAnalyticsRange30: string
  aiAnalyticsRange90: string
}

const sceneTitleMap: Record<string, { zh: string; en: string; descZh: string; descEn: string }> = {
  today_plan: {
    zh: '今日建议',
    en: 'Today Plan',
    descZh: '查看今日 AI 建议的采纳、完成和规则兜底表现。',
    descEn: 'Review adoption, completion, and rule-fallback performance for Today recommendations.',
  },
  rescue: {
    zh: '遇阻救援',
    en: 'Rescue',
    descZh: '查看用户遇阻时的 AI 救援建议是否足够可执行。',
    descEn: 'Review whether Rescue recommendations are actionable when users get stuck.',
  },
  review: {
    zh: '复盘建议',
    en: 'Review',
    descZh: '查看复盘总结、阻力识别与明日防翻车卡的效果。',
    descEn: 'Review the quality of summaries, friction detection, and tomorrow cards.',
  },
  weekly_insight: {
    zh: '周洞察',
    en: 'Weekly Insight',
    descZh: '查看周度洞察是否帮助用户形成更稳定的推进节奏。',
    descEn: 'Review whether weekly insights help build a more stable execution rhythm.',
  },
}

function getRangeLabel(dict: SceneHeaderDict, days?: number) {
  if (days === 7) return dict.aiAnalyticsRange7
  if (days === 30) return dict.aiAnalyticsRange30
  if (days === 90) return dict.aiAnalyticsRange90
  return dict.aiAnalyticsRangeAll
}

export function AISceneHeader(props: {
  scene: string
  locale: 'zh' | 'en'
  days?: number
  dict: SceneHeaderDict
}) {
  const meta = sceneTitleMap[props.scene] || {
    zh: props.scene,
    en: props.scene,
    descZh: '查看该 AI 场景的建议效果与最近记录。',
    descEn: 'Review metrics and recent recommendations for this AI scene.',
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div className="inline-flex rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
          {getRangeLabel(props.dict, props.days)}
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {props.locale === 'zh' ? meta.zh : meta.en}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {props.locale === 'zh' ? meta.descZh : meta.descEn}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/profile/ai-insights">{props.dict.aiAnalyticsBackToOverview}</Link>
      </Button>
    </div>
  )
}
