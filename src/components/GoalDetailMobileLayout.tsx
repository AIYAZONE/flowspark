'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Info, ListChecks } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { GoalQuickSwitch } from '@/components/GoalQuickSwitch'
import { GoalSubItemsTabs, type GoalEntry } from '@/components/GoalSubItemsTabs'
import type en from '@/i18n/en.json'

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
}

type TabKey = 'actions' | 'details'

interface GoalDetailMobileLayoutProps {
    goal: Goal
    actions: Action[]
	entries: GoalEntry[]
    dict: Dict
    initialTab?: TabKey
    goalsForEdit?: { id: string, title: string }[]
    goalsForSwitch?: { id: string, title: string }[]
	shareInfo?: { token: string | null; expiresAt: string | null }
	tzDefaults: { startDefault: string; endDefault: string }
}

export function GoalDetailMobileLayout({ goal, actions, entries, dict, initialTab = 'actions', goalsForEdit, goalsForSwitch, shareInfo, tzDefaults }: GoalDetailMobileLayoutProps) {
    const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

    const { totalActions, completedActions } = useMemo(() => {
        const total = actions.length
        const completed = actions.reduce((acc, a) => acc + (a.completed ? 1 : 0), 0)
        return { totalActions: total, completedActions: completed }
    }, [actions])

    const dateRangeText = useMemo(() => {
        try {
            const start = format(new Date(goal.start_date), dict.goals.detail.dateFormat)
            const end = format(new Date(goal.end_date), dict.goals.detail.dateFormat)
            return `${start} - ${end}`
        } catch {
            return ''
        }
    }, [dict.goals.detail.dateFormat, goal.end_date, goal.start_date])

    const statusLabel = dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status

    return (
        <div className="space-y-4 lg:hidden">
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-background/70 to-background/90 backdrop-blur-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-foreground">{goal.title}</div>
                        <div className="flex items-center gap-2">
                            <div className="scale-90 origin-left">
                                <GoalStatusBadge status={goal.status} label={statusLabel} />
                            </div>
                            <span className="inline-flex items-center rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
                                {completedActions}/{totalActions} {dict.goals.detail.actions}
                            </span>
                        </div>
                        {dateRangeText ? (
                            <div className="mt-1 text-xs text-muted-foreground/80 font-mono">
                                {dateRangeText}
                            </div>
                        ) : null}
                    </div>
                </div>

                <GoalQuickSwitch
                    currentGoalId={goal.id}
                    goals={goalsForSwitch || goalsForEdit || []}
                    dict={dict}
                    className="h-9 rounded-full bg-background/70"
                />

                <div className="grid grid-cols-2 gap-2 rounded-full border border-border/40 bg-background/40 p-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`rounded-full h-9 ${activeTab === 'actions' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('actions')}
                    >
                        <ListChecks className="h-4 w-4 mr-1" />
                        {dict.goals.detail.actions}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`rounded-full h-9 ${activeTab === 'details' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        <Info className="h-4 w-4 mr-1" />
                        {dict.goals.detail.details}
                    </Button>
                </div>
            </div>

            {activeTab === 'actions' ? (
                <div className="rounded-2xl border border-border/40 bg-background/50 backdrop-blur-xl p-4 space-y-4">
					<GoalSubItemsTabs
						goalId={goal.id}
						actions={actions}
						entries={entries}
						dict={dict}
						goalsForEdit={goalsForEdit}
						tzDefaults={tzDefaults}
					/>
                </div>
            ) : (
                <GoalDetailsCard
					goal={goal}
					dict={dict}
					initialShareToken={shareInfo?.token || null}
					initialShareExpiresAt={shareInfo?.expiresAt || null}
				/>
            )}
        </div>
    )
}
