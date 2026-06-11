'use client'

import { useSyncExternalStore } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import type en from '@/i18n/en.json'
import type { GoalEntry } from '@/components/goal-entry.types'
import { Button } from '@/components/ui/button'
import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { GoalDetailMobileLayout } from '@/components/GoalDetailMobileLayout'
import { GoalQuickSwitch } from '@/components/GoalQuickSwitch'
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-primary/10 hover:text-primary active:bg-primary/10 active:text-primary transition-all duration-300"
          >
            <Link href="/goals">
              <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{dict.common.back}</span>
            </Link>
          </Button>
          <h1 className="hidden text-2xl font-bold tracking-tight lg:block">{goal.title}</h1>
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

