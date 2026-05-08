'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import type en from '@/i18n/en.json'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { submitScore } from '@/app/(authenticated)/dashboard/actions'
import {
  Dialog,
  DialogFormContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ReviewOutput } from '@/lib/ai/phase2aSchemas'
import type { ReviewApiResponse } from '@/lib/ai/types'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'

type Dict = typeof en

function SubmitScoreButton({
  disabled,
  label
}: {
  disabled: boolean
  label: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button disabled={disabled || pending} className="w-full">
      {pending && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
      {label}
    </Button>
  )
}

interface ScoreCardProps {
  dict: Dict
  today: string
  recent7: { date: string; score: number }[]
  currentScore?: number | null
  reviewQuestionsCount?: 1 | 2
  ab2ReviewVariant?: 'A' | 'B' | null
  className?: string
}

export function ScoreCard({
  dict,
  today,
  recent7: _recent7 = [],
  currentScore = null,
  reviewQuestionsCount = 2,
  ab2ReviewVariant = null,
  className
}: ScoreCardProps) {
  void _recent7
  const [score, setScore] = useState<number | null>(currentScore)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewOutput | null>(null)
  const [reviewRecommendationId, setReviewRecommendationId] = useState<string | null>(null)
  const [reviewOutcomeState, setReviewOutcomeState] = useState<'idle' | 'dismissed'>('idle')
  const [friction, setFriction] = useState<string>('')
  const [tomorrowTime, setTomorrowTime] = useState<string>('')

  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const labels = [
    dict.today.scoreLabels?.[0] || '很糟',
    dict.today.scoreLabels?.[1] || '一般',
    dict.today.scoreLabels?.[2] || '不错',
    dict.today.scoreLabels?.[3] || '很好',
    dict.today.scoreLabels?.[4] || '极佳'
  ]

  async function openReview() {
    setReviewOpen(true)
    setReviewError(null)
    setReviewResult(null)
    setReviewRecommendationId(null)
    setReviewOutcomeState('idle')
    setFriction('')
    setTomorrowTime('')
    logEvent('ai_review_click', { source: 'dashboard', had_score: score != null, variant: ab2ReviewVariant })
    sendAIFeedback('ai_review_click', { source: 'dashboard', had_score: score != null, variant: ab2ReviewVariant })
  }

  async function generateReview() {
    setReviewError(null)
    setReviewLoading(true)
    try {
      const answers: Record<string, string> = {}
      if (friction) answers.friction = friction
      if (reviewQuestionsCount === 2 && tomorrowTime) answers.tomorrow_time = tomorrowTime

      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ today, score, answers, locale })
      })
      const json = (await res.json()) as ReviewApiResponse & { error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        setReviewError((dict.common.errors as Record<string, string>)[key] || dict.common.errors.operation_failed)
        return
      }
      if (!json.data || !json.recommendationId) {
        setReviewError(dict.common.errors.operation_failed)
        return
      }
      setReviewResult(json.data)
      setReviewRecommendationId(json.recommendationId)
      logEvent('ai_review_generated', {
        questions_answered: (friction ? 1 : 0) + (reviewQuestionsCount === 2 && tomorrowTime ? 1 : 0),
        variant: ab2ReviewVariant
      })
      sendAIFeedback('ai_review_generated', {
        questions_answered: (friction ? 1 : 0) + (reviewQuestionsCount === 2 && tomorrowTime ? 1 : 0),
        friction: friction || null,
        tomorrow_time: (reviewQuestionsCount === 2 ? (tomorrowTime || null) : null),
        variant: ab2ReviewVariant
      })
    } catch {
      setReviewError(dict.common.errors.operation_failed)
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className={`rounded-lg border bg-card/50 backdrop-blur-sm p-4 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium">{dict.dashboard.dailyScore}</div>
          {dict.dashboard.dailyScoreDesc && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {dict.dashboard.dailyScoreDesc}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold">{score ?? '-'}</div>
          <div className="text-muted-foreground text-sm">/ 5</div>
          {currentScore != null && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {score === currentScore ? (dict.today.alreadyScored || '今日已评分') : (dict.today.updateScore || '修改评分')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n, i) => {
          const active = score === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`rounded-md px-1 py-1.5 text-sm transition-all ${active ? 'bg-primary text-primary-foreground scale-[1.03]' : 'bg-muted hover:bg-muted/70'}`}
            >
              <div className="font-medium text-sm">{n}</div>
              <div className="text-[9px] mt-0.5 opacity-70 truncate">{labels[i]}</div>
            </button>
          )
        })}
      </div>

      <form action={submitScore} className="mt-3">
        <input type="hidden" name="date" value={today} />
        <input type="hidden" name="score" value={score ?? ''} />
        <SubmitScoreButton
          disabled={score == null || (currentScore != null && score === currentScore)}
          label={score != null && currentScore != null && score !== currentScore ? (dict.today.updateScore || '更新评分') : dict.common.submit}
        />
      </form>

      <div className="mt-3">
        <Button type="button" variant="outline" className="w-full" onClick={openReview}>
          {(dict.dashboard as unknown as Record<string, string>).aiReviewBtn || (locale === 'zh' ? 'AI 帮我总结今天 & 给明天策略（草案）' : 'AI Review & Tomorrow Plan (draft)')}
        </Button>
      </div>

      <Dialog
        open={reviewOpen}
        onOpenChange={(open) => {
          if (!open && reviewOpen && reviewRecommendationId && reviewOutcomeState === 'idle') {
            setReviewOutcomeState('dismissed')
            void fetch(`/api/ai/recommendations/${reviewRecommendationId}/dismiss`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ feedbackLabel: reviewResult ? 'close_result' : 'dismiss' })
            }).catch(() => {
            })
            logEvent('ai_review_dismiss', { step: 'result', variant: ab2ReviewVariant })
            sendAIFeedback('ai_review_dismiss', { step: 'result', variant: ab2ReviewVariant })
          }
          setReviewOpen(open)
        }}
      >
        <DialogFormContent mobileMode="fullscreen" className="sm:max-w-lg p-4 sm:p-6">
          <DialogHeader className="pr-10 text-left sm:text-left">
            <DialogTitle>
              {(dict.dashboard as unknown as Record<string, string>).aiReviewTitle || (locale === 'zh' ? 'AI 夜间复盘（草案）' : 'AI Review (draft)')}
            </DialogTitle>
            <div className="text-xs text-muted-foreground">
              {locale === 'zh' ? '回答 0-2 个问题后生成简洁建议' : 'Answer 0-2 questions and generate concise suggestions'}
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="text-sm font-medium">{locale === 'zh' ? '今天最大的阻力是什么？' : 'What was the biggest friction today?'}</div>
              <select
                value={friction}
                onChange={(e) => setFriction(e.target.value)}
                className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={reviewLoading}
              >
                <option value="">{locale === 'zh' ? '可跳过' : 'Skip'}</option>
                <option value="no_time">{locale === 'zh' ? '没时间' : 'No time'}</option>
                <option value="too_hard">{locale === 'zh' ? '太难' : 'Too hard'}</option>
                <option value="anxiety">{locale === 'zh' ? '焦虑' : 'Anxiety'}</option>
                <option value="unclear_next">{locale === 'zh' ? '不知道下一步' : 'Unclear next'}</option>
                <option value="low_energy">{locale === 'zh' ? '没精力' : 'Low energy'}</option>
                <option value="other">{locale === 'zh' ? '其他' : 'Other'}</option>
              </select>
            </div>

            {reviewQuestionsCount === 2 ? (
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="text-sm font-medium">{locale === 'zh' ? '明天大概能投入多久？' : 'How much time can you invest tomorrow?'}</div>
                <select
                  value={tomorrowTime}
                  onChange={(e) => setTomorrowTime(e.target.value)}
                  className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={reviewLoading}
                >
                  <option value="">{locale === 'zh' ? '可跳过' : 'Skip'}</option>
                  <option value="5-10">5-10m</option>
                  <option value="10-20">10-20m</option>
                  <option value="20-45">20-45m</option>
                  <option value="45+">45m+</option>
                  <option value="unknown">{locale === 'zh' ? '不确定' : 'Unknown'}</option>
                </select>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setReviewOpen(false)} disabled={reviewLoading}>
                {dict.common.cancel}
              </Button>
              <Button type="button" onClick={generateReview} disabled={reviewLoading}>
                {reviewLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
                {locale === 'zh' ? '生成' : 'Generate'}
              </Button>
            </div>

            {reviewError && <div className="text-sm text-destructive">{reviewError}</div>}

            {reviewResult ? (
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="text-sm font-medium">{reviewResult.summary_sentence}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>{locale === 'zh' ? '风险：' : 'Risk: '}{reviewResult.tomorrow_card.risk}</div>
                  <div>{locale === 'zh' ? 'If-Then：如果' : 'If-Then: if '}{reviewResult.tomorrow_card.if_then.if}{locale === 'zh' ? '那么' : ' then '}{reviewResult.tomorrow_card.if_then.then}</div>
                  <div>{locale === 'zh' ? '明日方向：' : 'Tomorrow direction: '}{reviewResult.tomorrow_card.suggested_core_action_direction}</div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogFormContent>
      </Dialog>
    </div>
  )
}
