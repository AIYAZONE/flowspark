import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { AddActionDialog } from '@/components/AddActionDialog'
import { AITodayPlanButton } from '@/components/AITodayPlanButton'
import { getUserTimezone, getTodayInTZ, toLocaleDateStringTZ } from '@/lib/time'
import { TodayActionList } from '@/components/TodayActionList'
import { StreakFeedbackBanner } from '@/components/StreakFeedbackBanner'
import { assignVariant, isEnvEnabled } from '@/lib/experiments'
import { getStreakSnapshot } from '@/lib/streaks'
import { ensureUpcomingRecurringActions } from '@/app/(authenticated)/dashboard/recurring'

export default async function TodayPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const ownerId = user.id
  const todayPlanEnabledEnv =
    process.env.NEXT_PUBLIC_AI_TODAY_PLAN_ENABLED ?? process.env.AI_TODAY_PLAN_ENABLED
  const todayPlanEnabled = todayPlanEnabledEnv ? isEnvEnabled(todayPlanEnabledEnv) : true
  const ab1TodayPlanEnabled = isEnvEnabled(process.env.AI_EXPERIMENT_AB1_TODAY_PLAN)
  const ab1TodayPlanVariant = ab1TodayPlanEnabled ? assignVariant(user.id, 'ab1_today_plan') : null
  const showAIPlan = todayPlanEnabled && (!ab1TodayPlanEnabled || ab1TodayPlanVariant === 'B')

  // Get active goals for the dropdown
  let { data: activeGoals } = await supabase
    .from('goals')
    .select('id, title, priority, start_date, end_date, success_criteria, stop_criteria')
    .eq('user_id', ownerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // owner_id fallback for mixed-schema data
  if (!activeGoals || activeGoals.length === 0) {
    const fallbackGoals = await supabase
      .from('goals')
      .select('id, title, priority, start_date, end_date, success_criteria, stop_criteria')
      .eq('owner_id', ownerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    activeGoals = fallbackGoals.data
  }

  const tz = await getUserTimezone(supabase, user.id)
  // Get today's actions by timezone
  const today = getTodayInTZ(tz)
  await ensureUpcomingRecurringActions({ supabase, userId: ownerId, today })
  // Calculate yesterday to ensure we cover timezones where 'today' starts earlier than UTC
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const datePredicate = [
    `and(start_date.lte.${today},end_date.gte.${today})`,
    `and(end_date.lt.${today},completed.eq.false)`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
    `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
  ].join(',')

  let { data: rawActions } = await supabase
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
    .eq('user_id', ownerId)
    .or(datePredicate)
    .order('completed', { ascending: true })
    .order('priority', { ascending: false })

  // owner_id fallback for mixed-schema data
  if (!rawActions || rawActions.length === 0) {
    const fallbackActions = await supabase
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
      .eq('owner_id', ownerId)
      .or(datePredicate)
      .order('completed', { ascending: true })
      .order('priority', { ascending: false })
    rawActions = fallbackActions.data
  }

  // Filter actions in JS to accurately handle timezone "today"
  const actions = rawActions?.filter(action => {
    if (action.goals?.status === 'archived') return false;
    // If it's a regular active action or incomplete delayed action, keep it
    const isRegular = action.start_date <= today && (action.end_date || action.start_date) >= today;
    const isDelayedIncomplete = !action.completed && (action.end_date || action.start_date) < today;

    if (isRegular || isDelayedIncomplete) return true;

    // For completed delayed actions, strictly check if updated_at is "today" in user's timezone
    if (action.completed && action.updated_at) {
      const updatedDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(action.updated_at));
      return updatedDate === today;
    }

    return false;
  });

  const aiActionContext = (actions || []).map(action => ({
    id: action.id as string,
    title: action.title as string,
    description: (action.description as string | null | undefined) ?? null,
    goal_id: (action.goal_id as string | null | undefined) ?? null,
    goal_title: (action.goals?.title as string | null | undefined) ?? null,
    type: (action.type as string | null | undefined) ?? null,
    priority: (action.priority as string | null | undefined) ?? null,
    completed: Boolean(action.completed),
    start_date: (action.start_date as string | null | undefined) ?? null,
    end_date: (action.end_date as string | null | undefined) ?? null,
  }))
  const streakSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone: tz,
    today,
  })
  const hasCompletedToday = streakSnapshot.completedDates.includes(today)
  const showStreakRiskBanner = !hasCompletedToday && (streakSnapshot.currentStreak > 0 || Boolean(streakSnapshot.recoverableMissDate))
  const streakBannerTitle = streakSnapshot.recoverableMissDate
    ? (dict.common.locale.startsWith('zh') ? '先恢复昨天，再完成今天' : 'Recover yesterday, then finish today')
    : (dict.common.locale.startsWith('zh') ? '先做 5 分钟版本，保住连续性' : 'Start with a 5-minute version to protect your streak')
  const streakBannerBody = streakSnapshot.recoverableMissDate
    ? (
      streakSnapshot.shieldBalance > 0
        ? (dict.common.locale.startsWith('zh')
          ? `昨天漏掉了 1 天，你还有 ${streakSnapshot.shieldBalance} 个护盾可补回；处理完后再推进今天。`
          : `Yesterday is recoverable. You still have ${streakSnapshot.shieldBalance} shield(s); recover it first, then move today forward.`)
        : (dict.common.locale.startsWith('zh')
          ? '昨天已经断掉，但现在没有护盾；先完成今天的 5 分钟最小行动，重新起步。'
          : 'Yesterday was missed and no shield is available. Restart with a 5-minute minimum action today.'))
    : (dict.common.locale.startsWith('zh')
      ? `你当前已经连续 ${streakSnapshot.currentStreak} 天，今天优先完成一个最小行动即可继续保持。`
      : `You are on a ${streakSnapshot.currentStreak}-day streak. Finish one minimum action today to keep it going.`)

  return (
    <div className="space-y-6">
      <StreakFeedbackBanner dict={dict} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {toLocaleDateStringTZ(dict.common.locale, tz, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="hidden md:block">
          <AddActionDialog activeGoals={activeGoals || []} dict={dict} />
        </div>
      </div>

      <div className="grid gap-6">
        {showStreakRiskBanner ? (
          <div className="rounded-xl border border-orange-200/60 bg-orange-50/80 p-4 dark:border-orange-500/20 dark:bg-orange-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium">{streakBannerTitle}</div>
                <div className="mt-1 text-sm text-muted-foreground">{streakBannerBody}</div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {streakSnapshot.recoverableMissDate ? (
                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs font-medium hover:bg-background"
                  >
                    {dict.common.locale.startsWith('zh') ? '去恢复' : 'Go recover'}
                  </a>
                ) : null}
                <a
                  href="#today-actions"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {dict.common.locale.startsWith('zh') ? '去做最小行动' : 'Do a minimum action'}
                </a>
              </div>
            </div>
          </div>
        ) : null}
        {showAIPlan ? (
          <div className="rounded-xl border border-dashed bg-card/60 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {dict.dashboard.planning.aiPlanTitle}
                </div>
                <div className="text-sm text-muted-foreground">
                  {dict.dashboard.planning.desc.replace('{count}', String(activeGoals?.length || 0))}
                </div>
              </div>
              <AITodayPlanButton
                dict={dict}
                goals={activeGoals || []}
                actions={aiActionContext}
                defaultDate={today}
                ab1TodayPlanVariant={ab1TodayPlanVariant}
                triggerClassName="w-full sm:w-auto"
              />
            </div>
          </div>
        ) : null}
        {/* Actions List with Filter */}
        <div id="today-actions">
          <TodayActionList
            actions={actions || []}
            dict={dict}
            showGoalTitle={true}
            tz={tz}
            today={today}
            goals={activeGoals || []}
          />
        </div>
      </div>
    </div>
  )
}
