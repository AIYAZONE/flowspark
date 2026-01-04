'use client'

import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ActionItem } from '@/components/ActionItem'
import type en from '@/i18n/en.json'

type Dict = typeof en

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
}

interface ActionListFilterProps {
    initialActions: Action[]
    dict: Dict
    showGoalTitle?: boolean
    tz?: string
}

export function ActionListFilter({ initialActions, dict, showGoalTitle = false, tz = 'Asia/Shanghai' }: ActionListFilterProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('incomplete')
    const [typeFilter, setTypeFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')

    const filteredActions = useMemo(() => {
        let result = [...initialActions]

        // 1. Filter
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.description?.toLowerCase().includes(q)
            )
        }

        if (statusFilter !== 'all') {
            const isCompleted = statusFilter === 'completed'
            result = result.filter(a => a.completed === isCompleted)
        }

        if (typeFilter !== 'all') {
            result = result.filter(a => a.type === typeFilter)
        }

        if (priorityFilter !== 'all') {
            result = result.filter(a => (a.priority || 'medium') === priorityFilter)
        }

        // 2. Sort
        // Priority order: high > medium > low
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }

        return result.sort((a, b) => {
            // Completed items always at bottom if showing all
            if (a.completed !== b.completed) return a.completed ? 1 : -1

            // Priority (High first)
            const priorityA = priorityOrder[a.priority || 'medium'] || 2
            const priorityB = priorityOrder[b.priority || 'medium'] || 2
            if (priorityA !== priorityB) return priorityB - priorityA

            // Date (Latest first for completed, Earliest first for incomplete or general)
            // But requirement says: "Sort by priority desc, then time desc" for completed list.
            // Actually, usually incomplete is earliest first (due soon), completed is latest first (just done).
            // Let's stick to Newest First as requested for "Goal Detail - Completed List".
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        })
    }, [initialActions, search, statusFilter, typeFilter, priorityFilter])

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center w-full overflow-hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={dict.goals.filter.searchActionsPlaceholder}
                        className="pl-9 bg-background/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 px-1 no-scrollbar flex-nowrap md:flex-wrap w-full md:w-auto mask-gradient-right">
                    <div className="min-w-[90px] flex-1 md:flex-none md:w-[140px] shrink-0">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5">
                                <SelectValue placeholder={dict.goals.status.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{dict.goals.filter.allStatus}</SelectItem>
                                <SelectItem value="incomplete">{dict.goals.filter.incomplete}</SelectItem>
                                <SelectItem value="completed">{dict.goals.filter.completed}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="min-w-[90px] flex-1 md:flex-none md:w-[140px] shrink-0">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5">
                                <SelectValue placeholder={dict.today.typeLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{dict.goals.filter.allType}</SelectItem>
                                <SelectItem value="core">{dict.today.types.core}</SelectItem>
                                <SelectItem value="maintenance">{dict.today.types.maintenance}</SelectItem>
                                <SelectItem value="learning">{dict.today.types.learning}</SelectItem>
                                <SelectItem value="review">{dict.today.types.review}</SelectItem>
                                <SelectItem value="rest">{dict.today.types.rest}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="min-w-[90px] flex-1 md:flex-none md:w-[140px] shrink-0">
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5">
                                <SelectValue placeholder={dict.goals.priority.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{dict.goals.filter.allPriority}</SelectItem>
                                <SelectItem value="high">{dict.goals.priority.high}</SelectItem>
                                <SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
                                <SelectItem value="low">{dict.goals.priority.low}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* List */}
            {filteredActions.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{dict.common.noData || "No actions found"}</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {dict.common.tryAdjustFilter || "Try adjusting your filters"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filteredActions.map((action) => (
                        <ActionItem
                            key={action.id}
                            action={action}
                            dict={dict}
                            showGoalTitle={showGoalTitle}
                            tz={tz}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
