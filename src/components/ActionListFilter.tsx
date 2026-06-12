'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetFormContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ActionItem } from '@/components/ActionItem'
import {
    applyDraftActionFilters,
    countActiveActionFilters,
    createActionFilterUiState,
    resetDraftActionFilters,
    syncDraftFromApplied,
    updateAppliedActionFilters,
    updateDraftActionFilters,
} from '@/components/action-list-filter-state'
import type en from '@/i18n/en.json'

type Dict = typeof en

interface Action {
    id: string
    title: string
    description?: string
    created_at?: string | null
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

interface ActionListFilterProps {
    initialActions: Action[]
    dict: Dict
    showGoalTitle?: boolean
    tz?: string
    goals?: { id: string, title: string }[]
    hideGoalFilter?: boolean
    goalsForEdit?: { id: string, title: string }[]
}

const NEW_WINDOW_MS = 5 * 60 * 1000

function isRecentlyCreated(action: Action): boolean {
    if (action.completed) return false
    if (!action.created_at) return false
    const createdAtMs = new Date(action.created_at).getTime()
    if (!Number.isFinite(createdAtMs)) return false
    return Date.now() - createdAtMs <= NEW_WINDOW_MS
}

export function ActionListFilter({ initialActions, dict, showGoalTitle = false, tz = 'Asia/Shanghai', goals = [], hideGoalFilter = false, goalsForEdit }: ActionListFilterProps) {
    const [search, setSearch] = useState('')
    const [filterState, setFilterState] = useState(() => createActionFilterUiState())
    const [filterSheetOpen, setFilterSheetOpen] = useState(false)
    const { applied: appliedFilters, draft: draftFilters } = filterState

    const activeFilterCount = useMemo(() => {
        return countActiveActionFilters(appliedFilters, hideGoalFilter)
    }, [appliedFilters, hideGoalFilter])

    function openFilterSheet() {
        setFilterState((currentState) => syncDraftFromApplied(currentState))
        setFilterSheetOpen(true)
    }

    function handleFilterSheetOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            setFilterState((currentState) => syncDraftFromApplied(currentState))
        }
        setFilterSheetOpen(nextOpen)
    }

    function updateDesktopFilters(patch: Partial<typeof appliedFilters>) {
        setFilterState((currentState) => updateAppliedActionFilters(currentState, patch))
    }

    function updateMobileDraftFilters(patch: Partial<typeof draftFilters>) {
        setFilterState((currentState) => updateDraftActionFilters(currentState, patch))
    }

    function resetMobileDraftFilters() {
        setFilterState((currentState) => resetDraftActionFilters(currentState))
    }

    function applyMobileFilters() {
        setFilterState((currentState) => applyDraftActionFilters(currentState))
        setFilterSheetOpen(false)
    }

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

        if (appliedFilters.statusFilter !== 'all') {
            const isCompleted = appliedFilters.statusFilter === 'completed'
            result = result.filter(a => a.completed === isCompleted)
        }

        if (appliedFilters.typeFilter !== 'all') {
            result = result.filter(a => a.type === appliedFilters.typeFilter)
        }

        if (appliedFilters.priorityFilter !== 'all') {
            result = result.filter(a => (a.priority || 'medium') === appliedFilters.priorityFilter)
        }

        if (appliedFilters.goalFilter !== 'all') {
            result = result.filter(a => a.goal_id === appliedFilters.goalFilter)
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
    }, [appliedFilters, initialActions, search])

    return (
        <div className="space-y-4 md:space-y-6 overflow-x-hidden">
            {/* Filters */}
            <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center gap-2 w-full">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={dict.goals.filter.searchActionsPlaceholder}
                            className="pl-9 bg-background/50 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Sheet open={filterSheetOpen} onOpenChange={handleFilterSheetOpenChange}>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="md:hidden shrink-0 h-9 rounded-full bg-background/50"
                            onClick={openFilterSheet}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {activeFilterCount > 0 ? (
                                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                                    {activeFilterCount}
                                </span>
                            ) : null}
                        </Button>

                        <SheetFormContent side="bottom" className="rounded-t-2xl">
                            <div className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                                <SheetHeader className="flex flex-row items-center justify-between space-y-0">
                                    <SheetTitle className="text-base">{dict.common.filters}</SheetTitle>
                                    <SheetClose asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </SheetClose>
                                </SheetHeader>

                                <div className="mt-4 space-y-3">
                                    {!hideGoalFilter && (
                                        <div className="min-w-0 w-full">
                                            <Select value={draftFilters.goalFilter} onValueChange={(value) => updateMobileDraftFilters({ goalFilter: value })}>
                                                <SelectTrigger className="bg-background/50 h-10 text-sm px-3 w-full">
                                                    <SelectValue placeholder={dict.goals.filter.filterByGoal} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{dict.goals.filter.allGoals}</SelectItem>
                                                    {goals.map(g => (
                                                        <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="min-w-0 w-full">
                                            <Select value={draftFilters.statusFilter} onValueChange={(value) => updateMobileDraftFilters({ statusFilter: value })}>
                                                <SelectTrigger className="bg-background/50 h-10 text-sm px-3 w-full">
                                                    <SelectValue placeholder={dict.goals.status.label} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{dict.goals.filter.allStatus}</SelectItem>
                                                    <SelectItem value="incomplete">{dict.goals.filter.incomplete}</SelectItem>
                                                    <SelectItem value="completed">{dict.goals.filter.completed}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="min-w-0 w-full">
                                            <Select value={draftFilters.typeFilter} onValueChange={(value) => updateMobileDraftFilters({ typeFilter: value })}>
                                                <SelectTrigger className="bg-background/50 h-10 text-sm px-3 w-full">
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
                                    </div>

                                    <div className="min-w-0 w-full">
                                        <Select value={draftFilters.priorityFilter} onValueChange={(value) => updateMobileDraftFilters({ priorityFilter: value })}>
                                            <SelectTrigger className="bg-background/50 h-10 text-sm px-3 w-full">
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

                                    <div className="pt-2 flex items-center justify-between">
                                        <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={resetMobileDraftFilters}>
                                            {dict.common.reset}
                                        </Button>
                                        <Button type="button" size="sm" className="rounded-full" onClick={applyMobileFilters}>
                                            {dict.common.done}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </SheetFormContent>
                    </Sheet>
                </div>

                <div className="hidden md:flex md:flex-wrap md:gap-2">
                    {!hideGoalFilter && (
                        <div className="min-w-0 w-full md:w-[180px]">
                            <Select value={appliedFilters.goalFilter} onValueChange={(value) => updateDesktopFilters({ goalFilter: value })}>
                                <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5 w-full">
                                    <SelectValue placeholder={dict.goals.filter.filterByGoal} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{dict.goals.filter.allGoals}</SelectItem>
                                    {goals.map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="min-w-0 w-full md:w-[160px]">
                        <Select value={appliedFilters.statusFilter} onValueChange={(value) => updateDesktopFilters({ statusFilter: value })}>
                            <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5 w-full">
                                <SelectValue placeholder={dict.goals.status.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{dict.goals.filter.allStatus}</SelectItem>
                                <SelectItem value="incomplete">{dict.goals.filter.incomplete}</SelectItem>
                                <SelectItem value="completed">{dict.goals.filter.completed}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="min-w-0 w-full md:w-[160px]">
                        <Select value={appliedFilters.typeFilter} onValueChange={(value) => updateDesktopFilters({ typeFilter: value })}>
                            <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5 w-full">
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

                    <div className="min-w-0 w-full md:w-[160px]">
                        <Select value={appliedFilters.priorityFilter} onValueChange={(value) => updateDesktopFilters({ priorityFilter: value })}>
                            <SelectTrigger className="bg-background/50 h-9 text-sm px-2.5 w-full">
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
                            goals={goalsForEdit}
                            isNew={isRecentlyCreated(action)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
