'use client'

import { Bot, Lightbulb, Plus, Target } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type en from '@/i18n/en.json'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { AddActionDialog } from '@/components/AddActionDialog'
import { QuickCaptureDialog } from '@/components/QuickCaptureDialog'
import { AITodayPlanButton } from '@/components/AITodayPlanButton'
import { Button } from '@/components/ui/button'

type Dict = typeof en

export function DesktopQuickAccess({
  dict,
  activeGoals,
  tz,
  today,
}: {
  dict: Dict
  activeGoals: { id: string; title: string }[]
  tz: string
  today: string
}) {
  const pathname = usePathname()
  const showAddGoalEntry = pathname === '/goals' || pathname.startsWith('/goals/')

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden w-[320px] xl:block">
      <div className="rounded-3xl border border-border/60 bg-background/92 p-4 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">{dict.quickCapture.fabLabel}</div>
            <div className="text-xs text-muted-foreground">Desktop shortcuts</div>
          </div>
          <div className="inline-flex rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary">
            AI + Quick Actions
          </div>
        </div>

        <div className="grid gap-2">
          {showAddGoalEntry ? (
            <AddGoalDialog
              dict={dict}
              trigger={
                <Button type="button" variant="outline" className="w-full justify-start gap-2 rounded-2xl">
                  <Target className="h-4 w-4" />
                  {dict.goals.newGoal}
                </Button>
              }
            />
          ) : null}

          <AddActionDialog
            activeGoals={activeGoals}
            dict={dict}
            tz={tz}
            trigger={
              <Button type="button" variant="outline" className="w-full justify-start gap-2 rounded-2xl">
                <Plus className="h-4 w-4" />
                {dict.quickCapture.addAction}
              </Button>
            }
          />

          <QuickCaptureDialog
            dict={dict}
            trigger={
              <Button type="button" variant="outline" className="w-full justify-start gap-2 rounded-2xl">
                <Lightbulb className="h-4 w-4" />
                {dict.quickCapture.addIdea}
              </Button>
            }
          />

          <AITodayPlanButton
            dict={dict}
            goals={activeGoals}
            defaultDate={today}
            source="today"
            trigger={
              <Button type="button" className="w-full justify-start gap-2 rounded-2xl">
                <Bot className="h-4 w-4" />
                {dict.dashboard.planning.aiPlanBtn}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}
