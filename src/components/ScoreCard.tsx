'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import type en from '@/i18n/en.json'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { submitScore } from '@/app/(authenticated)/dashboard/actions'

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
  className?: string
}

export function ScoreCard({
  dict,
  today,
  recent7 = [],
  currentScore = null,
  className
}: ScoreCardProps) {
  const [score, setScore] = useState<number | null>(currentScore)
  const labels = [
    dict.today.scoreLabels?.[0] || '很糟',
    dict.today.scoreLabels?.[1] || '一般',
    dict.today.scoreLabels?.[2] || '不错',
    dict.today.scoreLabels?.[3] || '很好',
    dict.today.scoreLabels?.[4] || '极佳'
  ]

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
    </div>
  )
}
