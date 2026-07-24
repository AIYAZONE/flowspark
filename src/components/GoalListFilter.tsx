'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Archive, Calendar, ChevronDown, ChevronRight, Plus, Search, Star, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { toggleGoalStar } from '@/app/(authenticated)/goals/actions'
import { getCategoryLabel } from '@/lib/goalCategories'
import { buildGoalListViewModel, type GoalListViewGoal } from '@/lib/goal-list-view'
import type en from '@/i18n/en.json'

type Dict = typeof en

type GoalCardGoal = GoalListViewGoal & { description?: string | null }

interface GoalListFilterProps {
  initialGoals: GoalCardGoal[]
  dict: Dict
}

function GoalCard({ goal, dict }: { goal: GoalCardGoal; dict: Dict }) {
  const priority = (goal.priority || 'medium') as 'high' | 'medium' | 'low'
  const priorityDot =
    priority === 'high'
      ? 'bg-primary/75'
      : priority === 'low'
        ? 'bg-primary/25'
        : 'bg-primary/45'

  const handleStarClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    await toggleGoalStar(goal.id, !goal.is_starred)
  }

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="h-full rounded-2xl border border-border/45 bg-background/80 px-4 py-3.5 shadow-sm shadow-black/3 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primary/18 hover:bg-background/88 hover:shadow-md hover:shadow-black/6 dark:border-white/8 dark:bg-background/58 dark:hover:bg-background/64">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground line-clamp-1">
              {goal.title}
            </h3>
            {goal.description ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground/88 line-clamp-1">
                {goal.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={goal.is_starred
                ? 'h-7 w-7 rounded-full text-amber-400/95 hover:bg-amber-500/10 hover:text-amber-300'
                : 'h-7 w-7 rounded-full text-muted-foreground/55 hover:bg-muted/30 hover:text-foreground/75'}
              onClick={handleStarClick}
            >
              <Star className={goal.is_starred ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5'} />
            </Button>
            <GoalStatusBadge
              status={goal.status}
              label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
              className="border-border/50 bg-muted/18 px-2 py-0 text-[11px] text-foreground/68 dark:border-white/10 dark:bg-white/4"
            />
          </div>
        </div>

        <div className="mt-3.5 rounded-xl border border-border/35 bg-muted/14 px-3 py-2 dark:border-white/6 dark:bg-white/3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground/88">
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Tag className="h-3 w-3" />
              <span>{getCategoryLabel(dict, goal.category)}</span>
            </div>
            <span className="text-border/85 dark:text-white/14">/</span>
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-foreground/72">
              <span className={`h-1.5 w-1.5 rounded-full ${priorityDot}`} />
              <span>{dict.goals.priority[priority as keyof typeof dict.goals.priority] || priority}</span>
            </div>
            <span className="text-border/85 dark:text-white/14">/</span>
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-muted-foreground/78">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(goal.start_date), 'yyyy-MM-dd')}</span>
              <span className="text-border/70 dark:text-white/16">→</span>
              <span>{format(new Date(goal.end_date), 'yyyy-MM-dd')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function GoalListFilter({ initialGoals, dict }: GoalListFilterProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isArchivedOpen, setIsArchivedOpen] = useState(false)

  const { mainGoals, archivedGoals, totalGoals } = useMemo(
    () =>
      buildGoalListViewModel({
        goals: initialGoals,
        search,
        statusFilter,
      }),
    [initialGoals, search, statusFilter],
  )

  const archivedOpen = statusFilter === 'archived' ? true : isArchivedOpen
  const showEmptyState = totalGoals === 0

  return (
    <div className="space-y-5">
      <div className="sticky top-3 z-10">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm shadow-black/4 backdrop-blur-xl dark:border-white/10 dark:bg-background/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                placeholder={dict.goals.filter.searchPlaceholder}
                className="h-10 rounded-full border-border/60 bg-background/70 pl-10 dark:border-white/10 dark:bg-background/50"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="w-full sm:w-39">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-h-10 rounded-full border-border/60 bg-background/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-background/50">
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
          </div>
        </div>
      </div>

      {showEmptyState ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/55 p-10 text-center shadow-sm shadow-black/3 dark:border-white/10 dark:bg-background/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground/90">{dict.goals.noGoals}</h3>
          <p className="mb-5 mt-2 text-sm leading-relaxed text-muted-foreground">
            {search || statusFilter !== 'all' ? dict.common.tryAdjustFilter : dict.goals.createFirst}
          </p>
          {!search && statusFilter === 'all' ? <AddGoalDialog dict={dict} /> : null}
        </div>
      ) : (
        <div className="space-y-6">
          {mainGoals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mainGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} dict={dict} />
              ))}
            </div>
          ) : null}

          {archivedGoals.length > 0 ? (
            <Collapsible open={archivedOpen} onOpenChange={setIsArchivedOpen} className="space-y-3">
              <CollapsibleTrigger asChild>
                <div className="group flex cursor-pointer items-center gap-2 rounded-2xl px-1 py-1.5 transition-colors hover:bg-background/60 dark:hover:bg-white/5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/30 hover:text-foreground group-hover:bg-muted/35"
                  >
                    {archivedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Archive className="h-4 w-4 text-muted-foreground/85" />
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    {dict.goals.status.archived}
                  </div>
                  <div className="text-xs text-muted-foreground">· {archivedGoals.length}</div>
                  <div className="hidden h-px flex-1 bg-border/50 dark:bg-white/10 sm:block" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {archivedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} dict={dict} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      )}
    </div>
  )
}
