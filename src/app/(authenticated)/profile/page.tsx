import { createClient } from '@/lib/supabase/server'
import { getDictionary, getCurrentLocale } from '@/i18n/get-dictionary'
import { updateProfile } from './actions'
import { ProfileCard } from '@/components/ProfileCard'
import { LanguageToggle } from '@/components/LanguageToggle'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserTimezone, getTodayInTZ, shiftDateBucket } from '@/lib/time'
import { getStreakSnapshot } from '@/lib/streaks'
import { UserCalendarFeedCard } from '@/components/UserCalendarFeedCard'
import { getUnreadNotificationCount } from '@/lib/notifications/queries'
import { getRecentRecommendations } from '@/lib/ai/analyticsStore'
import { buildSelfModelCards, summarizeRecommendationSignals } from '@/lib/self-model'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { buildPrimaryPathContext } from '@/lib/path-context'
import { ProfileTabs, type ProfileTabKey } from '@/components/ProfileTabs'
import { WeeklyInsightCard } from '@/components/WeeklyInsightCard'
import { LevelCard } from '@/components/LevelCard'
import { ScoreTrendChart } from '@/components/ScoreTrendChart'
import { FocusDistributionChart } from '@/components/FocusDistributionChart'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import { getOrCreateWeeklyInsight } from '@/lib/ai/insightStore'
import { SystemOverviewCard } from '@/components/SystemOverviewCard'
import { SystemChatEntry } from '@/components/SystemChatEntry'
import { SystemMemorySection } from './SystemMemorySection'
import { getDefaultSystemMemoryPreferences, listSystemMemoryPreferences } from '@/lib/system-memory/preferences'
import { buildSystemChatHref } from '@/lib/system-chat'

function normalizeInitialTab(value: unknown): ProfileTabKey {
  if (value === 'incentives') return 'incentives'
  if (value === 'analytics') return 'analytics'
  if (value === 'settings') return 'settings'
  return 'self'
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()
  const dict = await getDictionary()
  const currentLocale = await getCurrentLocale()
  const resolvedSearchParams = await searchParams

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const tz = await getUserTimezone(supabase, user.id)
  const today = getTodayInTZ(tz)
  const yesterday = shiftDateBucket(today, -1)
  const streakSnapshot = await getStreakSnapshot({
    supabase,
    userId: user.id,
    timeZone: tz,
    today,
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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: calendarFeedData } = await supabase
    .from('calendar_feeds')
    .select('token, expires_at, revoked_at')
    .eq('owner_id', user.id)
    .eq('scope', 'user')
    .is('goal_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const unreadNotifications = await getUnreadNotificationCount({ supabase, userId: user.id })
  const recentRecommendations = await getRecentRecommendations({ supabase, userId: user.id, limit: 24, days: 30 })

  // 无头像时不写入默认图片，交由 UI 首字母头像渲染

  const createdAt = user.created_at ?? null
  const lastSignIn = user.last_sign_in_at ?? null
  const localeIsZh = currentLocale.startsWith('zh')
  const locale = localeIsZh ? 'zh' : 'en'
  const initialTab = normalizeInitialTab(
    Array.isArray(resolvedSearchParams?.tab) ? resolvedSearchParams?.tab[0] : resolvedSearchParams?.tab
  )
  const displayName = profile?.name ?? (user.user_metadata?.name as string) ?? user.email?.split('@')[0] ?? 'You'
  const joinedLabel = createdAt
    ? new Intl.DateTimeFormat(localeIsZh ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
      }).format(new Date(createdAt))
    : (localeIsZh ? '未知' : 'Unknown')
  const recommendationSignals = summarizeRecommendationSignals(recentRecommendations)
  const selfModelCards = buildSelfModelCards({
    locale,
    currentStreak: streakSnapshot.currentStreak,
    completedToday: streakSnapshot.completedToday,
    signals: recommendationSignals,
  })

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

  const weeklyInsight = await getOrCreateWeeklyInsight({
    supabase,
    userId: user.id,
    locale,
  })

  let systemMemoryPreferences = getDefaultSystemMemoryPreferences(locale)
  try {
    systemMemoryPreferences = await listSystemMemoryPreferences({
      supabase,
      userId: user.id,
      locale,
    })
  } catch {
    systemMemoryPreferences = getDefaultSystemMemoryPreferences(locale)
  }

  const currentXP = (profile as unknown as { xp?: number | null })?.xp || 0
  const currentLevel = (profile as unknown as { level?: number | null })?.level || 1
  const nextLevelXP = 100 * Math.pow(1.2, currentLevel - 1)
  const { data: lastLog } = await supabase
    .from('xp_logs')
    .select('amount, source')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: recentScores } = await queryWithOwnershipFallback({
    primary: 'owner_id',
    fallback: 'user_id',
    execute: (ownershipColumn) =>
      supabase
        .from('daily_scores')
        .select('score_date, score')
        .eq(ownershipColumn, user.id)
        .order('score_date', { ascending: false })
        .limit(30),
  })
  const chartData = (recentScores || []).map((s) => ({ date: s.score_date, score: s.score }))
  const todayScore = chartData.find((entry) => entry.date === today)?.score ?? null

  const datePredicate = [
    `and(start_date.lte.${today},end_date.gte.${today})`,
    `and(end_date.lt.${today},completed.eq.false)`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
    `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
  ].join(',')

  const { data: rawTodayActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select(`
          id,
          completed,
          start_date,
          end_date,
          updated_at,
          goals (
            status
          )
        `)
        .eq(ownershipColumn, user.id)
        .or(datePredicate),
  })

  const todayActionPool = (rawTodayActions || []).filter((action) => {
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
  const incompleteActionsCount = todayActionPool.filter((action) => !action.completed).length

  const oneYearAgo = new Date()
  oneYearAgo.setDate(oneYearAgo.getDate() - 365)

  const { data: completedActions } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select('updated_at')
        .eq(ownershipColumn, user.id)
        .eq('completed', true)
        .gte('updated_at', oneYearAgo.toISOString()),
  })

  const heatmapData =
    completedActions?.reduce((acc, curr) => {
      const date = curr.updated_at?.split('T')[0]
      if (!date) return acc
      const existing = acc.find((d) => d.date === date)
      if (existing) {
        existing.count++
      } else {
        acc.push({ date, count: 1 })
      }
      return acc
    }, [] as { date: string; count: number }[]) || []

  const { data: actionsType } = await queryWithOwnershipFallback({
    execute: (ownershipColumn) =>
      supabase
        .from('actions')
        .select('type')
        .eq(ownershipColumn, user.id),
  })

  const typeCount =
    actionsType?.reduce((acc, curr) => {
      const type = curr.type || 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

  const distributionData = Object.entries(typeCount).map(([type, count]) => {
    let color = '#6b7280'
    const typeLabel = dict.today.types[type as keyof typeof dict.today.types] || type
    let name = typeLabel
    if (type === 'core') { color = '#059669'; name = dict.today.types.core }
    if (type === 'learning') { color = '#3b82f6'; name = dict.today.types.learning }
    if (type === 'maintenance') { color = '#f59e0b'; name = dict.today.types.maintenance }
    if (type === 'health') { color = '#ec4899'; name = dict.today.types.rest }
    return { name, value: count, color }
  })

  const tabLabels = {
    self: localeIsZh ? '画像' : 'Self',
    incentives: localeIsZh ? '激励' : 'Incentives',
    analytics: localeIsZh ? '分析' : 'Analytics',
    settings: localeIsZh ? '设置' : 'Settings',
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.profile.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">{dict.profile.subtitle}</div>
        </div>
        <LanguageToggle currentLocale={currentLocale} />
      </div>

      <SystemChatEntry
        eyebrow={localeIsZh ? '系统对话' : 'System Chat'}
        title={localeIsZh ? '分析类问题也统一进独立对话页' : 'Analysis questions now live in the dedicated chat page'}
        body={localeIsZh
          ? '这里继续展示画像、记忆和长期洞察；真正和系统来回对话的过程，已经收拢到一个独立页面里。'
          : 'This page keeps memory, profile, and long-term insight. The actual back-and-forth conversation now happens in one dedicated page.'}
        ctaLabel={localeIsZh ? '去问系统分析我' : 'Ask the system to analyze me'}
        href={buildSystemChatHref({
          source: 'profile',
          prefill: localeIsZh ? '分析我最近的状态' : 'Analyze my recent state',
        })}
      />

      <ProfileTabs
        initialTab={initialTab}
        tabs={[
          {
            key: 'self',
            label: tabLabels.self,
            content: (
              <div className="space-y-8">
                <Card className="border-primary/15 bg-linear-to-br from-primary/10 via-background to-background shadow-sm">
                  <CardContent className="grid gap-4 p-6 md:grid-cols-[1.45fr_0.85fr]">
                    <div>
                      <div className="inline-flex rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
                        {localeIsZh ? 'System Image' : 'System Image'}
                      </div>
                      <div className="mt-4 text-2xl font-semibold tracking-tight">
                        {localeIsZh ? `系统正在学习如何更懂你，${displayName}` : `The system is learning how to understand you better, ${displayName}`}
                      </div>
                      <div className="mt-3 text-sm leading-6 text-muted-foreground">
                        {localeIsZh
                          ? '这里不只是账户设置，而是你的长期节奏、偏好和执行模式被系统逐步理解的入口。'
                          : 'This is more than account settings. It is where your rhythm, preferences, and execution patterns become legible to the system over time.'}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                      <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {localeIsZh ? '连续状态' : 'Continuity'}
                        </div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight">{streakSnapshot.currentStreak}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {localeIsZh ? `护盾 ${streakSnapshot.shieldBalance} 个。` : `${streakSnapshot.shieldBalance} shield(s).`}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {localeIsZh ? '系统信号' : 'Signals'}
                        </div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight">{unreadNotifications}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {localeIsZh ? '等待你处理的提醒与变化。' : 'Unread reminders and changes waiting for you.'}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {localeIsZh ? '加入系统' : 'Joined'}
                        </div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight">{joinedLabel}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {localeIsZh ? '从这一刻开始，系统持续积累对你的理解。' : 'The moment the system started accumulating context about you.'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div id="current-system-read" className="space-y-4 scroll-mt-24">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {localeIsZh ? 'Current System Read' : 'Current System Read'}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {selfModelCards.map((card) => (
                      <Card key={card.label} className="shadow-none">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                            {card.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-base font-semibold leading-7">{card.title}</div>
                          <div className="text-sm leading-6 text-muted-foreground">{card.body}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Card className="border-primary/12 bg-primary/5 shadow-none">
                    <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {localeIsZh ? '这些判断会继续进入洞察解释层，并影响 Today 的判断方式。' : 'These reads continue into the insights layer and directly affect how Today makes judgments.'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {localeIsZh ? '先看系统为什么会这样判断，再看这种理解如何改变今天的主线与建议力度。' : 'See why the system believes this first, then see how that understanding changes today’s main thread and suggestion intensity.'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href="/profile/ai-insights#system-read-explained">
                            {localeIsZh ? '看系统为何这样判断' : 'Why the system thinks this'}
                          </Link>
                        </Button>
                        <Button asChild className="rounded-full">
                          <Link href="/today#today-system-read">
                            {localeIsZh ? '看今天如何执行' : 'See how Today applies it'}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <SystemMemorySection
                  initialPreferences={systemMemoryPreferences}
                  locale={locale}
                />

                <ProfileCard
                  dict={dict}
                  userEmail={user.email ?? ''}
                  userId={user.id}
                  initialName={profile?.name ?? (user.user_metadata?.name as string) ?? ''}
                  initialTimezone={profile?.timezone ?? 'UTC'}
                  initialAvatarUrl={profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? ''}
                  currentLocale={currentLocale}
                  createdAt={createdAt}
                  lastSignIn={lastSignIn}
                  updateAction={updateProfile}
                />

                <div className="space-y-4">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {localeIsZh ? 'System Intelligence' : 'System Intelligence'}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="shadow-none">
                      <CardHeader>
                        <CardTitle className="text-base">{dict.profile.aiAnalyticsTitle}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground">{dict.profile.aiAnalyticsDesc}</div>
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href="/profile/ai-insights">{dict.profile.openAIAnalytics}</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {localeIsZh ? '连续性洞察' : 'Continuity insights'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>
                            {localeIsZh
                              ? `当前连续 ${streakSnapshot.currentStreak} 天，护盾 ${streakSnapshot.shieldBalance} 个。`
                              : `Current streak: ${streakSnapshot.currentStreak} days. Shields: ${streakSnapshot.shieldBalance}.`}
                          </div>
                          <div>
                            {localeIsZh
                              ? `连续到 ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} 天可获得下一次护盾。`
                              : `Reach ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} days to earn the next shield.`}
                          </div>
                        </div>
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href="/profile/ai-insights">
                            {localeIsZh ? '查看洞察' : 'View insights'}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none">
                      <CardHeader>
                        <CardTitle className="text-base">{dict.profile.notificationsTitle}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>{dict.profile.notificationsDesc}</div>
                          {unreadNotifications > 0 ? (
                            <div className="text-xs">
                              {dict.profile.notificationsUnread.replace('{count}', String(unreadNotifications))}
                            </div>
                          ) : null}
                        </div>
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href="/notifications" className="inline-flex items-center gap-2">
                            <span>{dict.profile.notificationsCta}</span>
                            {unreadNotifications > 0 ? (
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
                              />
                            ) : null}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none">
                      <CardHeader>
                        <CardTitle className="text-base">{dict.potential.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground">{dict.potential.subtitle}</div>
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href="/potential">{dict.sidebar.potential}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'incentives',
            label: tabLabels.incentives,
            content: (
              <div className="space-y-8">
                <div id="incentives" className="space-y-4 scroll-mt-24">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {localeIsZh ? 'Incentives' : 'Incentives'}
                  </div>
                  <Card className="border-primary/12 bg-primary/5 shadow-none">
                    <CardContent className="space-y-3 p-5">
                      <div className="text-sm font-medium">
                        {localeIsZh ? '这不是统计，这是系统给你的内在驱动机制。' : 'This is not analytics. It is the system’s incentive mechanism.'}
                      </div>
                      <div className="text-sm leading-6 text-muted-foreground">
                        {streakSnapshot.recoverableMissDate
                          ? localeIsZh
                            ? streakSnapshot.shieldBalance > 0
                              ? `昨天漏掉了 1 天，你还有 ${streakSnapshot.shieldBalance} 个护盾；系统建议先恢复连续，再推进今天。`
                              : '昨天已经断掉，但现在没有护盾；系统建议今天先完成一个最小行动，让连续重新开始。'
                            : streakSnapshot.shieldBalance > 0
                              ? `Yesterday is recoverable. You still have ${streakSnapshot.shieldBalance} shield(s); recover continuity before pushing today.`
                              : 'Yesterday was missed and no shield is available. Do one minimum action today to restart continuity.'
                          : localeIsZh
                            ? `护盾余额 ${streakSnapshot.shieldBalance}。连续到 ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} 天可获得下一次护盾。`
                            : `Shield balance: ${streakSnapshot.shieldBalance}. Reach ${streakSnapshot.nextShieldGrantRule.nextGrantAtStreak} day(s) to earn the next shield.`}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href="/today">
                            {localeIsZh ? '去执行今天' : 'Go to today'}
                          </Link>
                        </Button>
                        <Button asChild className="rounded-full">
                          <Link href="/profile/ai-insights">
                            {localeIsZh ? '查看洞察解释' : 'View insights'}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div id="main-path" className="space-y-4 scroll-mt-24">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {localeIsZh ? 'Main Path' : 'Main Path'}
                  </div>
                  <Card className="shadow-none">
                    <CardContent className="space-y-3 p-5">
                      <div className="text-base font-semibold leading-7">
                        {primaryPathContext
                          ? localeIsZh
                            ? `系统当前主线是「${primaryPathContext.title}」`
                            : `Current main path: "${primaryPathContext.title}"`
                          : localeIsZh
                            ? '系统还没有主线路径'
                            : 'No main path yet'}
                      </div>
                      <div className="text-sm leading-6 text-muted-foreground">
                        {primaryPathContext
                          ? primaryPathContext.body
                          : localeIsZh
                            ? '先定义一条真正长期要走的路径。系统有了主线，才会开始稳定指导你。'
                            : 'Define one long-term path first. Once the system has a main path, it can guide you consistently.'}
                      </div>
                      <Button asChild variant="outline" className="rounded-full w-fit">
                        <Link href={primaryPathContext ? `/goals/${primaryPathContext.goalId}` : '/goals'}>
                          {primaryPathContext
                            ? primaryPathContext.ctaLabel
                            : localeIsZh
                              ? '去定义路径'
                              : 'Define a path'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            key: 'analytics',
            label: tabLabels.analytics,
            content: (
              <div className="space-y-6">
                <SystemOverviewCard
                  locale={locale}
                  activeGoalsCount={(activeGoals || []).length}
                  streak={streakSnapshot.currentStreak}
                  shieldBalance={streakSnapshot.shieldBalance}
                  todayScore={todayScore}
                  incompleteActionsCount={incompleteActionsCount}
                />
                <WeeklyInsightCard dict={dict.dashboard.planning} locale={locale} insight={weeklyInsight} />
                <div className="grid gap-4 md:grid-cols-2">
                  <LevelCard
                    dict={dict}
                    level={currentLevel}
                    currentXP={currentXP}
                    nextLevelXP={Math.floor(nextLevelXP)}
                    lastLog={lastLog}
                    className="h-full"
                  />
                  <FocusDistributionChart dict={dict} data={distributionData} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ScoreTrendChart
                    data={chartData}
                    title={localeIsZh ? '近 30 天自评趋势' : '30-day score trend'}
                    description={localeIsZh ? '看见波动与改善，让行动更有方向。' : 'See the drift and the gains.'}
                    scoreLabel={localeIsZh ? '自评' : 'Score'}
                  />
                  <ActivityHeatmap dict={dict} data={heatmapData} />
                </div>
              </div>
            ),
          },
          {
            key: 'settings',
            label: tabLabels.settings,
            content: (
              <div className="space-y-4">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {localeIsZh ? 'Access & Connections' : 'Access & Connections'}
                </div>
                <div className="grid gap-4">
                  <Card className="shadow-none">
                    <CardHeader>
                      <CardTitle className="text-base">{dict.profile.accountSecurityTitle}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">{dict.profile.accountSecurityDesc}</div>
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href="/profile/account">{dict.profile.manageAccount}</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <UserCalendarFeedCard
                    dict={dict}
                    initialToken={(calendarFeedData?.revoked_at ? null : (calendarFeedData?.token as string | null)) || null}
                    initialExpiresAt={(calendarFeedData?.expires_at as string | null) || null}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
