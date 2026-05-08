import { getConfiguredAIModel } from '@/lib/ai/client'
import { buildCoachContext } from '@/lib/ai/contextBuilder'
import { aiWeeklyInsight } from '@/lib/ai/insights'
import { aiRescue, aiReview, aiTodayPlan } from '@/lib/ai/phase2a'
import type {
  RescueOutput,
  ReviewOutput,
  TodayPlanOutput,
} from '@/lib/ai/phase2aSchemas'
import { createRecommendation } from '@/lib/ai/recommendationStore'
import { upsertGrowthProfileSummary } from '@/lib/userState'
import type {
  CoachApiResponse,
  CoachContext,
  RescueApiResponse,
  ReviewApiResponse,
  TodayPlanApiResponse,
  WeeklyInsightApiResponse,
  WeeklyInsightOutput,
} from '@/lib/ai/types'
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

function isMissingRelationError(message: string | undefined) {
  const text = (message || '').toLowerCase()
  return text.includes('does not exist') || text.includes('relation') || text.includes('schema cache')
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

function mapContextGoals(context: CoachContext): GoalCandidate[] {
  return context.goals.map(goal => ({
    id: goal.id,
    title: goal.title,
    priority: goal.priority,
    start_date: goal.startDate,
    end_date: goal.endDate,
    success_criteria: goal.successCriteria,
    stop_criteria: goal.stopCriteria,
  }))
}

function buildFallbackTodayPlan(params: {
  locale: 'en' | 'zh'
  goals: GoalCandidate[]
  context: CoachContext
}): TodayPlanOutput {
  const primaryGoal = pickPrimaryGoal(params.goals)
  const lowMomentum =
    params.context.behavior.momentumBucket === 'low' ||
    params.context.behavior.momentumBucket === 'unknown' ||
    (typeof params.context.behavior.completionRate7d === 'number' &&
      params.context.behavior.completionRate7d < 0.5)

  if (params.locale === 'zh') {
    return {
      type: 'today_plan',
      recommendations: [
        {
          kind: 'core',
          goal_id: primaryGoal?.id || null,
          reason: lowMomentum ? '先用一个最容易开始的小动作把今天启动起来。' : '先推进当前最重要、最接近结果的一步。',
          variants: [
            {
              minutes: 5,
              title: `写下${primaryGoal?.title || '当前目标'}的下一步`,
              first_step: '打开文档并写下一步',
              definition_of_done: '明确今天先做哪一步。',
            },
            {
              minutes: 10,
              title: `完成${primaryGoal?.title || '当前目标'}的一小段`,
              first_step: '先做最小可交付片段',
              definition_of_done: '产出一个可见小结果。',
            },
            {
              minutes: 20,
              title: `推进${primaryGoal?.title || '当前目标'}的关键片段`,
              first_step: '连续完成一个关键片段',
              definition_of_done: '完成一段可直接复用结果。',
            },
          ],
        },
      ],
      confidence: 'low',
    }
  }

  return {
    type: 'today_plan',
    recommendations: [
      {
        kind: 'core',
        goal_id: primaryGoal?.id || null,
        reason: lowMomentum
          ? 'Start with the easiest small move that gets you moving today.'
          : 'Start with the most important next step that can create visible progress today.',
        variants: [
          {
            minutes: 5,
            title: `Define the next step for ${primaryGoal?.title || 'your goal'}`,
            first_step: 'Open the doc and write the next step',
            definition_of_done: 'You know exactly what to do first today.',
          },
          {
            minutes: 10,
            title: `Finish one small part of ${primaryGoal?.title || 'your goal'}`,
            first_step: 'Complete the smallest deliverable first',
            definition_of_done: 'You produce one visible small result.',
          },
          {
            minutes: 20,
            title: `Push a key section of ${primaryGoal?.title || 'your goal'}`,
            first_step: 'Stay on one focused work block',
            definition_of_done: 'You finish one reusable output.',
          },
        ],
      },
    ],
    confidence: 'low',
  }
}

function buildFallbackRescuePlan(params: {
  locale: 'zh' | 'en'
  reasonTag: RescueOutput['reason_tag']
  actionTitle: string
}): RescueOutput {
  if (params.locale === 'zh') {
    return {
      type: 'rescue',
      reason_tag: params.reasonTag,
      minimal_variant: {
        minutes: 5,
        title: `先推进${params.actionTitle}的最小版本`,
        first_step: '先打开相关内容并改一小处',
        definition_of_done: '完成一个 5 分钟内看得见的最小结果。',
      },
      if_then: {
        if: '你又开始犹豫或卡住',
        then: '只做第一步并在 5 分钟后决定是否继续',
      },
      confidence: 'low',
    }
  }

  return {
    type: 'rescue',
    reason_tag: params.reasonTag,
    minimal_variant: {
      minutes: 5,
      title: `Make the smallest version of ${params.actionTitle}`,
      first_step: 'Open the relevant work and change one small thing',
      definition_of_done: 'Finish one visible output within five minutes.',
    },
    if_then: {
      if: 'you start hesitating again',
      then: 'do only the first step and decide again after five minutes',
    },
    confidence: 'low',
  }
}

function buildFallbackReviewPlan(params: {
  locale: 'zh' | 'en'
  friction: string | null
}): ReviewOutput {
  if (params.locale === 'zh') {
    return {
      type: 'review',
      summary_sentence: params.friction ? '今天的主要阻力已经被识别出来。' : '今天已经完成一次最小复盘。',
      detected_friction_tag: params.friction,
      tomorrow_card: {
        risk: params.friction ? '明天容易在同样阻力点再次掉线。' : '明天可能因为起步慢而拖延。',
        if_then: {
          if: '你还没开始今天的第一步',
          then: '先做一个 5 分钟能完成的最小动作',
        },
        suggested_core_action_direction: '优先选择低摩擦、可快速见到结果的核心行动',
      },
      confidence: 'low',
    }
  }

  return {
    type: 'review',
    summary_sentence: params.friction ? 'You already identified the main friction for today.' : 'You completed a minimal end-of-day review.',
    detected_friction_tag: params.friction,
    tomorrow_card: {
      risk: params.friction ? 'Tomorrow may fail at the same friction point again.' : 'Tomorrow may drift because starting feels slow.',
      if_then: {
        if: 'you still have not started the first step',
        then: 'do one five-minute starter task first',
      },
      suggested_core_action_direction: 'Choose a low-friction core action with a fast visible outcome first',
    },
    confidence: 'low',
  }
}

async function persistRecommendation<T>(params: {
  supabase: SupabaseServerClient
  userId: string
  scene: 'today_plan' | 'rescue' | 'review' | 'weekly_insight'
  strategyVersion: string
  promptVersion: string
  inputSummary: unknown
  output: T & { confidence?: 'low' | 'medium' | 'high' }
  fallbackUsed: boolean
}) {
  const { supabase, userId, scene, strategyVersion, promptVersion, inputSummary, output, fallbackUsed } = params
  const recommendationId = await createRecommendation({
    supabase,
    userId,
    scene,
    strategyVersion,
    promptVersion,
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    inputSummary,
    outputPayload: output,
    confidence: output.confidence,
    fallbackUsed,
  })

  return recommendationId
}

async function recordFrictionEvent(params: {
  supabase: SupabaseServerClient
  userId: string
  scene: 'rescue' | 'review'
  reasonTag: string | null
  goalId?: string | null
  actionId?: string | null
  detail?: string | null
}) {
  const { supabase, userId, scene, reasonTag, goalId = null, actionId = null, detail = null } = params
  if (!reasonTag) return

  const { error } = await supabase.from('user_friction_events').insert({
    user_id: userId,
    goal_id: goalId,
    action_id: actionId,
    scene,
    reason_tag: reasonTag,
    detail,
  })

  if (error && !isMissingRelationError(error.message)) {
    console.error('recordFrictionEvent failed', error)
  }
}

export async function planToday(params: {
  supabase: SupabaseServerClient
  userId: string
  locale: 'en' | 'zh'
  today: string
  goals: GoalCandidate[]
  requestedRecentContext?: Record<string, unknown>
  timezone?: string
}): Promise<TodayPlanApiResponse> {
  const { supabase, userId, locale, today, goals, requestedRecentContext, timezone } = params
  const context = await buildCoachContext({
    supabase,
    userId,
    scene: 'today_plan',
    locale,
    timezone,
  })

  const effectiveGoals = goals.length > 0 ? goals : mapContextGoals(context)
  let output: TodayPlanOutput
  let fallbackUsed = false

  try {
    output = await aiTodayPlan({
      locale,
      today,
      goals: effectiveGoals,
      recent_context: {
        ...(requestedRecentContext ?? {}),
        completion_rate_7d: context.behavior.completionRate7d ?? null,
        completion_rate_30d: context.behavior.completionRate30d ?? null,
        daily_score_avg_7d: context.behavior.scoreAvg7d ?? null,
        momentum_bucket: context.behavior.momentumBucket ?? 'unknown',
        likely_frictions: context.frictions.slice(0, 2).map(item => item.reasonTag),
      } as Record<string, unknown>,
    })
  } catch {
    output = buildFallbackTodayPlan({
      locale,
      goals: effectiveGoals,
      context,
    })
    fallbackUsed = true
  }

  const recommendationId = await persistRecommendation({
    supabase,
    userId,
    scene: 'today_plan',
    strategyVersion: 'phase_b_v1',
    promptVersion: 'today_plan_v2',
    inputSummary: {
      today,
      locale,
      goalIds: effectiveGoals.map(goal => goal.id),
      context: {
        behavior: context.behavior,
        frictions: context.frictions,
      },
    },
    output,
    fallbackUsed,
  })

  return {
    ok: true,
    scene: 'today_plan',
    recommendationId,
    strategyVersion: 'phase_b_v1',
    promptVersion: 'today_plan_v2',
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    data: output,
    confidence: output.confidence,
    fallbackUsed,
  }
}

export async function planRescue(params: {
  supabase: SupabaseServerClient
  userId: string
  locale: 'en' | 'zh'
  reasonTag: RescueOutput['reason_tag']
  action: { id: string; title: string; description?: string | null }
  goal: { id: string; title: string }
  timezone?: string
}): Promise<RescueApiResponse> {
  const { supabase, userId, locale, reasonTag, action, goal, timezone } = params
  const context = await buildCoachContext({
    supabase,
    userId,
    scene: 'rescue',
    locale,
    timezone,
  })

  let output: RescueOutput
  let fallbackUsed = false
  try {
    output = await aiRescue({
      locale,
      reason_tag: reasonTag,
      action,
      goal,
    })
  } catch {
    output = buildFallbackRescuePlan({
      locale,
      reasonTag,
      actionTitle: action.title,
    })
    fallbackUsed = true
  }

  const recommendationId = await persistRecommendation({
    supabase,
    userId,
    scene: 'rescue',
    strategyVersion: 'phase_b_v1',
    promptVersion: 'rescue_v1',
    inputSummary: {
      locale,
      reasonTag,
      action,
      goal,
      context: {
        behavior: context.behavior,
        frictions: context.frictions,
      },
    },
    output,
    fallbackUsed,
  })

  await recordFrictionEvent({
    supabase,
    userId,
    scene: 'rescue',
    reasonTag,
    goalId: goal.id,
    actionId: action.id,
    detail: action.title,
  })

  return {
    ok: true,
    scene: 'rescue',
    recommendationId,
    strategyVersion: 'phase_b_v1',
    promptVersion: 'rescue_v1',
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    data: output,
    confidence: output.confidence,
    fallbackUsed,
  }
}

export async function planReview(params: {
  supabase: SupabaseServerClient
  userId: string
  locale: 'en' | 'zh'
  today: string
  score: number | null
  answers: Record<string, string>
  timezone?: string
}): Promise<ReviewApiResponse> {
  const { supabase, userId, locale, today, score, answers, timezone } = params
  const context = await buildCoachContext({
    supabase,
    userId,
    scene: 'review',
    locale,
    timezone,
  })

  let output: ReviewOutput
  let fallbackUsed = false
  try {
    output = await aiReview({ locale, today, score, answers })
  } catch {
    output = buildFallbackReviewPlan({
      locale,
      friction: answers.friction || null,
    })
    fallbackUsed = true
  }

  const recommendationId = await persistRecommendation({
    supabase,
    userId,
    scene: 'review',
    strategyVersion: 'phase_b_v1',
    promptVersion: 'review_v1',
    inputSummary: {
      today,
      score,
      answers,
      context: {
        behavior: context.behavior,
        frictions: context.frictions,
      },
    },
    output,
    fallbackUsed,
  })

  await recordFrictionEvent({
    supabase,
    userId,
    scene: 'review',
    reasonTag: output.detected_friction_tag || answers.friction || null,
    detail: output.summary_sentence,
  })

  return {
    ok: true,
    scene: 'review',
    recommendationId,
    strategyVersion: 'phase_b_v1',
    promptVersion: 'review_v1',
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    data: output,
    confidence: output.confidence,
    fallbackUsed,
  }
}

export async function planWeeklyInsight(params: {
  supabase: SupabaseServerClient
  userId: string
  locale: 'en' | 'zh'
  timezone?: string
}): Promise<WeeklyInsightApiResponse> {
  const { supabase, userId, locale, timezone } = params
  const context = await buildCoachContext({
    supabase,
    userId,
    scene: 'weekly_insight',
    locale,
    timezone,
  })
  const { output, fallbackUsed } = await aiWeeklyInsight({ context })
  const recommendationId = await persistRecommendation({
    supabase,
    userId,
    scene: 'weekly_insight',
    strategyVersion: 'phase_d_v1',
    promptVersion: 'weekly_insight_v1',
    inputSummary: {
      context: {
        profile: context.profile,
        behavior: context.behavior,
        frictions: context.frictions,
        recentAI: context.recentAI,
      },
    },
    output,
    fallbackUsed,
  })

  try {
    await upsertGrowthProfileSummary({
      supabase,
      userId,
      summary: output.summary,
      currentStage: output.momentum,
      riskOfDropout:
        output.momentum === 'low' && output.topFriction ? output.topFriction : null,
    })
  } catch (error) {
    if (!(error instanceof Error) || !isMissingRelationError(error.message)) {
      console.error('upsertGrowthProfileSummary failed', error)
    }
  }

  const response: CoachApiResponse<WeeklyInsightOutput> = {
    ok: true,
    scene: 'weekly_insight',
    recommendationId,
    strategyVersion: 'phase_d_v1',
    promptVersion: 'weekly_insight_v1',
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    data: output,
    confidence: output.confidence,
    fallbackUsed,
  }
  return response
}
