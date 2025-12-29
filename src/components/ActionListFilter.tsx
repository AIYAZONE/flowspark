'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
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

function SelectWrapper({ value, onChange, options, className }: { 
    value: string
    onChange: (val: string) => void
    options: { value: string, label: string }[]
    className?: string 
}) {
    return (
        <div className={`relative ${className}`}>
            <select
                className="h-10 w-full appearance-none rounded-md border border-input bg-background/50 pl-3 pr-8 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 opacity-50 pointer-events-none" />
        </div>
    )
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

            // Date (Earlier first)
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        })
    }, [initialActions, search, statusFilter, typeFilter, priorityFilter])

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={dict.goals.filter.searchActionsPlaceholder}
                        className="pl-9 bg-background/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap md:flex-nowrap pb-2 md:pb-0 px-1">
                    <SelectWrapper
                        className="min-w-[120px]"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: 'all', label: dict.goals.filter.allStatus },
                            { value: 'incomplete', label: dict.goals.filter.incomplete },
                            { value: 'completed', label: dict.goals.filter.completed },
                        ]}
                    />

                    <SelectWrapper
                        className="min-w-[120px]"
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            { value: 'all', label: dict.goals.filter.allType },
                            { value: 'core', label: dict.today.types.core },
                            { value: 'maintenance', label: dict.today.types.maintenance },
                            { value: 'learning', label: dict.today.types.learning },
                            { value: 'review', label: dict.today.types.review },
                            { value: 'rest', label: dict.today.types.rest },
                        ]}
                    />

                    <SelectWrapper
                        className="min-w-[120px]"
                        value={priorityFilter}
                        onChange={setPriorityFilter}
                        options={[
                            { value: 'all', label: dict.goals.filter.allPriority },
                            { value: 'high', label: dict.goals.priority.high },
                            { value: 'medium', label: dict.goals.priority.medium },
                            { value: 'low', label: dict.goals.priority.low },
                        ]}
                    />
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
