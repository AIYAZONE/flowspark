'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type en from '@/i18n/en.json'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ActionItem } from '@/components/ActionItem'
import { buildTodayTaskListModel } from '@/lib/today-task-list'

type Dict = typeof en

interface Action {
  id: string
  title: string
  description?: string
  created_at?: string | null
  type: string
  priority: string
  completed: boolean
  start_date: string
  end_date?: string | null
  goal_id: string
  goals?: {
    id: string
    title: string
  }
  action_sub_items?: Array<{
    id: string
    title: string
    completed: boolean
    sort_order: number
  }>
}

const NEW_WINDOW_MS = 5 * 60 * 1000

function isRecentlyCreated(action: Action): boolean {
  if (action.completed) return false
  if (!action.created_at) return false
  const createdAtMs = new Date(action.created_at).getTime()
  if (!Number.isFinite(createdAtMs)) return false
  return Date.now() - createdAtMs <= NEW_WINDOW_MS
}

export function TodayActionList({
  actions,
  goals,
  dict,
  tz,
  today,
  primaryGoalId = null,
  showGoalTitle = true,
  initialOpenActionId = null,
  initialPanelMode = 'view',
}: {
  actions: Action[]
  goals: { id: string, title: string }[]
  dict: Dict
  tz: string
  today: string
  primaryGoalId?: string | null
  showGoalTitle?: boolean
  initialOpenActionId?: string | null
  initialPanelMode?: 'view' | 'edit' | 'rescue'
}) {
  const isZh = String(dict.common.locale || '').toLowerCase().startsWith('zh')
  const openSectionLabel = isZh ? '待做' : 'To Do'
  const openSectionHint = isZh ? '今天直接推进这些事。' : 'Move these forward today.'
  const emptyStateLabel = isZh ? '今天没有待做任务了。' : 'No open tasks for today.'

  const model = useMemo(() => buildTodayTaskListModel({
    today,
    primaryGoalId,
    actions,
  }), [actions, primaryGoalId, today])

  const targetIsCompleted = Boolean(
    initialOpenActionId && model.completed.some((action) => action.id === initialOpenActionId)
  )
  const [completedOpen, setCompletedOpen] = useState(
    targetIsCompleted
  )
  const hasScrolledToTargetRef = useRef(false)

  useEffect(() => {
    if (!initialOpenActionId || hasScrolledToTargetRef.current) return

    if (targetIsCompleted && !completedOpen) return

    hasScrolledToTargetRef.current = true
    const scroll = () => {
      const element = document.querySelector<HTMLElement>(`[data-action-id="${initialOpenActionId}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scroll)
    })
  }, [completedOpen, initialOpenActionId, targetIsCompleted])

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="text-base font-semibold">{openSectionLabel}</div>
            <div className="text-sm text-muted-foreground">
              {openSectionHint}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {isZh
              ? `${model.incompleteCount} 待做 · ${model.completedCount} 已完成`
              : `${model.incompleteCount} open · ${model.completedCount} done`}
          </div>
        </div>

        {model.incompleteCount > 0 ? (
          <div className="grid gap-3">
            {model.incomplete.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                dict={dict}
                showGoalTitle={showGoalTitle}
                tz={tz}
                goals={goals}
                isNew={isRecentlyCreated(action)}
                initialOpen={action.id === initialOpenActionId}
                initialPanelMode={action.id === initialOpenActionId ? initialPanelMode : 'view'}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
            {emptyStateLabel}
          </div>
        )}
      </section>

      {model.completedCount > 0 ? (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen} className="rounded-lg border bg-card/40">
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 group">
              <div className="flex min-w-0 items-center gap-2">
                <Button variant="ghost" size="sm" className="p-0 text-muted-foreground hover:bg-transparent group-hover:text-foreground">
                  {completedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <div className="min-w-0 font-medium truncate">{dict.today.completedSection}</div>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">{model.completedCount}</div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-3">
              <div className="grid gap-3">
                {model.completed.map((action) => (
                  <ActionItem
                    key={action.id}
                    action={action}
                    dict={dict}
                    showGoalTitle={showGoalTitle}
                    tz={tz}
                    goals={goals}
                    initialOpen={action.id === initialOpenActionId}
                    initialPanelMode={action.id === initialOpenActionId ? initialPanelMode : 'view'}
                  />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  )
}
