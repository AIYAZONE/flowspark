'use client'

import { useEffect, useState } from 'react'
import { Bot, Lightbulb, Plus, Target } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type en from '@/i18n/en.json'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { AddActionDialog } from '@/components/AddActionDialog'
import { QuickCaptureDialog } from '@/components/QuickCaptureDialog'
import { AITodayPlanButton } from '@/components/AITodayPlanButton'
import { TABLET_AND_UP_CLASS } from '@/components/responsive-classes'
import { Button } from '@/components/ui/button'

type Dict = typeof en

const DESKTOP_QUICK_ACCESS_OPEN_KEY = 'desktop-quick-access-open-v1'

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
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(DESKTOP_QUICK_ACCESS_OPEN_KEY) === '1'
  })
  const pathname = usePathname()
  const showAddGoalEntry = pathname === '/goals' || pathname.startsWith('/goals/')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DESKTOP_QUICK_ACCESS_OPEN_KEY, open ? '1' : '0')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      {open ? <div className={`fixed inset-0 z-30 ${TABLET_AND_UP_CLASS}`} onClick={() => setOpen(false)} /> : null}
      <div className={`fixed bottom-6 right-6 z-40 ${TABLET_AND_UP_CLASS}`}>
        {open ? (
          <div className="w-[320px] rounded-3xl border border-border/60 bg-background/92 p-4 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{dict.quickCapture.fabLabel}</div>
                <div className="text-xs text-muted-foreground">Quick shortcuts</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary">
                  AI + Quick Actions
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setOpen(false)}>
                  <Plus className="h-4 w-4 rotate-45" />
                </Button>
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
        ) : (
          <Button
            type="button"
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            aria-label={dict.quickCapture.fabLabel}
            onClick={() => setOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    </>
  )
}
