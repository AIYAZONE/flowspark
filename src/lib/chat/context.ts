import type { SupabaseClient } from '@supabase/supabase-js'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { filterExecutableActionsForToday } from '@/lib/chat-agent/action-availability'
import { sortActionsForToday } from '@/lib/chat-agent/action-ranking'
import { listSystemMemoryPreferences } from '@/lib/system-memory/preferences'
import { getStreakSnapshot } from '@/lib/streaks'
import { getRecentRecommendations } from '@/lib/ai/analyticsStore'
import {
  buildSelfModelCards,
  buildTodayPersonalization,
  summarizeRecommendationSignals,
  type SelfModelCard,
  type SelfModelSignalSummary,
  type TodayPersonalization
} from '@/lib/self-model'
import { getChatFeedbackSummary, type ChatFeedbackSummary } from './feedback.ts'
import { type MilestoneStageInfo, computeMilestoneStage, type MilestoneLike } from '@/lib/path-context'

export type ChatContext = {
  goals: Array<{ title: string; category: string | null; priority: string | null }>
  todayActions: Array<{ title: string; type: string | null; priority: string | null }>
  // 近期已完成的行动（黑名单）：让 AI 明确知道这些已被用户勾掉，禁止再次推荐或复活。
  completedActions: string[]
  today: string
  // P0 个性化上下文：把已有的"人生系统大脑"接入聊天主界面，而非只给行动标题
  selfModelCards: SelfModelCard[]
  todayPersonalization: TodayPersonalization | null
  streak: { currentStreak: number; longestStreak: number; completedToday: boolean }
  preferences: string[]
  signals: SelfModelSignalSummary
  // 聊天负反馈聚合：近 14 天负反馈 ≥ 2 时用于闭环改进 system prompt；无信号时为 null
  feedbackSummary?: ChatFeedbackSummary | null
  // 路径里程碑阶段信息：结构化标记当前里程碑，替代纯推断
  milestoneStage?: MilestoneStageInfo | null
}

type GoalRow = { id: string; title: string; category: string | null; priority: string | null; status: string }
type ActionRow = {
  id: string
  title: string
  goal_id: string | null
  priority: string | null
  type: string | null
  start_date: string | null
  end_date: string | null
  completed: boolean | null
}

/**
 * Gathers the user's active goals and today's ranked open actions to ground
 * the conversational agent in the user's real life-path context.
 * Mirrors the query/permission shape used by the command-draft flow.
 */
export async function getChatContext(
  supabase: SupabaseClient,
  userId: string,
  locale: 'zh' | 'en' = 'zh'
): Promise<ChatContext> {
  const { data: goalsData } = await queryWithOwnershipFallback({
    execute: (col) =>
      supabase.from('goals').select('id,title,category,priority,status').eq(col, userId).eq('status', 'active')
  })
  const goals: GoalRow[] = (goalsData ?? []).filter((g) => g.status === 'active')

  const { data: actionsData } = await queryWithOwnershipFallback({
    execute: (col) =>
      supabase.from('actions').select('id,title,goal_id,priority,type,start_date,end_date,completed').eq(col, userId).eq('archived', false)
  })
  const actionsAll: ActionRow[] = actionsData ?? []
  const openActions = actionsAll.filter((a) => !a.completed)

  const tz = await getUserTimezone(supabase, userId)
  const today = getTodayInTZ(tz)

  const executable = filterExecutableActionsForToday({ actions: openActions, today })
  const ranked = sortActionsForToday({
    actions: executable.map((a) => ({ ...a, goalId: a.goal_id })),
    today,
    primaryGoalId: null
  })

  // —— P0 个性化上下文：把已有的"人生系统大脑"接入聊天主界面 ——
  // 个性化数据不可用时整体降级，绝不停掉聊天主流程。
  let currentStreak = 0
  let longestStreak = 0
  let completedToday = false
  let recoverableMissDate: string | null = null
  let preferences: string[] = []
  let signals: SelfModelSignalSummary = summarizeRecommendationSignals([])
  try {
    const streakSnapshot = await getStreakSnapshot({ supabase, userId, timeZone: tz, today })
    currentStreak = streakSnapshot.currentStreak
    longestStreak = streakSnapshot.longestStreak
    completedToday = streakSnapshot.completedToday
    recoverableMissDate = streakSnapshot.recoverableMissDate ?? null

    const recentRecommendations = await getRecentRecommendations({ supabase, userId, limit: 24, days: 7 })
    signals = summarizeRecommendationSignals(recentRecommendations)

    const prefs = await listSystemMemoryPreferences({ supabase, userId, locale })
    preferences = prefs.filter((p) => p.enabled).map((p) => p.title)
  } catch {
    // 降级：保留默认值，聊天仍可用
  }

  // 聊天负反馈聚合：用于闭环改进后续回答；失败降级为 null，不影响主流程。
  let feedbackSummary: ChatFeedbackSummary | null = null
  try {
    feedbackSummary = await getChatFeedbackSummary(supabase, userId)
  } catch {
    // 降级：不注入反馈改进指令
  }

  // —— 路径里程碑阶段：查询结构化里程碑数据，替代纯推断 ——
  let milestoneStage: MilestoneStageInfo | null = null
  try {
    const primaryGoal = [...goals].sort((a, b) => {
      const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const pA = pMap[a.priority || 'medium'] ?? 2
      const pB = pMap[b.priority || 'medium'] ?? 2
      if (pA !== pB) return pB - pA
      return a.title.localeCompare(b.title)
    })[0]
    if (primaryGoal) {
      const { data: milestonesData } = await queryWithOwnershipFallback({
        execute: (col) =>
          supabase
            .from('path_milestones')
            .select('id,title,target_date,sort_order,status,started_at,completed_at')
            .eq(col, userId)
            .eq('goal_id', primaryGoal.id)
            .order('sort_order', { ascending: true }),
      })
      const milestones: MilestoneLike[] = (milestonesData ?? []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        title: m.title as string,
        target_date: m.target_date as string | null,
        sort_order: (m.sort_order as number) ?? 0,
        status: (m.status as MilestoneLike['status']) || 'pending',
        started_at: m.started_at as string | null,
        completed_at: m.completed_at as string | null,
      }))
      if (milestones.length > 0) {
        milestoneStage = computeMilestoneStage(milestones)
      }
    }
  } catch {
    // 降级：里程碑查询失败不影响聊天主流程
  }

  // 近期已完成的行动（黑名单）：取最近勾掉的若干条，让 AI 明确知道这些已结束，避免复活。
  const completedActions = actionsAll
    .filter((a) => a.completed)
    .slice(0, 5)
    .map((a) => a.title)

  const selfModelCards = buildSelfModelCards({ locale, currentStreak, completedToday, signals })

  const showStreakRiskBanner = !completedToday && (currentStreak > 0 || Boolean(recoverableMissDate))
  const todayPersonalization = buildTodayPersonalization({
    locale,
    currentStreak,
    nextActionTitle: ranked[0]?.title ?? null,
    showStreakRiskBanner,
    hasTomorrowHandoff: false,
    signals
  })

  return {
    goals: goals.map((g) => ({ title: g.title, category: g.category, priority: g.priority })),
    todayActions: ranked.slice(0, 8).map((a) => ({ title: a.title, type: a.type, priority: a.priority })),
    completedActions,
    today,
    selfModelCards,
    todayPersonalization,
    streak: { currentStreak, longestStreak, completedToday },
    preferences,
    signals,
    feedbackSummary,
    milestoneStage,
  }
}

export type OpenActionRef = { id: string; title: string }

/**
 * Returns the user's currently open (not completed) actions with their ids,
 * used to let the model map a "I finished X" statement onto a concrete row.
 */
export async function getOpenActionsWithIds(supabase: SupabaseClient, userId: string): Promise<OpenActionRef[]> {
  const { data: actionsData } = await queryWithOwnershipFallback({
    execute: (col) =>
      supabase.from('actions').select('id,title,start_date,end_date,completed').eq(col, userId).eq('archived', false)
  })
  const actionsAll: Array<{
    id: string
    title: string
    start_date: string | null
    end_date: string | null
    completed: boolean | null
  }> = actionsData ?? []

  const open = actionsAll.filter((a) => !a.completed)
  const tz = await getUserTimezone(supabase, userId)
  const today = getTodayInTZ(tz)
  const executable = filterExecutableActionsForToday({ actions: open, today })

  return executable.map((a) => ({ id: a.id, title: a.title }))
}
