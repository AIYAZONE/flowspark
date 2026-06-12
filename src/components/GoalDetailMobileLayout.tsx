'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Info, ListChecks, Sparkles } from 'lucide-react'

import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { GoalQuickSwitch } from '@/components/GoalQuickSwitch'
import { GoalSubItemsTabs } from '@/components/GoalSubItemsTabs'
import type { GoalEntry } from '@/components/goal-entry.types'
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

type TabKey = 'actions' | 'journey' | 'details'

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

    const { totalActions, completedActions, journeyCount } = useMemo(() => {
        const total = actions.length
        const completed = actions.reduce((acc, a) => acc + (a.completed ? 1 : 0), 0)
        const journeyTotal = entries.filter((entry) => entry.kind === 'journey').length
        return { totalActions: total, completedActions: completed, journeyCount: journeyTotal }
    }, [actions, entries])

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
    const tabs = [
        {
            key: 'actions' as const,
            label: dict.goals.detail.tabActions,
            count: totalActions,
            icon: ListChecks,
        },
        {
            key: 'journey' as const,
            label: dict.goals.detail.tabJourney,
            count: journeyCount,
            icon: Sparkles,
        },
        {
            key: 'details' as const,
            label: dict.goals.detail.details,
            icon: Info,
        },
    ]

    return (
        <div className="space-y-4 lg:hidden">
            <div className="space-y-3">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{goal.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="origin-left scale-95">
                            <GoalStatusBadge status={goal.status} label={statusLabel} />
                        </div>
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
                            {completedActions}/{totalActions} {dict.goals.detail.actions}
                        </span>
                    </div>
                    {dateRangeText ? (
                        <div className="text-xs font-medium text-muted-foreground">{dateRangeText}</div>
                    ) : null}
                </div>

                <GoalQuickSwitch
                    currentGoalId={goal.id}
                    goals={goalsForSwitch || goalsForEdit || []}
                    dict={dict}
                    className="h-10 rounded-xl border-border/60 bg-background/80"
                />
            </div>

            <div className="border-b border-border/60">
                <div className="flex items-center gap-5 overflow-x-auto overflow-y-hidden">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`-mb-px inline-flex h-10 items-center gap-2 border-b-2 px-1 text-sm font-medium whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground'
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span>{tab.label}</span>
                                {typeof tab.count === 'number' ? (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[11px] leading-none ${
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                ) : null}
                            </button>
                        )
                    })}
                </div>
            </div>

			<GoalSubItemsTabs
				goalId={goal.id}
				actions={actions}
				entries={entries}
				dict={dict}
				goalsForEdit={goalsForEdit}
				tzDefaults={tzDefaults}
                includeDetails={true}
                detailsContent={
                    <GoalDetailsCard
						goal={goal}
						dict={dict}
						initialShareToken={shareInfo?.token || null}
						initialShareExpiresAt={shareInfo?.expiresAt || null}
					/>
                }
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
                hideTabBar={true}
			/>
        </div>
    )
}
