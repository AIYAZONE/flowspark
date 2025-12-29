'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
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
}

interface GoalListFilterProps {
    initialGoals: Goal[]
    dict: Dict
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

export function GoalListFilter({ initialGoals, dict }: GoalListFilterProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')

    const filteredGoals = useMemo(() => {
        let result = [...initialGoals]

        // 1. Filter
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(g =>
                g.title.toLowerCase().includes(q) ||
                g.description?.toLowerCase().includes(q)
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(g => g.status === statusFilter)
        }

        if (priorityFilter !== 'all') {
            result = result.filter(g => (g.priority || 'medium') === priorityFilter)
        }

        if (categoryFilter !== 'all') {
            result = result.filter(g => (g.category || 'other') === categoryFilter)
        }

        // 2. Sort
        // Priority order: high > medium > low
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }

        // Status order: active > completed > abandoned
        const statusOrder: Record<string, number> = { active: 3, completed: 2, abandoned: 1 }

        return result.sort((a, b) => {
            // Level 1: Status (Active first)
            const statusA = statusOrder[a.status] || 0
            const statusB = statusOrder[b.status] || 0
            if (statusA !== statusB) return statusB - statusA

            // Level 2: Priority (High first)
            const priorityA = priorityOrder[a.priority || 'medium'] || 2
            const priorityB = priorityOrder[b.priority || 'medium'] || 2
            if (priorityA !== priorityB) return priorityB - priorityA

            // Level 3: End Date (Urgent first), then Start Date
            if (a.end_date !== b.end_date) {
                return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
            }
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        })
    }, [initialGoals, search, statusFilter, priorityFilter, categoryFilter])

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={dict.goals.filter.searchPlaceholder}
                        className="pl-9 bg-background/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 px-1 -mx-1">
                    <SelectWrapper
                        className="min-w-[120px]"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: 'all', label: dict.goals.filter.allStatus },
                            { value: 'active', label: dict.goals.status.active },
                            { value: 'completed', label: dict.goals.status.completed },
                            { value: 'abandoned', label: dict.goals.status.abandoned },
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

                    <SelectWrapper
                        className="min-w-[120px]"
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        options={[
                            { value: 'all', label: dict.goals.filter.allCategory },
                            { value: 'health', label: dict.goals.category.health },
                            { value: 'career', label: dict.goals.category.career },
                            { value: 'learning', label: dict.goals.category.learning },
                            { value: 'finance', label: dict.goals.category.finance },
                            { value: 'lifestyle', label: dict.goals.category.lifestyle },
                            { value: 'social', label: dict.goals.category.social },
                            { value: 'other', label: dict.goals.category.other },
                        ]}
                    />
                </div>
            </div>

            {/* List */}
            {filteredGoals.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{dict.goals.noGoals}</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {search || statusFilter !== 'all' ? "Try adjusting your filters" : dict.goals.createFirst}
                    </p>
                    {!search && statusFilter === 'all' && (
                        <Link href="/goals/new">
                            <Button>{dict.goals.newGoal}</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredGoals.map((goal) => (
                        <Link key={goal.id} href={`/goals/${goal.id}`} className="block transition-transform hover:scale-[1.02]">
                            <Card className="h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-xl hover:shadow-md transition-all">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold leading-tight line-clamp-1">{goal.title}</CardTitle>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="capitalize px-1.5 py-0.5 rounded-md bg-secondary border border-border/50">
                                                {dict.goals.category[goal.category as keyof typeof dict.goals.category] || goal.category || 'Other'}
                                            </span>
                                            <span className={`capitalize px-1.5 py-0.5 rounded-md border ${goal.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    goal.priority === 'low' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                {dict.goals.priority[goal.priority as keyof typeof dict.goals.priority] || goal.priority || 'Medium'}
                                            </span>
                                        </div>
                                    </div>
                                    <GoalStatusBadge status={goal.status} label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status} />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-4">
                                        {goal.description || dict.common.noDescription}
                                    </p>
                                    <div className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded-md border border-border/30">
                                        {format(new Date(goal.start_date), 'yyyy-MM-dd')} ~ {format(new Date(goal.end_date), 'yyyy-MM-dd')}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}