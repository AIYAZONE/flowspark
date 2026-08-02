'use client'

import { useState, useCallback } from 'react'
import { Lightbulb, Loader2, AlertTriangle, Sparkles, Timer, ArrowRight, X } from 'lucide-react'

type RescueResult = {
  minimal_variant: {
    minutes: number
    title: string
    first_step: string
    definition_of_done: string
  }
  if_then: {
    if: string
    then: string
  }
  reason_tag: string
  confidence: 'low' | 'medium' | 'high'
}

type RescuePanelProps = {
  reasonTag: string
  action: { id: string; title: string }
  goal: { id: string; title: string }
  milestoneStage?: {
    currentMilestoneTitle?: string
    completedCount?: number
    totalCount?: number
    progressText?: string
  } | null
  /** 卡点描述文本，用于触发按钮的提示文案 */
  staleContextLabel?: string | null
  className?: string
}

export function RescuePanel({
  reasonTag,
  action,
  goal,
  milestoneStage,
  staleContextLabel,
  className,
}: RescuePanelProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RescueResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const handleRescue = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason_tag: reasonTag,
          action: { id: action.id, title: action.title },
          goal: { id: goal.id, title: goal.title },
          milestone_stage: milestoneStage || null,
        }),
      })
      const json: unknown = await res.json()
      const data = json as Record<string, unknown>
      if (!res.ok || !data.ok) {
        throw new Error((data.error as string) || 'rescue_failed')
      }
      const rescueData = data.data as Record<string, unknown>
      setResult({
        minimal_variant: (rescueData.minimal_variant || { minutes: 5, title: '', first_step: '', definition_of_done: '' }) as RescueResult['minimal_variant'],
        if_then: (rescueData.if_then || { if: '', then: '' }) as RescueResult['if_then'],
        reason_tag: (rescueData.reason_tag as string) || '',
        confidence: (rescueData.confidence as RescueResult['confidence']) || 'low',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }, [reasonTag, action, goal, milestoneStage])

  if (dismissed) return null

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {/* 触发按钮 */}
      {!result && !loading && !error && (
        <button
          onClick={handleRescue}
          className="group flex w-full items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-50/50 p-4 text-left transition-all hover:border-amber-500/40 hover:bg-amber-50/80 dark:border-amber-500/15 dark:bg-amber-950/20 dark:hover:border-amber-500/30 dark:hover:bg-amber-950/30"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {staleContextLabel || `「${action.title}」似乎卡住了`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              让 AI 帮你找出最小突破口，5 分钟内就能重新启动。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-amber-600">
            <Sparkles className="h-3.5 w-3.5" />
            破局
          </div>
        </button>
      )}

      {/* 加载态 */}
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-50/50 p-4 dark:border-amber-500/15 dark:bg-amber-950/20">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-muted-foreground">AI 正在分析卡点，寻找最小突破口…</p>
        </div>
      )}

      {/* 错误态 */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-50/50 p-4 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={handleRescue}
              className="text-xs font-medium text-red-600 underline hover:no-underline dark:text-red-400"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 结果态 */}
      {result && (
        <div className="space-y-3">
          {/* 最小变体卡片 */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:border-emerald-500/15 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
                <Timer className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {result.minimal_variant.minutes} 分钟最小行动
              </span>
              <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                {result.confidence === 'high' ? '高置信' : result.confidence === 'medium' ? '中置信' : '低置信'}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mb-2">
              {result.minimal_variant.title}
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span><strong>第一步：</strong>{result.minimal_variant.first_step}</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span><strong>完成标志：</strong>{result.minimal_variant.definition_of_done}</span>
              </div>
            </div>
          </div>

          {/* If-Then 卡片 */}
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 flex items-start gap-2.5">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">如果 {result.if_then.if}，</span>
                那就 {result.if_then.then}
              </p>
            </div>
          </div>

          {/* 重新生成 / 关闭 */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDismissed(true)}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              关闭
            </button>
            <button
              onClick={handleRescue}
              disabled={loading}
              className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/20 transition-colors disabled:opacity-50 dark:text-amber-400"
            >
              <Sparkles className="h-3 w-3" />
              再试一次
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
