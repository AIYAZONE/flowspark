'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { parseISO, format } from 'date-fns'
import {
  Archive,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Circle,
  GraduationCap,
  HeartPulse,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  Briefcase,
  Smile,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { GoalProgress } from '@/components/GoalProgress'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { AreaManageDialog } from '@/components/AreaManageDialog'
import { toggleGoalStar } from '@/app/(authenticated)/goals/actions'
import {
  getAreaDefaultIcon,
  getAreaDefaultOrder,
  getCategoryLabel,
  type AreaMeta,
} from '@/lib/goalCategories'
import { buildGoalListViewModel, type GoalListViewGoal } from '@/lib/goal-list-view'
import type en from '@/i18n/en.json'

type Dict = typeof en

type GoalCardGoal = GoalListViewGoal & { description?: string | null }

const AREA_ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  briefcase: Briefcase,
  'heart-pulse': HeartPulse,
  'trending-up': TrendingUp,
  'graduation-cap': GraduationCap,
  wallet: Wallet,
  smile: Smile,
  users: Users,
  circle: Circle,
}

interface GoalListFilterProps {
  initialGoals: GoalCardGoal[]
  areaMeta: AreaMeta[]
  dict: Dict
}

function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, n))
}

function GoalCard({ goal, dict }: { goal: GoalCardGoal; dict: Dict }) {
  const priority = (goal.priority || 'medium') as 'high' | 'medium' | 'low'
  const priorityDot =
    priority === 'high'
      ? 'bg-rose-500'
      : priority === 'low'
        ? 'bg-slate-400'
        : 'bg-amber-400'
  const priorityLabel =
    dict.goals.priority[priority as keyof typeof dict.goals.priority] || priority

  const isDone = goal.status === 'completed'
  const progress = goal.progress
  const daysLeft = progress?.daysLeft ?? null
  const displayPercent = isDone ? 100 : (progress?.completionPercent ?? 0)

  const daysText =
    daysLeft == null
      ? null
      : daysLeft < 0
        ? dict.dashboard.goals.overdue
        : dict.dashboard.goals.daysLeft.replace('{days}', String(Math.abs(daysLeft)))

  const handleStarClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    await toggleGoalStar(goal.id, !goal.is_starred)
  }

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card px-4 py-4 transition-all duration-200 ease-out md:px-5 md:py-5',
          isDone
            ? 'border-border/40'
            : 'border-border/45 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/25',
        )}
      >
        <div className="flex items-start gap-2.5">
          <h3
            className={cn(
              'min-w-0 flex-1 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground line-clamp-2',
              isDone && 'text-foreground/65',
            )}
          >
            {goal.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={goal.is_starred
                ? 'h-7 w-7 rounded-full text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                : 'h-7 w-7 rounded-full text-muted-foreground/55 hover:bg-muted/30 hover:text-foreground/75'}
              onClick={handleStarClick}
              aria-label={goal.is_starred ? 'Unstar goal' : 'Star goal'}
            >
              <Star className={goal.is_starred ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5'} />
            </Button>
            <GoalStatusBadge
              status={goal.status}
              label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
              className="border-border/50 bg-muted/18 px-2 py-0 text-[11px] text-foreground/68"
            />
          </div>
        </div>

        {goal.description ? (
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground/88 line-clamp-2">
            {goal.description}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground/88">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span className="font-medium">{getCategoryLabel(dict, goal.category)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className={cn('h-1.5 w-1.5 rounded-full', priorityDot)} />
            <span>{priorityLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground/78">
            <Calendar className="h-3 w-3" />
            <span>{format(parseISO(goal.start_date), 'yyyy-MM-dd')}</span>
            <span className="text-border/70">→</span>
            <span>{format(parseISO(goal.end_date), 'yyyy-MM-dd')}</span>
          </span>
        </div>

        {progress ? (
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                {progress.basis === 'actions'
                  ? `${progress.actionCompleted}/${progress.actionTotal} ${dict.dashboard.goals.actions}`
                  : dict.goals.progress.byTime}
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold tabular-nums',
                  isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground/80',
                )}
              >
                {displayPercent}%
              </span>
            </div>
            <GoalProgress percent={displayPercent} daysLeft={daysLeft} status={goal.status} />
            {daysText ? (
              <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/75">
                <CalendarClock className="h-3 w-3" />
                <span>{daysText}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

type SectionStats = {
  total: number
  active: number
  completed: number
  high: number
  activePct: number
  completedPct: number
  highPct: number
}

function sectionStatsFor(goals: GoalCardGoal[]): SectionStats {
  const total = Math.max(goals.length, 1)
  let active = 0
  let completed = 0
  let high = 0
  for (const g of goals) {
    if (g.status === 'active') active += 1
    if (g.status === 'completed') completed += 1
    if ((g.priority || 'medium') === 'high') high += 1
  }
  return {
    total: goals.length,
    active,
    completed,
    high,
    activePct: clampPercent((active / total) * 100),
    completedPct: clampPercent((completed / total) * 100),
    highPct: clampPercent((high / total) * 100),
  }
}

export function GoalListFilter({ initialGoals, areaMeta, dict }: GoalListFilterProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isArchivedOpen, setIsArchivedOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

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

  const groupedMain = useMemo(() => {
    const map = new Map<string, GoalCardGoal[]>()
    for (const goal of mainGoals) {
      const key = goal.category || 'other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(goal)
    }
    const metaByKey = new Map(areaMeta.map((m) => [m.category_key, m]))
    const sections = Array.from(map.entries()).map(([key, goals]) => {
      const meta = metaByKey.get(key)
      return {
        key,
        label: getCategoryLabel(dict, key),
        iconName: meta?.icon || getAreaDefaultIcon(key),
        order: meta?.sort_order ?? getAreaDefaultOrder(key),
        goals,
      }
    })
    sections.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    return sections
  }, [mainGoals, areaMeta, dict])

  const usedCategories = useMemo(
    () => Array.from(new Set(initialGoals.map((g) => g.category || 'other'))),
    [initialGoals],
  )

  function scrollToSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: true }))
    const el = document.getElementById(`area-section-${key}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const statusActiveLabel = dict.goals.status.active || 'Active'
  const statusCompletedLabel = dict.goals.status.completed || 'Completed'

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border/45 bg-background/85 backdrop-blur-xl sm:-mx-6 lg:-mx-8 2xl:-mx-10 [@media(min-width:1920px)]:-mx-12 [@media(min-width:2560px)]:-mx-14">
        <div className="flex flex-col gap-3 px-4 pt-3 pb-3 sm:px-6 sm:flex-row sm:items-center lg:px-8 2xl:px-10 [@media(min-width:1920px)]:px-12 [@media(min-width:2560px)]:px-14">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
            <Input
              placeholder={dict.goals.filter.searchPlaceholder}
              className="h-10 rounded-full border-border/60 bg-background/70 pl-10 pr-4 shadow-none focus-visible:ring-1 focus-visible:ring-foreground/15"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-h-10 w-full shrink-0 rounded-full border-border/60 bg-background/70 px-3 py-2 text-sm sm:w-[156px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[12rem]">
              <SelectItem value="all">{dict.goals.filter.allStatus}</SelectItem>
              <SelectItem value="active">{dict.goals.status.active}</SelectItem>
              <SelectItem value="completed">{dict.goals.status.completed}</SelectItem>
              <SelectItem value="abandoned">{dict.goals.status.abandoned}</SelectItem>
              <SelectItem value="archived">{dict.goals.status.archived}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showEmptyState ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/55 p-10 text-center shadow-sm dark:border-white/10 dark:bg-background/40">
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
        <div className="space-y-7">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {groupedMain.map((section) => {
              const StripIcon = AREA_ICON_MAP[section.iconName] ?? Circle
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => scrollToSection(section.key)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/50 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                >
                  <StripIcon className="h-3.5 w-3.5 text-muted-foreground/75" />
                  <span className="truncate max-w-36">{section.label}</span>
                  <span className="text-muted-foreground/60">· {section.goals.length}</span>
                </button>
              )
            })}
            <AreaManageDialog
              dict={dict}
              areaMeta={areaMeta}
              usedCategories={usedCategories}
              trigger={
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs text-primary transition-colors hover:bg-primary/10"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>{dict.goals.areas.title}</span>
                </button>
              }
            />
          </div>

          {groupedMain.map((section) => {
            const SectionIcon = AREA_ICON_MAP[section.iconName] ?? Circle
            const stats = sectionStatsFor(section.goals)
            const isOpen = openSections[section.key] ?? true
            const Chevron = isOpen ? ChevronDown : ChevronRight
            return (
              <Collapsible
                key={section.key}
                id={`area-section-${section.key}`}
                open={isOpen}
                onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, [section.key]: open }))}
                className="space-y-3"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="group flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-background/60 dark:hover:bg-white/5"
                  >
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-foreground/65 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
                      <SectionIcon className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold tracking-tight text-foreground line-clamp-1">
                          {section.label}
                        </span>
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted/40 px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                          {stats.total}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground/70">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {statusActiveLabel} {stats.active}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {statusCompletedLabel} {stats.completed}
                        </span>
                      </div>
                    </div>
                    <Chevron className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground" aria-hidden />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:gap-6">
                    {section.goals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} dict={dict} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}

          {archivedGoals.length > 0 ? (
            <Collapsible open={archivedOpen} onOpenChange={setIsArchivedOpen} className="space-y-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group w-full px-1 py-1 text-left transition-colors hover:bg-background/60 dark:hover:bg-white/5"
                >
                  {(() => {
                    const stats = sectionStatsFor(archivedGoals)
                    const Chevron = archivedOpen ? ChevronDown : ChevronRight
                    return (
                      <div className="flex w-full items-center gap-2.5">
                        <div
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-foreground/55 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary"
                          aria-hidden
                        >
                          <Archive className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold tracking-tight text-foreground/88 line-clamp-1">
                              {dict.goals.status.archived}
                            </span>
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted/40 px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                              {stats.total}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground/70">
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {statusActiveLabel} {stats.active}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              {statusCompletedLabel} {stats.completed}
                            </span>
                          </div>
                        </div>
                        <Chevron className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground" aria-hidden />
                      </div>
                    )
                  })()}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:gap-6 opacity-80">
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
