import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { AddActionDialog } from '@/components/AddActionDialog'
import { TodayActionList } from '@/components/TodayActionList'
import { ensureUpcomingRecurringActions } from '@/app/(authenticated)/dashboard/recurring'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { buildPrimaryPathContext, type MilestoneLike } from '@/lib/path-context'
import {
  getTodayInTZ,
  getUserTimezone,
  shiftDateBucket,
  toLocaleDateStringTZ,
} from '@/lib/time'
import {
  resolveInitialOpenAction,
  resolveInitialPanelMode,
} from '@/lib/today-action-open-state'
import { mergeTargetedActionIntoTodayList } from '@/lib/today-task-list'
import { getCategoryLabel } from '@/lib/goalCategories'
import { EmergentInsights, type StalledGoalInsight, type StaleActionInsight } from '@/components/EmergentInsights'
import { detectStaleActions } from '@/lib/stale-detector'

export default async function TodayPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const dict = await getDictionary()
  const searchParams = await props.searchParams
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const ownerId = user.id
  const tz = await getUserTimezone(supabase, ownerId)
  const today = getTodayInTZ(tz)
  const yesterday = shiftDateBucket(today, -1)
  const localeIsZh = dict.common.locale.startsWith('zh')

  const { data: activeGoals } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('goals')
      .select('id, title, priority, start_date, end_date, success_criteria, stop_criteria, category, actions(id, completed, updated_at)')
      .eq(ownershipColumn, ownerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  })

  await ensureUpcomingRecurringActions({ supabase, userId: ownerId, today })

  // 查询主导路径的里程碑（结构化阶段数据）
  let milestones: MilestoneLike[] = []
  if ((activeGoals || []).length > 0) {
    const primaryGoalId = activeGoals![0].id as string
    const { data: milestonesData } = await supabase
      .from('path_milestones')
      .select('id,title,target_date,sort_order,status,started_at,completed_at')
      .eq('goal_id', primaryGoalId)
      .order('sort_order', { ascending: true })
    if (milestonesData) {
      milestones = milestonesData.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        title: m.title as string,
        target_date: m.target_date as string | null,
        sort_order: (m.sort_order as number) ?? 0,
        status: (m.status as MilestoneLike['status']) || 'pending',
        started_at: m.started_at as string | null,
        completed_at: m.completed_at as string | null,
      }))
    }
  }

  const datePredicate = [
    `and(start_date.lte.${today},end_date.gte.${today})`,
    `and(end_date.lt.${today},completed.eq.false)`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
    `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
  ].join(',')

  const { data: rawActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) => supabase
      .from('actions')
      .select(`
        *,
        action_sub_items (
          id,
          title,
          completed,
          sort_order
        ),
        goals (
          id,
          title,
          status
        )
      `)
      .eq(ownershipColumn, ownerId)
      .eq('archived', false)
      .or(datePredicate)
      .order('completed', { ascending: true })
      .order('priority', { ascending: false }),
  })

  let actions = rawActions?.filter((action) => {
    if (action.goals?.status === 'archived') return false
    if (action.archived) return false

    const isRegular = action.start_date <= today && (action.end_date || action.start_date) >= today
    const isDelayedIncomplete = !action.completed && (action.end_date || action.start_date) < today

    if (isRegular || isDelayedIncomplete) return true

    if (action.completed && action.updated_at) {
      const updatedDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(action.updated_at))

      return updatedDate === today
    }

    return false
  }) || []

  const primaryPathContext = buildPrimaryPathContext({
    locale: localeIsZh ? 'zh' : 'en',
    today,
    goals: (activeGoals || []).map((goal) => ({
      id: goal.id as string,
      title: goal.title as string,
      priority: (goal.priority as string | null | undefined) ?? null,
      start_date: (goal.start_date as string | null | undefined) ?? null,
      end_date: (goal.end_date as string | null | undefined) ?? null,
      success_criteria: (goal.success_criteria as string | null | undefined) ?? null,
      stop_criteria: (goal.stop_criteria as string | null | undefined) ?? null,
      actions: Array.isArray(goal.actions)
        ? goal.actions.map((action) => ({
            id: action.id as string,
            completed: Boolean(action.completed),
          }))
        : [],
    })),
    milestones,
  })

  const actionIdParam = Array.isArray(searchParams?.action) ? searchParams?.action[0] : searchParams?.action
  const rescueActionIdParam = Array.isArray(searchParams?.rescue) ? searchParams?.rescue[0] : searchParams?.rescue
  const initialOpenActionId = resolveInitialOpenAction({
    actionIdParam: typeof actionIdParam === 'string' ? actionIdParam : null,
    rescueParam: typeof rescueActionIdParam === 'string' ? rescueActionIdParam : null,
  })
  const initialPanelMode = resolveInitialPanelMode({
    actionIdParam: typeof actionIdParam === 'string' ? actionIdParam : null,
    rescueParam: typeof rescueActionIdParam === 'string' ? rescueActionIdParam : null,
  })

  if (initialOpenActionId && !actions.some((action) => action.id === initialOpenActionId)) {
    const { data: targetedRows } = await queryWithOwnershipFallback({
      execute: (ownershipColumn) => supabase
        .from('actions')
        .select(`
          *,
          action_sub_items (
            id,
            title,
            completed,
            sort_order
          ),
          goals (
            id,
            title,
            status
          )
        `)
        .eq(ownershipColumn, ownerId)
        .eq('id', initialOpenActionId)
        .limit(1),
    })

    const targetedAction = Array.isArray(targetedRows) ? targetedRows[0] ?? null : null
    if (targetedAction && targetedAction.goals?.status !== 'archived') {
      actions = mergeTargetedActionIntoTodayList({
        actions,
        targetedAction,
        today,
      })
    }
  }

  const incompleteCount = actions.filter((action) => !action.completed).length
  const nextIncompleteActionId = actions.find((action) => !action.completed)?.id ?? null
  const primaryCta = nextIncompleteActionId
    ? {
        href: `/today?action=${nextIncompleteActionId}#today-actions`,
        label: localeIsZh ? '开始第一项' : 'Start first task',
      }
    : {
        href: '#today-actions',
        label: localeIsZh ? '查看清单' : 'View list',
      }

  // Phase 3：确定性涌现洞察（纯日期 / SQL 计算，无 LLM 质量风险）
  const ONE_DAY = 86_400_000
  const nowTs = new Date(today).getTime()
  const weekStart = shiftDateBucket(today, -6)

  const stalledGoals: StalledGoalInsight[] = (activeGoals || [])
    .map((goal) => {
      const updates = (goal.actions || [])
        .map((a) => (a.updated_at ? new Date(a.updated_at).getTime() : null))
        .filter((t): t is number => t !== null)
      const lastUpdate = updates.length ? Math.max(...updates) : null
      const startTs = goal.start_date ? new Date(goal.start_date).getTime() : null
      const refTs = lastUpdate ?? startTs
      if (refTs === null) return null
      const days = Math.floor((nowTs - refTs) / ONE_DAY)
      return days >= 30 ? { id: goal.id as string, title: goal.title as string, days } : null
    })
    .filter((g): g is StalledGoalInsight => g !== null)

  const staleActions: StaleActionInsight[] = actions
    .filter(
      (a) =>
        !a.completed &&
        Boolean(a.end_date || a.start_date) &&
        new Date(a.end_date || a.start_date) < new Date(shiftDateBucket(today, -14))
    )
    .map((a) => {
      const due = a.end_date || a.start_date
      const days = Math.max(1, Math.floor((new Date(today).getTime() - new Date(due).getTime()) / ONE_DAY))
      return { id: a.id, title: a.title, goalId: (a.goal_id as string | null) ?? null, days }
    })

  // 安静领域：有活跃目标、但本周内无任何 action 更新的领域
  const quietAreas: string[] = (() => {
    const weekActivity = new Map<string, boolean>()
    for (const goal of activeGoals || []) {
      const category = (goal.category as string | null) || ''
      if (!category) continue
      const anyThisWeek = (goal.actions || []).some((a) =>
        a.updated_at ? new Date(a.updated_at).toISOString().slice(0, 10) >= weekStart : false
      )
      const prev = weekActivity.get(category)
      weekActivity.set(category, prev === true ? true : anyThisWeek)
    }
    return Array.from(weekActivity.entries())
      .filter(([, active]) => !active)
      .map(([category]) => getCategoryLabel(dict, category))
  })()

  // 救援配置：为驻点 action 提供 reasonTag 和里程碑阶段上下文
  const staleWithRescue = detectStaleActions(
    actions.map((a) => ({
      id: a.id as string,
      title: a.title as string,
      completed: a.completed as boolean | null,
      goal_id: a.goal_id as string | null,
      goal_title: (a as Record<string, unknown>).goal_title as string | null,
      updated_at: a.updated_at as string | null,
      created_at: a.created_at as string | null,
    })),
    today
  )

  const rescueConfig = {
    staleActions: staleWithRescue.staleActions.map((sa) => ({
      id: sa.id,
      title: sa.title,
      goalId: sa.goal_id,
      days: sa.days_since_last_progress,
      reasonTag: sa.reason_tag,
    })),
    milestoneStage: milestones.length > 0 ? {
      currentMilestoneTitle: milestones.find((m) => m.status === 'active')?.title || undefined,
      completedCount: milestones.filter((m) => m.status === 'completed').length,
      totalCount: milestones.length,
      progressText: `${milestones.filter((m) => m.status === 'completed').length}/${milestones.length}`,
    } : null,
  }

  return (
    <div className="space-y-6">
      <div className="md:hidden sticky top-0 z-20 -mx-4 border-b border-white/8 bg-background/75 px-4 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              {dict.today.title}
            </div>
            <div className="mt-1 truncate text-sm font-medium text-foreground">
              {localeIsZh ? `待做 ${incompleteCount} 项` : `${incompleteCount} open`}
            </div>
          </div>
          <a
            href={primaryCta.href}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
          >
            {primaryCta.label}
          </a>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">{dict.today.subtitle}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {toLocaleDateStringTZ(dict.common.locale, tz, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <a
            href={primaryCta.href}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
          >
            {primaryCta.label}
          </a>
          <AddActionDialog activeGoals={activeGoals || []} dict={dict} />
        </div>
      </div>

      <EmergentInsights
        data={{ stalledGoals, staleActions, quietAreas }}
        dict={dict.insights}
        rescueConfig={staleWithRescue.rescueEligible ? rescueConfig : undefined}
      />

      <div id="today-actions">
        <TodayActionList
          actions={actions}
          dict={dict}
          showGoalTitle
          tz={tz}
          today={today}
          goals={activeGoals || []}
          primaryGoalId={primaryPathContext?.goalId ?? null}
          initialOpenActionId={initialOpenActionId}
          initialPanelMode={initialPanelMode}
        />
      </div>
    </div>
  )
}
