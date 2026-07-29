'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { Dictionary } from '@/i18n/types'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { submitScore } from '@/app/(authenticated)/dashboard/actions'

type Dict = Dictionary

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
  recent7?: { date: string; score: number }[]
  currentScore?: number | null
  className?: string
}

export function ScoreCard({
  dict,
  today,
  recent7: _recent7 = [],
  currentScore = null,
  className
}: ScoreCardProps) {
  void _recent7
  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const [score, setScore] = useState<number | null>(currentScore)

  const labels = [
    dict.today.scoreLabels?.[0] || '很糟',
    dict.today.scoreLabels?.[1] || '一般',
    dict.today.scoreLabels?.[2] || '不错',
    dict.today.scoreLabels?.[3] || '很好',
    dict.today.scoreLabels?.[4] || '极佳'
  ]

  return (
    <div className={`rounded-2xl border border-border/50 bg-card/95 p-5 shadow-sm shadow-black/4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
            {locale === 'zh' ? 'Daily Review' : 'Daily Review'}
          </div>
          <div className="mt-2 text-sm font-medium">{dict.dashboard.dailyScore}</div>
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
              className={`rounded-xl px-1 py-2 text-sm transition-all ${active ? 'bg-primary text-primary-foreground scale-[1.03] shadow-sm shadow-primary/20' : 'bg-muted/70 hover:bg-muted'}`}
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
    </div>
  )
}
