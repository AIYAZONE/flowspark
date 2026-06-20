'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { logAIEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'
import type { WeeklyInsightOutput } from '@/lib/ai/types'

type PlanningDict = Record<string, string>

interface WeeklyInsightCardProps {
  dict: PlanningDict
  locale: 'zh' | 'en'
  insight: {
    recommendationId: string
    createdAt: string
    output: WeeklyInsightOutput
  } | null
  compact?: boolean
}

function formatTimeBucket(value: string | null | undefined, locale: 'zh' | 'en') {
  if (!value) return '-'
  const timeBucketMap = locale === 'zh'
    ? {
        morning: '上午',
        afternoon: '下午',
        evening: '晚上',
        unknown: '未明确',
      }
    : {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        unknown: 'Not clear',
      }

  return timeBucketMap[value as keyof typeof timeBucketMap] || value
}

function formatFriction(value: string | null | undefined, locale: 'zh' | 'en') {
  if (!value) return '-'
  const frictionMap = locale === 'zh'
    ? {
        no_time: '没时间',
        low_energy: '没精力',
        too_hard: '太难了',
        anxiety: '有压力',
        unclear_next: '下一步不明确',
        other: '其他',
      }
    : {
        no_time: 'No time',
        low_energy: 'Low energy',
        too_hard: 'Too hard',
        anxiety: 'Anxiety',
        unclear_next: 'Unclear next step',
        other: 'Other',
      }

  return frictionMap[value as keyof typeof frictionMap] || value
}

export function WeeklyInsightCard({ dict, locale, insight, compact = false }: WeeklyInsightCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!insight) return
    logAIEvent('ai_weekly_insight_view', { source: 'dashboard' }, {
      recommendation_id: insight.recommendationId,
      scene: 'weekly_insight',
    })
    sendAIFeedback('ai_weekly_insight_view', {
      recommendation_id: insight.recommendationId,
      source: 'dashboard',
      scene: 'weekly_insight',
    })
  }, [insight])

  async function handleGenerate() {
    setLoading(true)
    logAIEvent('ai_weekly_insight_generate', { source: 'dashboard' }, { scene: 'weekly_insight' })
    sendAIFeedback('ai_weekly_insight_generate', { source: 'dashboard', scene: 'weekly_insight' })
    try {
      await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const formattedCreatedAt = insight?.createdAt
    ? (() => {
        const date = new Date(insight.createdAt)
        if (Number.isNaN(date.getTime())) return null
        return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date)
      })()
    : null

  const momentumText =
    insight?.output.momentum === 'high' ? (locale === 'zh' ? '高' : 'High')
    : insight?.output.momentum === 'medium' ? (locale === 'zh' ? '中' : 'Medium')
    : insight?.output.momentum === 'low' ? (locale === 'zh' ? '低' : 'Low')
    : locale === 'zh' ? '未知' : 'Unknown'
  const strongestTimeBucketText = formatTimeBucket(insight?.output.strongestTimeBucket, locale)
  const topFrictionText = formatFriction(insight?.output.topFriction, locale)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{dict.weeklyInsightTitle || '本周 AI 洞察'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insight ? (
          <>
            <div className="text-sm text-muted-foreground">
              {dict.weeklyInsightEmpty || '系统还没有为你生成本周洞察。'}
            </div>
            <Button type="button" onClick={handleGenerate} disabled={loading} className="w-full rounded-full">
              {loading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
              {dict.weeklyInsightGenerate || '生成本周洞察'}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.weeklyInsightLastUpdated || '上次生成'}
              </div>
              <div className="text-sm text-muted-foreground">
                {formattedCreatedAt || insight.createdAt}
              </div>
            </div>
            <div className="text-sm leading-6">{insight.output.summary}</div>
            <div className={`gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm ${compact ? 'space-y-2' : 'grid md:grid-cols-3'}`}>
              <div className="flex items-start justify-between gap-3 md:block">
                <span className="text-muted-foreground">{dict.weeklyInsightMomentum || '本周动量'}</span>
                <div className="font-medium md:mt-2">{momentumText}</div>
              </div>
              <div className="flex items-start justify-between gap-3 md:block">
                <span className="text-muted-foreground">{dict.weeklyInsightBestTime || '高效时间段'}</span>
                <div className="font-medium text-right md:mt-2 md:text-left">{strongestTimeBucketText}</div>
              </div>
              <div className="flex items-start justify-between gap-3 md:block">
                <span className="text-muted-foreground">{dict.weeklyInsightTopFriction || '主要阻力'}</span>
                <div className="font-medium text-right md:mt-2 md:text-left">{topFrictionText}</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.weeklyInsightRecommendation || '下周建议'}
              </div>
              <div className="text-sm leading-6">{insight.output.recommendation}</div>
            </div>
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
              {dict.weeklyInsightRefreshHint || '7 天内复用当前结果，超过 7 天自动刷新；你也可以手动重新生成。'}
            </div>
            <div className={`flex gap-3 ${compact ? 'flex-col' : 'flex-col sm:flex-row'}`}>
              <Button type="button" onClick={handleGenerate} disabled={loading} variant="outline" className="rounded-full">
                {loading && <LoadingSpinner size={16} className="mr-2 text-current/80" />}
                {dict.weeklyInsightRegenerate || '重新生成'}
              </Button>
              <Button asChild variant="outline" className="rounded-full flex-1">
                <Link
                  href="/profile/ai-insights"
                  onClick={() => {
                    logAIEvent('ai_weekly_insight_open_report', { source: 'dashboard' }, {
                      recommendation_id: insight.recommendationId,
                      scene: 'weekly_insight',
                    })
                    sendAIFeedback('ai_weekly_insight_open_report', {
                      recommendation_id: insight.recommendationId,
                      source: 'dashboard',
                      scene: 'weekly_insight',
                    })
                  }}
                >
                  {dict.weeklyInsightOpenReport || '查看 AI 分析'}
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
