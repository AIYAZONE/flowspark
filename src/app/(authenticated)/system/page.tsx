import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { getStreakSnapshot } from '@/lib/streaks'
import { buildPrimaryPathContext } from '@/lib/path-context'
import { resolveTodayMainThreadDecision } from '@/lib/today-main-thread-decision'
import { getTodayMainThreadCopy } from '@/lib/today-main-thread'
import { getTodayPrimaryCta } from '@/lib/today-primary-cta'
import { getUserTimezone, getTodayInTZ, shiftDateBucket } from '@/lib/time'
import { ScoreCard } from '@/components/ScoreCard'
import { StreakCard } from '@/components/StreakCard'
import { GoalProgressList } from '@/components/GoalProgressList'
import { calcCompletionPercent, calcTimeProgressPercent, getPaceStatus } from '@/lib/progress'
import { getDailyQuoteCandidates, DAILY_QUOTE_CANDIDATE_COUNT, QUOTE_TIME_ZONE } from '@/lib/daily-quote'
import { DashboardWelcome } from '@/components/DashboardWelcome'
import { SystemChatEntry } from '@/components/SystemChatEntry'
import { buildSystemChatHref } from '@/lib/system-chat'

type ActionRow = {
  id: string
  title: string
  goal_id: string | null
  completed: boolean | null
  priority: string | null
  type: string | null
  start_date: string | null
  end_date: string | null
  updated_at: string | null
  goals: {
    status: string | null
  }[] | null
}

export default async function SystemPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  const yesterday = shiftDateBucket(today, -1)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  const displayName =
    profile?.name ?? (user.user_metadata?.name as string) ?? user.email?.split('@')[0] ?? 'You'

  const quoteDateISO = getTodayInTZ(QUOTE_TIME_ZONE)
  const dailyQuotes = getDailyQuoteCandidates({
    locale,
    dateISO: quoteDateISO,
    count: DAILY_QUOTE_CANDIDATE_COUNT,
  })

  const { data: activeGoals } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('goals')
        .select('id, title, priority, start_date, end_date, success_criteria, stop_criteria, actions(id, completed)')
        .eq(ownershipColumn, user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
  })

  const { data: rawActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select(`
          id,
          title,
          goal_id,
          completed,
          priority,
          type,
          start_date,
          end_date,
          updated_at,
          goals (
            status
          )
        `)
        .eq(ownershipColumn, user.id)
        .or(
          [
            `and(start_date.lte.${today},end_date.gte.${today})`,
            `and(end_date.lt.${today},completed.eq.false)`,
            `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
            `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
            `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
          ].join(',')
        )
        .order('completed', { ascending: true })
        .order('priority', { ascending: false }),
  })

  const actions = ((rawActions || []) as ActionRow[]).filter((action) => {
    if (action.goals?.[0]?.status === 'archived') return false
    const actionDate = action.end_date || action.start_date || today
    if (!action.completed) {
      return actionDate <= today
    }
    if (!action.updated_at) return false
    const updatedDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(action.updated_at))
    return updatedDate === today
  })

  const streakSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone: tz,
    today,
  })
  const hasCompletedToday = streakSnapshot.completedDates.includes(today)
  const showStreakRiskBanner =
    !hasCompletedToday && (streakSnapshot.currentStreak > 0 || Boolean(streakSnapshot.recoverableMissDate))

  const primaryPathContext = buildPrimaryPathContext({
    locale,
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
  })

  const mainThreadDecision = resolveTodayMainThreadDecision({
    today,
    showStreakRiskBanner,
    tomorrowHandoffCandidate: null,
    actions: actions.map((action) => ({
      id: action.id,
      title: action.title,
      goal_id: action.goal_id,
      completed: Boolean(action.completed),
      priority: action.priority,
      type: action.type,
      start_date: action.start_date,
      end_date: action.end_date,
    })),
    primaryPathGoalId: primaryPathContext?.goalId ?? null,
  })

  const streakBannerBody = streakSnapshot.recoverableMissDate
    ? locale === 'zh'
      ? streakSnapshot.shieldBalance > 0
        ? `昨天漏掉了 1 天，你还有 ${streakSnapshot.shieldBalance} 个护盾；先恢复连续，再推进今天。`
        : '昨天已经断掉，但现在没有护盾；今天先做一个最小行动，把系统重新拉起来。'
      : streakSnapshot.shieldBalance > 0
        ? `Yesterday is recoverable. You still have ${streakSnapshot.shieldBalance} shield(s); recover continuity before pushing today.`
        : 'Yesterday was missed and no shield is available. Start with one minimum action today.'
    : locale === 'zh'
      ? `今天不需要再做更多判断，先把这一条推进到发生。`
      : 'No more decisions are needed today. Push this one step into reality first.'

  const mainThread = getTodayMainThreadCopy({
    locale,
    showStreakRiskBanner,
    streakBannerBody,
    hasTomorrowHandoff: false,
    nextActionTitle: mainThreadDecision.mainThreadActionTitle,
  })

  const primaryCta = getTodayPrimaryCta({
    locale,
    showStreakRiskBanner,
    rescueActionId: null,
    tomorrowHandoffTargetActionId: null,
    nextIncompleteActionId: mainThreadDecision.mainThreadActionId,
  })

  const hasActiveGoals = (activeGoals || []).length > 0
  const headerTitle = hasActiveGoals
    ? mainThread.title
    : locale === 'zh'
      ? '系统还没有足够信息来指导你'
      : 'The system does not have enough signal to guide you yet'
  const headerBody = hasActiveGoals
    ? mainThread.body
    : locale === 'zh'
      ? '先定义一条你真正要走的人生路径。系统有了主线，才知道今天应该把你推向哪里。'
      : 'Define one life path first. Once the system has a main path, it can tell where today should move.'
  const heroHref = hasActiveGoals ? primaryCta.href : '/goals'
  const heroLabel = hasActiveGoals
    ? locale === 'zh'
      ? '执行系统安排'
      : 'Execute system plan'
    : locale === 'zh'
      ? '先定义人生路径'
      : 'Define a path'

  const { data: todayScoreRow } = await queryWithOwnershipFallback({
    primary: 'owner_id',
    fallback: 'user_id',
    fallbackOnEmpty: false,
    execute: (ownershipColumn) =>
      supabase
        .from('daily_scores')
        .select('score')
        .eq(ownershipColumn, user.id)
        .eq('score_date', today)
        .maybeSingle(),
  })
  const dailyScore = todayScoreRow?.score ?? null

  const goalProgressList = (activeGoals || [])
    .map((g) => {
      const raw = g as unknown as { actions?: Array<{ completed?: boolean | null }> | null }
      const total = raw.actions?.length || 0
      const completed = raw.actions?.filter((a) => Boolean(a.completed)).length || 0
      const progress = calcCompletionPercent(completed, total)
      const remainingActions = Math.max(total - completed, 0)
      const timeProgress = calcTimeProgressPercent(
        (g.start_date as string | null | undefined) ?? null,
        (g.end_date as string | null | undefined) ?? null
      )
      const paceStatus = total <= 0 || timeProgress == null ? null : getPaceStatus(progress, timeProgress)

      return {
        id: g.id as string,
        title: g.title as string,
        totalActions: total,
        completedActions: completed,
        remainingActions,
        progress,
        paceStatus,
        priority: (g.priority as string | null | undefined) ?? 'medium',
        end_date: (g.end_date as string | undefined) ?? undefined,
        start_date: (g.start_date as string | undefined) ?? '',
      }
    })
    .sort((a, b) => {
      const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const pA = pMap[a.priority] || 2
      const pB = pMap[b.priority] || 2
      if (pA !== pB) return pB - pA

      if (a.end_date !== b.end_date) {
        if (!a.end_date) return 1
        if (!b.end_date) return -1
        return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      }

      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-primary/15 bg-linear-to-br from-primary/10 via-background to-background p-6 shadow-sm md:p-7">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/80">
          {locale === 'zh' ? 'SYSTEM' : 'SYSTEM'}
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          {headerTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          {headerBody}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={heroHref}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
          >
            {heroLabel}
          </a>
          <a
            href="/today?view=focus#today-actions"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border/60 bg-background/85 px-5 text-sm font-medium hover:border-primary/35 hover:bg-primary/5"
          >
            {locale === 'zh' ? '进入专注模式' : 'Enter focus mode'}
          </a>
          <a
            href="/profile?tab=incentives"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border/60 bg-background/85 px-5 text-sm font-medium hover:border-primary/35 hover:bg-primary/5"
          >
            {locale === 'zh' ? '查看系统激励与自我画像' : 'See incentives & self model'}
          </a>
        </div>
      </section>

      <SystemChatEntry
        eyebrow={locale === 'zh' ? '系统对话' : 'System Chat'}
        title={locale === 'zh' ? '真正的系统对话现在在独立页面里' : 'The real system conversation now lives on a dedicated page'}
        body={locale === 'zh'
          ? '这里保留系统总览、入口和调度信息。真正的输入与回答已经收拢到同一个对话页里，不再上下分离。'
          : 'This page keeps the system overview and routing layer. Actual input and replies are now unified inside a single chat page.'}
        ctaLabel={locale === 'zh' ? '进入系统对话' : 'Open system chat'}
        href={buildSystemChatHref({ source: 'system' })}
      />

      <div className="rounded-2xl border border-border/40 bg-linear-to-br from-primary/5 via-background/80 to-background p-4 shadow-sm md:p-5">
        <DashboardWelcome
          dict={dict.dashboard.welcome}
          name={displayName}
          dailyQuotes={dailyQuotes}
          defaultQuoteIndex={0}
          quoteDateISO={quoteDateISO}
          locale={locale}
          avatarUrl={profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? null}
        />
      </div>

      {hasActiveGoals ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StreakCard
              dict={dict}
              streak={streakSnapshot.currentStreak}
              todayCompleted={streakSnapshot.completedToday}
              shieldBalance={streakSnapshot.shieldBalance}
              recoverableMissDate={streakSnapshot.recoverableMissDate}
              nextGrantAtStreak={streakSnapshot.nextShieldGrantRule.nextGrantAtStreak}
            />
          </div>
          <ScoreCard dict={dict} today={today} recent7={[]} currentScore={dailyScore} className="h-full" />
        </section>
      ) : null}

      {hasActiveGoals ? (
        <GoalProgressList dict={dict} goals={goalProgressList} />
      ) : null}
    </div>
  )
}
