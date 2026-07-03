'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, Search, Calendar, Tag, Flag, Star, ChevronDown, ChevronRight, Archive } from 'lucide-react'
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
import { buildCategoryOptions, getCategoryLabel } from '@/lib/goalCategories'
import { buildPrimaryPathContext } from '@/lib/path-context'
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
    const isZh = (dict.common.locale || '').toLowerCase().startsWith('zh')
    const priority = (goal.priority || 'medium') as 'high' | 'medium' | 'low'
    const priorityDot =
        priority === 'high'
            ? 'bg-primary/70'
            : priority === 'low'
                ? 'bg-primary/25'
                : 'bg-primary/45'

    const now = new Date()
    const start = new Date(goal.start_date)
    const end = new Date(goal.end_date)
    const totalRange = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    let timeProgress = totalRange > 0 ? (elapsed / totalRange) * 100 : 0
    timeProgress = Math.max(0, Math.min(100, timeProgress))
    if (goal.status === 'completed') timeProgress = 100
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000))
    const isDimmed = goal.status === 'archived' || goal.status === 'abandoned'

    const handleStarClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        await toggleGoalStar(goal.id, !goal.is_starred)
    }

    return (
        <Link
            href={`/goals/${goal.id}`}
            className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-3xl"
        >
            <div className="relative h-full overflow-hidden rounded-3xl border border-border/60 bg-background/70 p-5 shadow-sm shadow-black/5 backdrop-blur-xl transition-[border-color,box-shadow] duration-200 hover:border-primary/20 hover:shadow-md hover:shadow-black/10 dark:border-white/10 dark:bg-background/55">
                    <div className="absolute right-4 top-4 flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={goal.is_starred
                                ? 'h-8 w-8 rounded-full text-amber-400/95 hover:bg-amber-500/10 hover:text-amber-300'
                                : 'h-8 w-8 rounded-full text-muted-foreground/55 hover:bg-muted/30 hover:text-foreground/80'}
                            onClick={handleStarClick}
                        >
                            <Star className={goal.is_starred ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
                        </Button>
                        <GoalStatusBadge
                            status={goal.status}
                            label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
                            className="border-border/60 bg-muted/30 text-foreground/70 dark:border-white/12 dark:bg-white/3"
                        />
                    </div>

                    <div className="pr-24 mb-4">
                        <h3 className="text-base font-semibold leading-tight tracking-tight text-foreground/90 transition-colors group-hover:text-foreground md:text-lg line-clamp-1">
                            {goal.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                <span className="capitalize">{getCategoryLabel(dict, goal.category)}</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                <span className={`h-1.5 w-1.5 rounded-full ${priorityDot}`} />
                                <span className="capitalize">
                                    {dict.goals.priority[priority as keyof typeof dict.goals.priority] || priority}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="mb-5 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground/90 line-clamp-2">
                        {goal.description || dict.common.noDescription}
                    </p>

                    <div className={`mb-4 space-y-2 ${isDimmed ? 'opacity-75' : ''}`}>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-medium">{isZh ? '时间进度' : 'Time'}</span>
                            <span className="font-mono">{Math.round(timeProgress)}% · D-{daysLeft}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/35 dark:bg-white/8">
                            <div className="h-full rounded-full bg-primary/80" style={{ width: `${Math.round(timeProgress)}%` }} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground dark:border-white/10">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="font-mono">
                            {format(new Date(goal.start_date), 'yyyy-MM-dd')}
                            <span className="mx-1.5 text-border/70 dark:text-white/20">→</span>
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
    const isZh = (dict.common.locale || '').toLowerCase().startsWith('zh')
    const locale = isZh ? 'zh' : 'en'
    const categoryOptions = useMemo(
        () =>
            buildCategoryOptions({
                dict,
                usedCategories: initialGoals.map((g) => g.category),
                includeAll: true,
            }),
        [dict, initialGoals],
    )

    // Collapsible states
    const [isStarredOpen, setIsStarredOpen] = useState(true)
    const [isOtherOpen, setIsOtherOpen] = useState(true)
    const [isArchivedOpen, setIsArchivedOpen] = useState(false)

    const { mainPathGoal, starredGoals, otherGoals, archivedGoals } = useMemo(() => {
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

        const activeGoals = sorted.filter(g => g.status !== 'archived')
        const archived = sorted.filter(g => g.status === 'archived')

        const primaryContext = buildPrimaryPathContext({
            locale,
            today: format(new Date(), 'yyyy-MM-dd'),
            goals: activeGoals,
        })
        const mainPathGoal = primaryContext ? activeGoals.find((g) => g.id === primaryContext.goalId) ?? null : null
        const mainPathGoalId = mainPathGoal?.id

        return {
            mainPathGoal,
            starredGoals: activeGoals.filter(g => g.is_starred && g.id !== mainPathGoalId),
            otherGoals: activeGoals.filter(g => !g.is_starred && g.id !== mainPathGoalId),
            archivedGoals: archived
        }
    }, [initialGoals, search, statusFilter, priorityFilter, categoryFilter, locale])

    const totalGoals = (mainPathGoal ? 1 : 0) + starredGoals.length + otherGoals.length + archivedGoals.length
    const activeCount = useMemo(
        () => initialGoals.filter((g) => g.status !== 'archived').length,
        [initialGoals]
    )
    const starredCount = useMemo(
        () => initialGoals.filter((g) => g.status !== 'archived' && g.is_starred).length,
        [initialGoals]
    )
    const archivedCount = useMemo(
        () => initialGoals.filter((g) => g.status === 'archived').length,
        [initialGoals]
    )

    return (
        <div className="space-y-6">
            <div className="sticky top-3 z-10">
                <div className="rounded-3xl bg-linear-to-r from-primary/10 via-violet-500/5 to-sky-500/8 p-px">
                    <div className="rounded-3xl border border-border/60 bg-background/75 p-3 shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-background/60 sm:p-4">
                        <div className="flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-background/40">
                                <span className="text-muted-foreground">{dict.goals.status.active}</span>
                                <span className="font-mono tabular-nums text-foreground">{activeCount}</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-background/40">
                                <span className="text-muted-foreground">{dict.goals.filter.starredGoals}</span>
                                <span className="font-mono tabular-nums text-foreground">{starredCount}</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground/80 dark:border-white/10 dark:bg-background/40">
                                <span className="text-muted-foreground">{dict.goals.status.archived}</span>
                                <span className="font-mono tabular-nums text-foreground">{archivedCount}</span>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
                                <Input
                                    placeholder={dict.goals.filter.searchPlaceholder}
                                    className="h-10 rounded-full border-border/60 bg-background/60 pl-10 shadow-sm shadow-black/[0.02] hover:border-primary/35 dark:border-white/10 dark:bg-background/40"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                                <div className="w-[140px] sm:w-[156px]">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="min-h-10 rounded-full border-border/60 bg-background/60 px-3 py-2 text-sm shadow-sm shadow-black/[0.02] hover:border-primary/35 dark:border-white/10 dark:bg-background/40">
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

                                <div className="w-[140px] sm:w-[156px]">
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="min-h-10 rounded-full border-border/60 bg-background/60 px-3 py-2 text-sm shadow-sm shadow-black/[0.02] hover:border-primary/35 dark:border-white/10 dark:bg-background/40">
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

                                <div className="w-[140px] sm:w-[156px]">
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="min-h-10 rounded-full border-border/60 bg-background/60 px-3 py-2 text-sm shadow-sm shadow-black/[0.02] hover:border-primary/35 dark:border-white/10 dark:bg-background/40">
                                            <SelectValue placeholder={dict.goals.category.label} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            {totalGoals === 0 ? (
                <div className="rounded-3xl bg-linear-to-br from-primary/10 via-violet-500/5 to-sky-500/10 p-px">
                    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-border/60 bg-background/75 p-10 text-center shadow-sm shadow-black/5 backdrop-blur-xl animate-in fade-in-50 dark:border-white/10 dark:bg-background/60">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/15 bg-primary/5 dark:border-white/10 dark:bg-white/3">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-foreground/90">{dict.goals.noGoals}</h3>
                        <p className="mb-5 mt-2 max-w-md text-sm leading-relaxed text-muted-foreground/90">
                            {search || statusFilter !== 'all' ? dict.common.tryAdjustFilter : dict.goals.createFirst}
                        </p>
                        {!search && statusFilter === 'all' ? (
                            <AddGoalDialog dict={dict} />
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {mainPathGoal ? (
                        <div className="rounded-2xl bg-linear-to-r from-primary/12 via-violet-500/6 to-sky-500/10 p-px">
                            <div className="rounded-2xl border border-border/60 bg-card/95 p-4 dark:border-white/10 dark:bg-background/60 sm:p-5">
                                <div className="flex items-center gap-2">
                                    <Flag className="h-4 w-4 text-primary/70" />
                                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                        {isZh ? '主线路径' : 'Main Path'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">· {isZh ? '系统判定' : 'System'}</div>
                                    <div className="hidden sm:block h-px flex-1 bg-border/50 dark:bg-white/10" />
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
                                    <div className="md:col-span-2">
                                        <GoalCard key={mainPathGoal.id} goal={mainPathGoal} dict={dict} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Starred Goals Section */}
                    {starredGoals.length > 0 && (
                        <Collapsible open={isStarredOpen} onOpenChange={setIsStarredOpen} className="space-y-4">
                            <CollapsibleTrigger asChild>
                                <div className="group flex items-center gap-2 rounded-2xl px-1 py-1.5 transition-colors cursor-pointer hover:bg-background/60 dark:hover:bg-white/5">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/30 hover:text-foreground group-hover:bg-muted/35">
                                        {isStarredOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                    <Star className="h-4 w-4 text-amber-400/95 fill-current" />
                                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                        {dict.goals.filter.starredGoals}
                                    </div>
                                    <div className="text-xs text-muted-foreground">· {starredGoals.length}</div>
                                    <div className="hidden sm:block h-px flex-1 bg-border/50 dark:bg-white/10" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 animate-in fade-in-50 slide-in-from-top-2">
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
                            <CollapsibleTrigger asChild>
                                <div className="group flex items-center gap-2 rounded-2xl px-1 py-1.5 transition-colors cursor-pointer hover:bg-background/60 dark:hover:bg-white/5">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/30 hover:text-foreground group-hover:bg-muted/35">
                                        {isOtherOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                    <Flag className="h-4 w-4 text-muted-foreground/90" />
                                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                        {starredGoals.length > 0 ? dict.goals.filter.otherGoals : dict.goals.filter.allGoals}
                                    </div>
                                    <div className="text-xs text-muted-foreground">· {otherGoals.length}</div>
                                    <div className="hidden sm:block h-px flex-1 bg-border/50 dark:bg-white/10" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 animate-in fade-in-50 slide-in-from-top-2">
                                    {otherGoals.map((goal) => (
                                        <GoalCard key={goal.id} goal={goal} dict={dict} />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}

                    {/* Archived Goals Section */}
                    {archivedGoals.length > 0 && (
                        <Collapsible open={isArchivedOpen} onOpenChange={setIsArchivedOpen} className="space-y-4">
                            <CollapsibleTrigger asChild>
                                <div className="group flex items-center gap-2 rounded-2xl px-1 py-1.5 transition-colors cursor-pointer hover:bg-background/60 dark:hover:bg-white/5">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/30 hover:text-foreground group-hover:bg-muted/35">
                                        {isArchivedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                    <Archive className="h-4 w-4 text-muted-foreground/85" />
                                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                        {dict.goals.status.archived}
                                    </div>
                                    <div className="text-xs text-muted-foreground">· {archivedGoals.length}</div>
                                    <div className="hidden sm:block h-px flex-1 bg-border/50 dark:bg-white/10" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 animate-in fade-in-50 slide-in-from-top-2">
                                    {archivedGoals.map((goal) => (
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
