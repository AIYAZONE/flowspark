'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { RescuePanel } from './RescuePanel'

/**
 * 就近救援触发器：在 EmergentInsights 的驻点目标旁嵌入。
 * 点击展开 RescuePanel，由 RescuePanel 自行调用 API。
 */
export function RescueInlineButton({
  goalId,
  goalTitle,
  actionId,
  actionTitle,
  reasonTag,
  staleLabel,
  milestoneStage,
}: {
  goalId: string
  goalTitle: string
  actionId?: string
  actionTitle?: string
  reasonTag: string
  staleLabel: string
  milestoneStage?: {
    currentMilestoneTitle?: string
    completedCount?: number
    totalCount?: number
    progressText?: string
  } | null
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="w-full">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/5 px-2 py-0.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/10"
      >
        <Sparkles className="h-3 w-3" />
        {show ? '收起' : '救援'}
      </button>
      {show ? (
        <div className="mt-2">
          <RescuePanel
            reasonTag={reasonTag}
            action={actionTitle ? { id: actionId || goalId, title: actionTitle } : { id: goalId, title: goalTitle }}
            goal={{ id: goalId, title: goalTitle }}
            milestoneStage={milestoneStage}
            staleContextLabel={staleLabel}
          />
        </div>
      ) : null}
    </div>
  )
}
