'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type en from '@/i18n/en.json'
import { toggleAction } from '@/app/(authenticated)/dashboard/actions'

type Dict = typeof en

interface Action {
  id: string
  title: string
  completed: boolean
  type?: string
  priority?: string
  start_date?: string | null
  end_date?: string | null
}

export function ActionListCompact({
  actions,
  dict,
  maxHeight = 420,
  today = '',
  showInProgressBadge = true
}: {
  actions: Action[]
  dict: Dict
  maxHeight?: number
  today?: string
  showInProgressBadge?: boolean
}) {
  const [completedCollapsed, setCompletedCollapsed] = useState(true)

  const groups = useMemo(() => {
    const incomplete = actions.filter(a => !a.completed)
    const complete = actions.filter(a => a.completed)
    return { incomplete, complete }
  }, [actions])

  const Row = ({ action }: { action: Action }) => {
    const priorityColor =
      action.priority === 'high'
        ? 'text-red-500 bg-red-500/10 border-red-500/20'
        : action.priority === 'low'
          ? 'text-blue-500 bg-blue-500/10 border-blue-500/20'
          : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
    const typeColor =
      action.type === 'core'
        ? { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', accent: 'border-emerald-300' }
        : action.type === 'learning'
          ? { badge: 'bg-blue-100 text-blue-700 border-blue-200', accent: 'border-blue-300' }
          : action.type === 'rest'
            ? { badge: 'bg-rose-100 text-rose-700 border-rose-200', accent: 'border-rose-300' }
            : { badge: 'bg-slate-100 text-slate-700 border-slate-200', accent: 'border-slate-300' }
    const isIncomplete = !action.completed
    const hasStart = !!action.start_date
    // 统一延期判定：优先 end_date，其次 start_date；与完成状态解耦
    const isInProgress = isIncomplete && hasStart && action.start_date === today
    const endDateStr: string | null = action.end_date ?? null
    const baseDate = endDateStr ?? action.start_date ?? ''
    const isOverdue = !!baseDate && baseDate < today
    const statusBadgeClass = isOverdue
      ? 'text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20'
      : (showInProgressBadge && isInProgress)
        ? 'text-[10px] px-1.5 py-0.5 rounded border bg-emerald-100 text-emerald-700 border-emerald-200'
        : ''

    const [isPending, startTransition] = useTransition()

    return (
      <div className={`group flex items-center justify-between rounded-md px-2 py-2 hover:bg-primary/5 border-l-2 ${typeColor.accent}`}>
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2">
            {action.type && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColor.badge}`}>
                {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}
              </span>
            )}
            {action.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColor}`}>
                {dict.goals.priority[action.priority as keyof typeof dict.goals.priority] || action.priority}
              </span>
            )}
            {statusBadgeClass && (
              <span className={`${statusBadgeClass}`}>
                {isOverdue
                  ? (dict.today.delayed || '延期')
                  : (dict.goals.status.active || '进行中')}
              </span>
            )}
          </div>
          <div title={action.title} className="text-sm font-medium truncate">
            {action.title}
          </div>
        </div>

        <Button
          size="icon"
          variant={action.completed ? 'default' : 'outline'}
          className={`${action.completed ? 'bg-primary hover:bg-primary/90' : 'border-primary text-primary hover:bg-primary/10'} h-8 w-8 shrink-0`}
          disabled={isPending}
          onClick={() => {
            startTransition(() => {
              const formData = new FormData()
              formData.append('id', action.id)
              formData.append('completed', action.completed ? 'true' : 'false')
              toggleAction(formData)
            })
          }}
          aria-label={action.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : action.completed ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" /></svg>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm">
      <div style={{ maxHeight }} className="overflow-y-auto px-2 py-2">
        {/* Incomplete */}
        <div className="mb-2">
          <div className="flex items-center gap-2 px-1 py-1">
            <Label className="text-xs text-muted-foreground">{dict.goals.filter.incomplete}</Label>
          </div>
          <div className="space-y-1">
            {groups.incomplete.map(a => <Row key={a.id} action={a} />)}
            {groups.incomplete.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-3">{dict.today.noActions}</div>
            )}
          </div>
        </div>

        {/* Complete */}
        <div>
          <button
            type="button"
            className="flex items-center gap-1 px-1 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setCompletedCollapsed(v => !v)}
            aria-expanded={!completedCollapsed}
          >
            {completedCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {dict.goals.filter.completed} ({groups.complete.length})
          </button>
          {!completedCollapsed && (
            <div className="space-y-1 mt-1">
              {groups.complete.map(a => <Row key={a.id} action={a} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
