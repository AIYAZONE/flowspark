'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
}

export function ActionListCompact({
  actions,
  dict,
  maxHeight = 420
}: {
  actions: Action[]
  dict: Dict
  maxHeight?: number
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

    return (
      <div className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2">
            {action.type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-secondary/50 text-muted-foreground border-border/50">
                {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}
              </span>
            )}
            {action.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColor}`}>
                {dict.goals.priority[action.priority as keyof typeof dict.goals.priority] || action.priority}
              </span>
            )}
          </div>
          <div title={action.title} className="text-sm font-medium truncate">
            {action.title}
          </div>
        </div>

        <form>
          <input type="hidden" name="id" value={action.id} />
          <input type="hidden" name="completed" value={action.completed ? 'true' : 'false'} />
          <Button
            size="icon"
            variant={action.completed ? 'default' : 'outline'}
            className={action.completed ? 'bg-primary hover:bg-primary/90 h-8 w-8' : 'border-primary text-primary hover:bg-primary/10 h-8 w-8'}
            formAction={toggleAction}
            aria-label={action.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {action.completed ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/></svg>
            )}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b px-3 py-3 bg-card/70 backdrop-blur">
        <div className="text-xs text-muted-foreground"></div>
        <div className="text-xs text-muted-foreground">{groups.incomplete.length} / {actions.length}</div>
      </div>

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
