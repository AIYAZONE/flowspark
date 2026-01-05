'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Search, Calendar, Tag, Flag, Star, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { toggleGoalStar } from '@/app/(authenticated)/goals/actions'
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

interface GoalListFilterProps {
    initialGoals: Goal[]
    dict: Dict
}

function GoalCard({ goal, dict }: { goal: Goal, dict: Dict }) {
    const priorityColor = {
        high: 'text-red-500 bg-red-500/10 border-red-500/20',
        medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        low: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    }

    const handleStarClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        await toggleGoalStar(goal.id, !goal.is_starred)
    }

    return (
        <Link href={`/goals/${goal.id}`} className="block group">
            <div className="relative h-full overflow-hidden rounded-xl border border-border/40 bg-card/50 p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1">
                {/* Status Badge */}
                <div className="absolute top-5 right-5 flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 rounded-full hover:bg-yellow-500/10 hover:text-yellow-500 ${goal.is_starred ? 'text-yellow-500' : 'text-muted-foreground/30'}`}
                        onClick={handleStarClick}
                    >
                        <Star className={`h-4 w-4 ${goal.is_starred ? 'fill-current' : ''}`} />
                    </Button>
                    <GoalStatusBadge status={goal.status} label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status} />
                </div>

                {/* Header */}
                <div className="pr-20 mb-4">
                    <h3 className="text-lg font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {goal.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Category */}
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md border border-border/50">
                            <Tag className="h-3 w-3" />
                            <span className="capitalize">
                                {dict.goals.category[goal.category as keyof typeof dict.goals.category] || goal.category || 'Other'}
                            </span>
                        </div>

                        {/* Priority */}
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${priorityColor[goal.priority as keyof typeof priorityColor] || priorityColor.medium}`}>
                            <Flag className="h-3 w-3" />
                            <span className="capitalize">
                                {dict.goals.priority[goal.priority as keyof typeof dict.goals.priority] || goal.priority || 'Medium'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground/80 line-clamp-2 min-h-[2.5rem] mb-5 leading-relaxed">
                    {goal.description || dict.common.noDescription}
                </p>

                {/* Footer / Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/40">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="font-mono">
                        {format(new Date(goal.start_date), 'yyyy-MM-dd')}
                        <span className="mx-1.5 text-border">→</span>
                        {format(new Date(goal.end_date), 'yyyy-MM-dd')}
                    </span>
                </div>
            </div>
        </Link>
    )
}

export function GoalListFilter({ initialGoals, dict }: GoalListFilterProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')

    // Collapsible states
    const [isStarredOpen, setIsStarredOpen] = useState(true)
    const [isOtherOpen, setIsOtherOpen] = useState(true)

    const { starredGoals, otherGoals } = useMemo(() => {
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

        // Status order: active > completed > abandoned > archived
        const statusOrder: Record<string, number> = { active: 4, completed: 3, abandoned: 2, archived: 1 }

        const sorted = result.sort((a, b) => {
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

        return {
            starredGoals: sorted.filter(g => g.is_starred),
            otherGoals: sorted.filter(g => !g.is_starred)
        }
    }, [initialGoals, search, statusFilter, priorityFilter, categoryFilter])

    const totalGoals = starredGoals.length + otherGoals.length

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center w-full overflow-hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={dict.goals.filter.searchPlaceholder}
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
                                <SelectItem value="active">{dict.goals.status.active}</SelectItem>
                                <SelectItem value="completed">{dict.goals.status.completed}</SelectItem>
                                <SelectItem value="abandoned">{dict.goals.status.abandoned}</SelectItem>
                                <SelectItem value="archived">{dict.goals.status.archived}</SelectItem>
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

                    <div className="min-w-[90px] flex-1 md:flex-none md:w-[140px] shrink-0">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5">
                                <SelectValue placeholder={dict.goals.category.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{dict.goals.filter.allCategory}</SelectItem>
                                <SelectItem value="health">{dict.goals.category.health}</SelectItem>
                                <SelectItem value="career">{dict.goals.category.career}</SelectItem>
                                <SelectItem value="learning">{dict.goals.category.learning}</SelectItem>
                                <SelectItem value="finance">{dict.goals.category.finance}</SelectItem>
                                <SelectItem value="lifestyle">{dict.goals.category.lifestyle}</SelectItem>
                                <SelectItem value="social">{dict.goals.category.social}</SelectItem>
                                <SelectItem value="other">{dict.goals.category.other}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* List */}
            {totalGoals === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{dict.goals.noGoals}</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {search || statusFilter !== 'all' ? dict.common.tryAdjustFilter : dict.goals.createFirst}
                    </p>
                    {!search && statusFilter === 'all' && (
                        <AddGoalDialog dict={dict} />
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Starred Goals Section */}
                    {starredGoals.length > 0 && (
                        <Collapsible open={isStarredOpen} onOpenChange={setIsStarredOpen} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                                        {isStarredOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </CollapsibleTrigger>
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-yellow-500">
                                    <Star className="h-5 w-5 fill-current" />
                                    {dict.goals.filter.starredGoals}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">({starredGoals.length})</span>
                                </h2>
                            </div>
                            <CollapsibleContent>
                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in-50 slide-in-from-top-2">
                                    {starredGoals.map((goal) => (
                                        <GoalCard key={goal.id} goal={goal} dict={dict} />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}

                    {/* Other Goals Section */}
                    {otherGoals.length > 0 && (
                        <Collapsible open={isOtherOpen} onOpenChange={setIsOtherOpen} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                                        {isOtherOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </CollapsibleTrigger>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Flag className="h-5 w-5" />
                                    {starredGoals.length > 0 ? dict.goals.filter.otherGoals : dict.goals.filter.allGoals}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">({otherGoals.length})</span>
                                </h2>
                            </div>
                            <CollapsibleContent>
                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in-50 slide-in-from-top-2">
                                    {otherGoals.map((goal) => (
                                        <GoalCard key={goal.id} goal={goal} dict={dict} />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            )}
        </div>
    )
}