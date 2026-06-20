'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type en from '@/i18n/en.json'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { ActionItem } from '@/components/ActionItem'
import { ActionListFilter } from '@/components/ActionListFilter'
import { calcCompletionPercent } from '@/lib/progress'

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

const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
const NEW_WINDOW_MS = 5 * 60 * 1000

function getBaseDate(action: Action): string {
  return (action.end_date ?? action.start_date) || action.start_date
}

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
  showGoalTitle = true,
  initialOpenActionId = null,
  initialPanelMode = 'view',
}: {
  actions: Action[]
  goals: { id: string, title: string }[]
  dict: Dict
  tz: string
  today: string
  showGoalTitle?: boolean
  initialOpenActionId?: string | null
  initialPanelMode?: 'view' | 'edit' | 'rescue'
}) {
  const isZh = String(dict.common.locale || '').toLowerCase().startsWith('zh')
  const recentSectionLabel = isZh ? '刚创建' : 'New'
  const recentSummaryLabel = isZh ? '刚创建' : 'new'

  const allViewActions = useMemo(() => {
    return actions
      .map((action, index) => ({ action, index }))
      .sort((a, b) => {
        const aRecent = isRecentlyCreated(a.action)
        const bRecent = isRecentlyCreated(b.action)
        if (aRecent !== bRecent) return aRecent ? -1 : 1
        return a.index - b.index
      })
      .map((entry) => entry.action)
  }, [actions])

  const summary = useMemo(() => {
    const incomplete = actions.filter(a => !a.completed)
    const completed = actions.filter(a => a.completed)
    const overdue = incomplete.filter(a => getBaseDate(a) < today)
    const must = incomplete.filter(a => (a.priority || 'medium') === 'high' || a.type === 'core')
    const recent = incomplete.filter(isRecentlyCreated)
    const total = actions.length
    const completedPct = calcCompletionPercent(completed.length, total)
    return {
      incompleteCount: incomplete.length,
      completedCount: completed.length,
      overdueCount: overdue.length,
      mustCount: must.length,
      recentCount: recent.length,
      totalCount: total,
      completedPct
    }
  }, [actions, today])

  const shouldFocusByDefault = summary.incompleteCount > 12
  const [view, setView] = useState<'focus' | 'all'>(shouldFocusByDefault ? 'focus' : 'all')

  const focusModel = useMemo(() => {
    const incomplete = actions.filter(a => !a.completed)
    const completed = actions.filter(a => a.completed)

    const sortedIncomplete = [...incomplete].sort((a, b) => {
      const overdueA = getBaseDate(a) < today
      const overdueB = getBaseDate(b) < today
      if (overdueA !== overdueB) return overdueA ? -1 : 1

      const pa = priorityOrder[a.priority || 'medium'] ?? 2
      const pb = priorityOrder[b.priority || 'medium'] ?? 2
      if (pa !== pb) return pb - pa

      const ta = a.type === 'core' ? 1 : 0
      const tb = b.type === 'core' ? 1 : 0
      if (ta !== tb) return tb - ta

      const da = getBaseDate(a)
      const db = getBaseDate(b)
      if (da !== db) return da < db ? -1 : 1

      return a.id.localeCompare(b.id)
    })

    const recent = sortedIncomplete.filter(isRecentlyCreated)
    const recentIds = new Set(recent.map(a => a.id))
    const must = sortedIncomplete.filter(a => !recentIds.has(a.id) && ((a.priority || 'medium') === 'high' || a.type === 'core'))

    const remainingForGroups = new Map<string, Action[]>()
    const mustIds = new Set(must.map(a => a.id))
    const overdue = sortedIncomplete.filter(a => !recentIds.has(a.id) && getBaseDate(a) < today)
    const overdueIds = new Set(overdue.map(a => a.id))

    for (const action of sortedIncomplete) {
      if (recentIds.has(action.id) || mustIds.has(action.id) || overdueIds.has(action.id)) continue
      const key = action.goal_id || '__ungrouped__'
      const list = remainingForGroups.get(key) ?? []
      list.push(action)
      remainingForGroups.set(key, list)
    }

    const groups = [...remainingForGroups.entries()]
      .map(([goalId, items]) => {
        const goalTitle = items[0]?.goals?.title || goals.find(g => g.id === goalId)?.title || dict.today.ungrouped
        return { goalId, goalTitle, items }
      })
      .sort((a, b) => (b.items.length - a.items.length) || a.goalId.localeCompare(b.goalId))

    return {
      sortedIncomplete,
      recent,
      must,
      overdue,
      completed,
      groups
    }
  }, [actions, dict.today.ungrouped, goals, today])

  const maxMust = 8
  const maxOverdue = 8
  const maxPerGroup = 6

  const [showAllMust, setShowAllMust] = useState(false)
  const [showAllOverdue, setShowAllOverdue] = useState(false)
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({})
  const [openGoalIds, setOpenGoalIds] = useState<Record<string, boolean>>({})
  const [completedOpen, setCompletedOpen] = useState(false)

  const overloadTip =
    summary.incompleteCount > maxMust
      ? dict.today.overloadTip.replace('{max}', String(maxMust))
      : ''

  if (view === 'all') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                {dict.goals.filter.incomplete} {summary.incompleteCount} · {dict.goals.filter.completed} {summary.completedCount} · {dict.today.delayed} {summary.overdueCount}
              </div>
              {overloadTip ? (
                <div className="text-sm font-medium">{overloadTip}</div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setView('focus')}
              >
                {dict.today.focusView}
              </Button>
              <Button type="button" size="sm" className="rounded-full" disabled>
                {dict.today.allView}
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{dict.today.progressLabel}</span>
              <span>{summary.completedPct}%</span>
            </div>
            <Progress value={summary.completedPct} />
          </div>
        </div>

        <ActionListFilter initialActions={allViewActions} dict={dict} showGoalTitle={showGoalTitle} tz={tz} goals={goals} goalsForEdit={goals} />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              {dict.goals.filter.incomplete} {summary.incompleteCount} · {recentSummaryLabel} {summary.recentCount} · {dict.today.focusView} {Math.min(maxMust, focusModel.must.length)} · {dict.today.delayed} {summary.overdueCount}
            </div>
            {overloadTip ? (
              <div className="text-sm font-medium">{overloadTip}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" className="rounded-full" disabled>
              {dict.today.focusView}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setView('all')}
            >
              {dict.today.allView}
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{dict.today.progressLabel}</span>
            <span>{summary.completedPct}%</span>
          </div>
          <Progress value={summary.completedPct} />
        </div>
      </div>

      {focusModel.recent.length > 0 ? (
        <div className="space-y-3">
          <div className="text-base font-semibold">{recentSectionLabel}</div>
          <div className="grid gap-3">
            {focusModel.recent.map(action => (
              <ActionItem
                key={action.id}
                action={action}
                dict={dict}
                showGoalTitle={showGoalTitle}
                tz={tz}
                goals={goals}
                isNew
                initialOpen={action.id === initialOpenActionId}
                initialPanelMode={action.id === initialOpenActionId ? initialPanelMode : 'view'}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">{dict.today.mustSection}</div>
          {focusModel.must.length > maxMust ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setShowAllMust(v => !v)}
            >
              {showAllMust ? dict.today.showLess : dict.today.showMore}
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3">
          {(showAllMust ? focusModel.must : focusModel.must.slice(0, maxMust)).map(action => (
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
          {focusModel.must.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {dict.today.noActions}
            </div>
          ) : null}
        </div>
      </div>

      {focusModel.overdue.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">{dict.today.overdueSection}</div>
            {focusModel.overdue.length > maxOverdue ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => setShowAllOverdue(v => !v)}
              >
                {showAllOverdue ? dict.today.showLess : dict.today.showMore}
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3">
            {(showAllOverdue ? focusModel.overdue : focusModel.overdue.slice(0, maxOverdue)).map(action => (
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
      ) : null}

      {focusModel.groups.length > 0 ? (
        <div className="space-y-3">
          <div className="text-base font-semibold">{dict.today.otherSection}</div>
          <div className="space-y-2">
            {focusModel.groups.map(group => {
              const open = openGoalIds[group.goalId] ?? false
              const expanded = expandedGoalIds[group.goalId] ?? false
              const visible = expanded ? group.items : group.items.slice(0, maxPerGroup)
              const canExpand = group.items.length > maxPerGroup

              return (
                <Collapsible
                  key={group.goalId}
                  open={open}
                  onOpenChange={(nextOpen) => setOpenGoalIds(prev => ({ ...prev, [group.goalId]: nextOpen }))}
                  className="rounded-lg border bg-card/40"
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer group">
                      <div className="flex items-center gap-2 min-w-0">
                        <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-muted-foreground group-hover:text-foreground">
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <div className="min-w-0 font-medium truncate">{group.goalTitle}</div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{group.items.length}</div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3">
                      <div className="grid gap-3">
                        {visible.map(action => (
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
                      {canExpand ? (
                        <div className="pt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => setExpandedGoalIds(prev => ({ ...prev, [group.goalId]: !expanded }))}
                          >
                            {expanded ? dict.today.showLess : dict.today.showMore}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </div>
      ) : null}

      {focusModel.completed.length > 0 ? (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen} className="rounded-lg border bg-card/40">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer group">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-muted-foreground group-hover:text-foreground">
                  {completedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <div className="min-w-0 font-medium truncate">{dict.today.completedSection}</div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">{focusModel.completed.length}</div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-3">
              <div className="grid gap-3">
                {focusModel.completed.map(action => (
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

      <div className="flex justify-center">
        <Button type="button" variant="outline" className="rounded-full" onClick={() => setView('all')}>
          {dict.today.showAll}
        </Button>
      </div>
    </div>
  )
}
