'use client'

import { useState } from 'react'
import type en from '@/i18n/en.json'
import { Button } from '@/components/ui/button'
import { submitScore } from '@/app/(authenticated)/dashboard/actions'

type Dict = typeof en

export function ScoreCard({
  dict,
  today,
  recent7 = [],
  currentScore = null
}: {
  dict: Dict
  today: string
  recent7: { date: string; score: number }[]
  currentScore?: number | null
}) {
  const [score, setScore] = useState<number | null>(currentScore)
  const labels = [
    dict.today.scoreLabels?.[0] || '很糟',
    dict.today.scoreLabels?.[1] || '一般',
    dict.today.scoreLabels?.[2] || '不错',
    dict.today.scoreLabels?.[3] || '很好',
    dict.today.scoreLabels?.[4] || '极佳'
  ]

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4">
      <div className="mb-3 text-sm text-muted-foreground">{dict.dashboard.dailyScore}</div>
      <div className="flex items-center gap-2">
        <div className="text-3xl font-bold">{score ?? '-'}</div>
        <div className="text-muted-foreground">/ 5</div>
        {currentScore != null && (
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {score === currentScore ? (dict.today.alreadyScored || '今日已评分') : (dict.today.updateScore || '修改评分')}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {[1,2,3,4,5].map((n, i) => {
          const active = score === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`rounded-md px-2 py-2 text-sm transition-all ${active ? 'bg-primary text-primary-foreground scale-[1.03]' : 'bg-muted hover:bg-muted/70'}`}
            >
              <div className="font-medium">{n}</div>
              <div className="text-[10px] mt-0.5 opacity-70">{labels[i]}</div>
            </button>
          )
        })}
      </div>

      <form action={submitScore} className="mt-4">
        <input type="hidden" name="date" value={today} />
        <input type="hidden" name="score" value={score ?? ''} />
        <Button disabled={score == null || (currentScore != null && score === currentScore)} className="w-full">
          {score != null && currentScore != null && score !== currentScore ? (dict.today.updateScore || '更新评分') : dict.common.submit}
        </Button>
      </form>

      {recent7.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">{dict.today.recent7Trend || '最近7天评分趋势'}</div>
          <div className="flex items-end gap-1 h-12">
            {recent7.slice(0,7).reverse().map((d, idx) => (
              <div key={idx} className="w-3 rounded bg-primary/40" style={{ height: `${(d.score/5)*100}%` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
