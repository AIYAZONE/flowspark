import { getConfiguredAIModel } from '@/lib/ai/client'
import { aiTodayPlan } from '@/lib/ai/phase2a'
import type { TodayPlanOutput } from '@/lib/ai/phase2aSchemas'
import { createRecommendation } from '@/lib/ai/recommendationStore'
import type { TodayPlanApiResponse } from '@/lib/ai/types'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type GoalCandidate = {
  id: string
  title: string
  priority?: string | null
  start_date?: string | null
  end_date?: string | null
  success_criteria?: string | null
  stop_criteria?: string | null
}

type RecentContext = {
  completion_rate_7d?: number | null
  core_created_7d?: number | null
  core_completed_7d?: number | null
  daily_score_avg_7d?: number | null
  momentum_bucket?: 'high' | 'medium' | 'low' | 'unknown'
  likely_frictions?: string[] | null
}

type RecentActionRow = {
  type?: string | null
  completed?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

type RecentScoreRow = {
  score?: number | null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function isoDateNDaysAgo(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function isoTimestampNDaysAgo(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function pickPrimaryGoal(goals: GoalCandidate[]) {
  const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
  return [...goals].sort((a, b) => {
    const pa = priorityMap[a.priority || 'medium'] ?? 2
    const pb = priorityMap[b.priority || 'medium'] ?? 2
    if (pa !== pb) return pb - pa
    const ea = a.end_date || '9999-12-31'
    const eb = b.end_date || '9999-12-31'
    if (ea !== eb) return ea < eb ? -1 : 1
    return a.title.localeCompare(b.title)
  })[0] || goals[0]
}

function buildFallbackTodayPlan(params: {
  locale: 'en' | 'zh'
  goals: GoalCandidate[]
  recentContext: RecentContext
}): TodayPlanOutput {
  const primaryGoal = pickPrimaryGoal(params.goals)
  const lowMomentum =
    params.recentContext.momentum_bucket === 'low' ||
    params.recentContext.momentum_bucket === 'unknown' ||
    (typeof params.recentContext.completion_rate_7d === 'number' &&
      params.recentContext.completion_rate_7d < 0.5)

  if (params.locale === 'zh') {
    return {
      type: 'today_plan',
      recommendations: [
        {
          kind: 'core',
          goal_id: primaryGoal?.id || null,
          reason: lowMomentum ? '先用低摩擦的一步恢复今天的行动感。' : '优先推进当前最重要且最接近窗口期的目标。',
          variants: [
            {
              minutes: 5,
              title: `打开并梳理${primaryGoal?.title || '当前目标'}`,
              first_step: '打开相关页面并写一行',
              definition_of_done: '写下今天要推进的最小一步。'
            },
            {
              minutes: 10,
              title: `推进${primaryGoal?.title || '当前目标'}的一步`,
              first_step: '先完成最小可交付部分',
              definition_of_done: '产出一个可见的小结果并记录。'
            },
            {
              minutes: 20,
              title: `完成${primaryGoal?.title || '当前目标'}的小闭环`,
              first_step: '按顺序完成一个完整片段',
              definition_of_done: '完成一段可复用或可提交的结果。'
            }
          ]
        }
      ],
      confidence: 'low'
    }
  }

  return {
    type: 'today_plan',
    recommendations: [
      {
        kind: 'core',
        goal_id: primaryGoal?.id || null,
        reason: lowMomentum
          ? 'Start with a low-friction action to regain momentum today.'
          : 'Prioritize the most important goal that is closest to execution.',
        variants: [
          {
            minutes: 5,
            title: `Open and scope ${primaryGoal?.title || 'your goal'}`,
            first_step: 'Open the page and write one line',
            definition_of_done: 'You define the smallest next step for today.'
          },
          {
            minutes: 10,
            title: `Move ${primaryGoal?.title || 'your goal'} forward`,
            first_step: 'Finish the smallest deliverable first',
            definition_of_done: 'You produce one visible small result.'
          },
          {
            minutes: 20,
            title: `Close a small loop on ${primaryGoal?.title || 'your goal'}`,
            first_step: 'Complete one focused work block',
            definition_of_done: 'You finish one reusable or shareable output.'
          }
        ]
      }
    ],
    confidence: 'low'
  }
}

export async function planToday(params: {
  supabase: SupabaseServerClient
  userId: string
  locale: 'en' | 'zh'
  today: string
  goals: GoalCandidate[]
  requestedRecentContext?: Record<string, unknown>
}): Promise<TodayPlanApiResponse> {
  const { supabase, userId, locale, today, goals, requestedRecentContext } = params
  const sinceDate = isoDateNDaysAgo(7)
  const sinceTs = isoTimestampNDaysAgo(7)

  const [{ data: recentActions }, { data: recentScores }, { data: profile }] = await Promise.all([
    supabase
      .from('actions')
      .select('type, completed, created_at, updated_at')
      .eq('user_id', userId)
      .or(`created_at.gte.${sinceTs},updated_at.gte.${sinceTs}`)
      .limit(200),
    supabase
      .from('daily_scores')
      .select('score_date, score')
      .eq('user_id', userId)
      .gte('score_date', sinceDate)
      .order('score_date', { ascending: true })
      .limit(14),
    supabase
      .from('user_profiles')
      .select('ai_recent_events')
      .eq('id', userId)
      .maybeSingle()
  ])

  const actionRows = (recentActions || []) as RecentActionRow[]
  const scoreRows = (recentScores || []) as RecentScoreRow[]

  const coreCreated7d = actionRows.filter(
    a => a.type === 'core' && typeof a.created_at === 'string' && a.created_at >= sinceTs
  ).length
  const coreCompleted7d = actionRows.filter(
    a => a.type === 'core' && a.completed === true && typeof a.updated_at === 'string' && a.updated_at >= sinceTs
  ).length
  const completionRate7d =
    coreCreated7d > 0 ? Math.min(1, coreCompleted7d / coreCreated7d) : null

  const scores = scoreRows
    .map((scoreRow: RecentScoreRow) => (typeof scoreRow.score === 'number' ? scoreRow.score : null))
    .filter((s): s is number => typeof s === 'number')
  const dailyScoreAvg7d = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null

  const momentumBucket =
    coreCompleted7d >= 4 ? 'high'
      : coreCompleted7d >= 2 ? 'medium'
        : coreCreated7d >= 1 ? 'low'
          : 'unknown'

  const recentEvents = Array.isArray((profile as { ai_recent_events?: unknown } | null)?.ai_recent_events)
    ? ((profile as { ai_recent_events: unknown[] }).ai_recent_events)
    : []

  const frictionCounts = new Map<string, number>()
  for (const event of recentEvents) {
    if (!event || typeof event !== 'object') continue
    const evt = event as Record<string, unknown>
    const ts = asString(evt.ts)
    if (ts && ts < sinceTs) continue
    const name = asString(evt.name) || ''
    const meta =
      evt.meta && typeof evt.meta === 'object' && !Array.isArray(evt.meta)
        ? (evt.meta as Record<string, unknown>)
        : null
    if (!meta) continue
    if (name === 'ai_rescue_apply') {
      const reason = asString(meta.reason)
      if (reason) frictionCounts.set(reason, (frictionCounts.get(reason) || 0) + 1)
    }
    if (name === 'ai_review_generated') {
      const friction = asString(meta.friction)
      if (friction) frictionCounts.set(friction, (frictionCounts.get(friction) || 0) + 1)
    }
  }

  const likelyFrictions = [...frictionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key)

  const derivedRecentContext: RecentContext = {
    completion_rate_7d: completionRate7d,
    core_created_7d: coreCreated7d,
    core_completed_7d: coreCompleted7d,
    daily_score_avg_7d: dailyScoreAvg7d,
    momentum_bucket: momentumBucket,
    likely_frictions: likelyFrictions.length ? likelyFrictions : null
  }

  let output: TodayPlanOutput
  let fallbackUsed = false

  try {
    output = await aiTodayPlan({
      locale,
      today,
      goals,
      recent_context: {
        ...(requestedRecentContext ?? {}),
        ...derivedRecentContext
      }
    })
  } catch {
    output = buildFallbackTodayPlan({
      locale,
      goals,
      recentContext: derivedRecentContext
    })
    fallbackUsed = true
  }

  const recommendationId = await createRecommendation({
    supabase,
    userId,
    scene: 'today_plan',
    strategyVersion: 'phase_a_v1',
    promptVersion: 'today_plan_v1',
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    inputSummary: {
      today,
      locale,
      goalIds: goals.map(goal => goal.id),
      recentContext: derivedRecentContext
    },
    outputPayload: output,
    confidence: output.confidence,
    fallbackUsed
  })

  return {
    ok: true,
    scene: 'today_plan',
    recommendationId,
    data: output,
    confidence: output.confidence,
    fallbackUsed
  }
}
