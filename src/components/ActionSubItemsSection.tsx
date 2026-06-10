'use client'

import { CheckCircle2, ChevronDown, ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActionSubItem = {
  id: string
  title: string
  completed: boolean
}

type ActionSubItemsSectionProps = {
  items: ActionSubItem[]
  label: string
  completedCount: number
  onToggleItem?: (id: string, currentCompleted: boolean) => void
  busyId?: string | null
  collapsible?: boolean
  expanded?: boolean
  onExpandedChange?: (next: boolean) => void
  showMoreLabel?: string
  showLessLabel?: string
  className?: string
  itemClassName?: string
}

export function ActionSubItemsSection({
  items,
  label,
  completedCount,
  onToggleItem,
  busyId,
  collapsible = false,
  expanded = true,
  onExpandedChange,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  className,
  itemClassName,
}: ActionSubItemsSectionProps) {
  if (items.length === 0) return null

  const content = (
    <div className="space-y-1">
      {items.map((item) => {
        const interactive = Boolean(onToggleItem)
        const handleToggle = () => {
          if (!onToggleItem) return
          onToggleItem(item.id, item.completed)
        }
        const itemBody = (
          <>
            {item.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
              {item.title}
            </span>
          </>
        )

        return interactive ? (
          <button
            key={item.id}
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-background/50',
              itemClassName
            )}
            onClick={handleToggle}
            disabled={busyId === item.id}
          >
            {itemBody}
          </button>
        ) : (
          <div
            key={item.id}
            className={cn('flex items-center gap-2 rounded px-1 py-1 text-xs', itemClassName)}
          >
            {itemBody}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className={cn('rounded-md border border-border/40 bg-secondary/15 p-2', className)}>
      {collapsible ? (
        <>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs text-muted-foreground transition-colors hover:bg-background/60"
            onClick={() => onExpandedChange?.(!expanded)}
          >
            <span className="font-medium">
              {label} {completedCount}/{items.length}
            </span>
            <span className="inline-flex items-center gap-1">
              {expanded ? showLessLabel : showMoreLabel}
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          </button>
          {expanded ? <div className="mt-2">{content}</div> : null}
        </>
      ) : (
        <>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            {label} {completedCount}/{items.length}
          </div>
          {content}
        </>
      )}
    </div>
  )
}
