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

export function WeeklyInsightCard({ dict, locale, insight, compact = false }: WeeklyInsightCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!insight) return
    logAIEvent('ai_weekly_insight_view', undefined, {
      recommendation_id: insight.recommendationId,
      scene: 'weekly_insight',
    })
    sendAIFeedback('ai_weekly_insight_view', {
      recommendation_id: insight.recommendationId,
      scene: 'weekly_insight',
    })
  }, [insight])

  async function handleGenerate() {
    setLoading(true)
    logAIEvent('ai_weekly_insight_generate', undefined, { scene: 'weekly_insight' })
    sendAIFeedback('ai_weekly_insight_generate', { scene: 'weekly_insight' })
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

  const momentumText =
    insight?.output.momentum === 'high' ? (locale === 'zh' ? '高' : 'High')
    : insight?.output.momentum === 'medium' ? (locale === 'zh' ? '中' : 'Medium')
    : insight?.output.momentum === 'low' ? (locale === 'zh' ? '低' : 'Low')
    : locale === 'zh' ? '未知' : 'Unknown'

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
            <div className="text-sm leading-6">{insight.output.summary}</div>
            <div className={`gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm ${compact ? 'space-y-2' : 'grid md:grid-cols-3'}`}>
              <div className="flex items-start justify-between gap-3 md:block">
                <span className="text-muted-foreground">{dict.weeklyInsightMomentum || '本周动量'}</span>
                <div className="font-medium md:mt-2">{momentumText}</div>
              </div>
              <div className="flex items-start justify-between gap-3 md:block">
                <span className="text-muted-foreground">{dict.weeklyInsightBestTime || '高效时间段'}</span>
                <div className="font-medium text-right md:mt-2 md:text-left">{insight.output.strongestTimeBucket || '-'}</div>
              </div>
              <div className="flex items-start justify-between gap-3 md:block">
                <span className="text-muted-foreground">{dict.weeklyInsightTopFriction || '主要阻力'}</span>
                <div className="font-medium text-right md:mt-2 md:text-left">{insight.output.topFriction || '-'}</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.weeklyInsightRecommendation || '下周建议'}
              </div>
              <div className="text-sm leading-6">{insight.output.recommendation}</div>
            </div>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link
                href="/profile/ai-insights"
                onClick={() => {
                  logAIEvent('ai_weekly_insight_open_report', undefined, {
                    recommendation_id: insight.recommendationId,
                    scene: 'weekly_insight',
                  })
                  sendAIFeedback('ai_weekly_insight_open_report', {
                    recommendation_id: insight.recommendationId,
                    scene: 'weekly_insight',
                  })
                }}
              >
                {dict.weeklyInsightOpenReport || '查看 AI 分析'}
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
