'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import type en from '@/i18n/en.json'
import type { GoalEntry } from '@/components/goal-entry.types'
import { Button } from '@/components/ui/button'
import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { GoalDetailMobileLayout } from '@/components/GoalDetailMobileLayout'
import { GoalQuickSwitch } from '@/components/GoalQuickSwitch'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import { GoalSubItemsTabs } from '@/components/GoalSubItemsTabs'
import { DESKTOP_AND_UP_MEDIA_QUERY } from '@/components/responsive-classes'

type Dict = typeof en

interface Goal {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  success_criteria: string
  stop_criteria: string
  status: string
  priority?: string
  category?: string
  is_starred?: boolean
}

interface Action {
  id: string
  title: string
  description?: string
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

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {}
      const media = window.matchMedia(query)
      const handler = () => callback()

      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', handler)
        return () => media.removeEventListener('change', handler)
      }

      media.addListener(handler)
      return () => media.removeListener(handler)
    },
    () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false),
    () => false
  )
}

export function GoalDetailResponsiveLayout({
  goal,
  actions,
  entries,
  dict,
  activeGoals,
  shareInfo,
  tzDefaults
}: {
  goal: Goal
  actions: Action[]
  entries: GoalEntry[]
  dict: Dict
  activeGoals: Array<{ id: string; title: string }>
  shareInfo: { token: string | null; expiresAt: string | null }
  tzDefaults: { startDefault: string; endDefault: string }
}) {
  const isDesktop = useMediaQuery(DESKTOP_AND_UP_MEDIA_QUERY)
  const completedActions = useMemo(
    () => actions.reduce((count, action) => count + (action.completed ? 1 : 0), 0),
    [actions]
  )
  const statusLabel = dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status
  const dateRangeText = useMemo(() => {
    try {
      const start = format(new Date(goal.start_date), dict.goals.detail.dateFormat)
      const end = format(new Date(goal.end_date), dict.goals.detail.dateFormat)
      return `${start} - ${end}`
    } catch {
      return ''
    }
  }, [dict.goals.detail.dateFormat, goal.end_date, goal.start_date])

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 lg:flex-1 lg:gap-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 rounded-full border-border/60 bg-background/80 px-3 text-muted-foreground shadow-none hover:bg-muted/40 hover:text-foreground"
          >
            <Link href="/goals">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">{dict.common.back}</span>
            </Link>
          </Button>
          {isDesktop ? (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{goal.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="origin-left scale-95">
                  <GoalStatusBadge status={goal.status} label={statusLabel} />
                </div>
                <div className="rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm text-muted-foreground">
                  {completedActions}/{actions.length} {dict.goals.detail.actions}
                </div>
                {dateRangeText ? (
                  <div className="rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm text-muted-foreground">
                    {dateRangeText}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="hidden lg:block lg:w-[280px]">
          <GoalQuickSwitch currentGoalId={goal.id} goals={activeGoals} dict={dict} />
        </div>
      </div>

      {isDesktop ? (
        <GoalSubItemsTabs
          goalId={goal.id}
          actions={actions}
          entries={entries}
          dict={dict}
          goalsForEdit={activeGoals}
          tzDefaults={tzDefaults}
          includeDetails={true}
          actionsLabel={dict.goals.detail.actions}
          detailsContent={
            <GoalDetailsCard
              goal={goal}
              dict={dict}
              initialShareToken={shareInfo.token}
              initialShareExpiresAt={shareInfo.expiresAt}
            />
          }
        />
      ) : (
        <GoalDetailMobileLayout
          goal={goal}
          actions={actions}
          entries={entries}
          dict={dict}
          goalsForEdit={activeGoals}
          goalsForSwitch={activeGoals}
          shareInfo={shareInfo}
          tzDefaults={tzDefaults}
        />
      )}
    </div>
  )
}
