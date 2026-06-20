import { getConfiguredAIModel } from '@/lib/ai/client'
import { buildCoachContext } from '@/lib/ai/contextBuilder'
import { aiWeeklyInsight } from '@/lib/ai/insights'
import { aiRescue, aiReview, aiTodayPlan } from '@/lib/ai/phase2a'
import {
  buildRescueStrategy,
  buildReviewStrategy,
  buildTodayStrategy,
  evaluateRescueQuality,
  evaluateReviewQuality,
  evaluateTodayPlanQuality,
} from '@/lib/ai/strategy'
import type {
  RescueOutput,
  ReviewOutput,
  TodayPlanOutput,
} from '@/lib/ai/phase2aSchemas'
import { createRecommendation } from '@/lib/ai/recommendationStore'
import { upsertGrowthProfileSummary } from '@/lib/userState'
import type {
  CoachActionBrief,
  CoachApiResponse,
  CoachContext,
  RecommendationQuality,
  RecommendationStrategySummary,
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

type ActionCandidate = {
  id: string
  title: string
  description?: string | null
  goal_id?: string | null
  goal_title?: string | null
  type?: string | null
  priority?: string | null
  completed?: boolean
  start_date?: string | null
  end_date?: string | null
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

function mapActionCandidate(action: CoachActionBrief): ActionCandidate {
  return {
    id: action.id,
    title: action.title,
    description: action.description ?? null,
    goal_id: action.goalId ?? null,
    goal_title: action.goalTitle ?? null,
    type: action.type ?? null,
    priority: action.priority ?? null,
    completed: action.completed ?? false,
    start_date: action.startDate ?? null,
    end_date: action.endDate ?? null,
  }
}

function buildFallbackTodayPlan(params: {
  locale: 'en' | 'zh'
  goals: GoalCandidate[]
  context: CoachContext
}): TodayPlanOutput {
  const primaryGoal = pickPrimaryGoal(params.goals)
  const primaryAction = params.context.actionContext.candidateActions[0] || null
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
          goal_id: primaryAction?.goalId || primaryGoal?.id || null,
          source_action_id: primaryAction?.id || null,
          source_action_title: primaryAction?.title || null,
          source_type: primaryAction ? 'existing_action' : 'new_action',
          reason: primaryAction
            ? '先把你当前这条任务继续推进一小步，最容易立刻进入状态。'
            : lowMomentum ? '先用一个最容易开始的小动作把今天启动起来。' : '先推进当前最重要、最接近结果的一步。',
          variants: [
            {
              minutes: 5,
              title: primaryAction ? `推进：${primaryAction.title}` : `写下${primaryGoal?.title || '当前目标'}的下一步`,
              first_step: primaryAction ? '打开任务并写下下一小步' : '打开文档并写下一步',
              definition_of_done: primaryAction ? '明确并开始一个最小推进动作。' : '明确今天先做哪一步。',
            },
            {
              minutes: 10,
              title: primaryAction ? `完成${primaryAction.title}的一小段` : `完成${primaryGoal?.title || '当前目标'}的一小段`,
              first_step: primaryAction ? '先完成一个最小可见片段' : '先做最小可交付片段',
              definition_of_done: '产出一个可见小结果。',
            },
            {
              minutes: 20,
              title: primaryAction ? `连续推进${primaryAction.title}` : `推进${primaryGoal?.title || '当前目标'}的关键片段`,
              first_step: primaryAction ? '连续推进一个关键片段' : '连续完成一个关键片段',
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
        goal_id: primaryAction?.goalId || primaryGoal?.id || null,
        source_action_id: primaryAction?.id || null,
        source_action_title: primaryAction?.title || null,
        source_type: primaryAction ? 'existing_action' : 'new_action',
        reason: primaryAction
          ? 'Start by pushing one concrete step of your current task so today feels grounded and doable.'
          : lowMomentum
            ? 'Start with the easiest small move that gets you moving today.'
            : 'Start with the most important next step that can create visible progress today.',
        variants: [
          {
            minutes: 5,
            title: primaryAction ? `Advance: ${primaryAction.title}` : `Define the next step for ${primaryGoal?.title || 'your goal'}`,
            first_step: primaryAction ? 'Open the task and define the next tiny step' : 'Open the doc and write the next step',
            definition_of_done: primaryAction ? 'You have started one tiny push on the task.' : 'You know exactly what to do first today.',
          },
          {
            minutes: 10,
            title: primaryAction ? `Finish a small slice of ${primaryAction.title}` : `Finish one small part of ${primaryGoal?.title || 'your goal'}`,
            first_step: 'Complete the smallest deliverable first',
            definition_of_done: 'You produce one visible small result.',
          },
          {
            minutes: 20,
            title: primaryAction ? `Push a focused slice of ${primaryAction.title}` : `Push a key section of ${primaryGoal?.title || 'your goal'}`,
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
  qualityLabels?: RecommendationQuality | null
  strategySummary?: RecommendationStrategySummary | null
}) {
  const {
    supabase,
    userId,
    scene,
    strategyVersion,
    promptVersion,
    inputSummary,
    output,
    fallbackUsed,
    qualityLabels = null,
    strategySummary = null,
  } = params
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
    qualityLabels,
    strategySummary,
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
  actions?: ActionCandidate[]
  requestedRecentContext?: Record<string, unknown>
  timezone?: string
}): Promise<TodayPlanApiResponse> {
  const { supabase, userId, locale, today, goals, actions = [], requestedRecentContext, timezone } = params
  const context = await buildCoachContext({
    supabase,
    userId,
    scene: 'today_plan',
    locale,
    timezone,
    requestedActionContext: actions.map(action => ({
      id: action.id,
      title: action.title,
      description: action.description ?? null,
      goalId: action.goal_id ?? null,
      goalTitle: action.goal_title ?? null,
      type: action.type ?? null,
      priority: action.priority ?? null,
      completed: action.completed ?? false,
      startDate: action.start_date ?? null,
      endDate: action.end_date ?? null,
    })),
  })

  const effectiveGoals = goals.length > 0 ? goals : mapContextGoals(context)
  let output: TodayPlanOutput
  let fallbackUsed = false
  const strategy = buildTodayStrategy({
    context,
    goals: effectiveGoals,
  })
  let qualityLabels: RecommendationQuality | null = null

  try {
    output = await aiTodayPlan({
      locale,
      today,
      goals: effectiveGoals,
      candidate_actions: context.actionContext.candidateActions.map(mapActionCandidate),
      recent_context: {
        ...(requestedRecentContext ?? {}),
        completion_rate_7d: context.behavior.completionRate7d ?? null,
        completion_rate_30d: context.behavior.completionRate30d ?? null,
        daily_score_avg_7d: context.behavior.scoreAvg7d ?? null,
        momentum_bucket: context.behavior.momentumBucket ?? 'unknown',
        likely_frictions: context.frictions.slice(0, 2).map(item => item.reasonTag),
        active_time_bucket: context.behavior.activeTimeBucket ?? null,
      } as Record<string, unknown>,
      strategy: {
        difficulty_mode: strategy.difficultyMode,
        risk_level: strategy.riskLevel,
        selected_goal_id: strategy.selectedGoalId ?? null,
        selected_action_id: strategy.selectedActionId ?? null,
        selected_action_title: strategy.selectedActionTitle ?? null,
        grounding_hints: strategy.groundingHints,
        user_profile_summary: context.profile.summary ?? null,
        preferred_time_bucket: context.profile.preferredTimeBucket ?? context.behavior.activeTimeBucket ?? null,
      },
    })
    qualityLabels = evaluateTodayPlanQuality({ output, strategy })
    if (qualityLabels.requires_fallback) {
      output = buildFallbackTodayPlan({
        locale,
        goals: strategy.selectedGoalId
          ? effectiveGoals.filter(goal => goal.id === strategy.selectedGoalId)
          : effectiveGoals,
        context,
      })
      fallbackUsed = true
    }
  } catch {
    output = buildFallbackTodayPlan({
      locale,
      goals: effectiveGoals,
      context,
    })
    fallbackUsed = true
    qualityLabels = {
      schema_valid: false,
      actionability_score: 1,
      adoption_ready: false,
      requires_fallback: true,
      reasons: ['model_failed_or_invalid_output'],
    }
  }

  const recommendationId = await persistRecommendation({
    supabase,
    userId,
    scene: 'today_plan',
    strategyVersion: strategy.strategyVersion,
    promptVersion: strategy.promptVersion,
    inputSummary: {
      today,
      locale,
      goalIds: effectiveGoals.map(goal => goal.id),
      context: {
        behavior: context.behavior,
        frictions: context.frictions,
        actions: context.actionContext.candidateActions.map(action => ({
          id: action.id,
          title: action.title,
          goalId: action.goalId ?? null,
        })),
      },
    },
    output,
    fallbackUsed,
    qualityLabels,
    strategySummary: strategy,
  })

  return {
    ok: true,
    scene: 'today_plan',
    recommendationId,
    strategyVersion: strategy.strategyVersion,
    promptVersion: strategy.promptVersion,
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    difficultyMode: strategy.difficultyMode,
    riskLevel: strategy.riskLevel,
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
  const strategy = buildRescueStrategy({
    context,
    reasonTag,
    actionTitle: action.title,
  })
  let qualityLabels: RecommendationQuality | null = null
  try {
    output = await aiRescue({
      locale,
      reason_tag: reasonTag,
      action,
      goal,
      strategy: {
        difficulty_mode: strategy.difficultyMode,
        risk_level: strategy.riskLevel,
        grounding_hints: strategy.groundingHints,
      },
    })
    qualityLabels = evaluateRescueQuality(output)
    if (qualityLabels.requires_fallback) {
      output = buildFallbackRescuePlan({
        locale,
        reasonTag,
        actionTitle: action.title,
      })
      fallbackUsed = true
    }
  } catch {
    output = buildFallbackRescuePlan({
      locale,
      reasonTag,
      actionTitle: action.title,
    })
    fallbackUsed = true
    qualityLabels = {
      schema_valid: false,
      actionability_score: 1,
      adoption_ready: false,
      requires_fallback: true,
      reasons: ['model_failed_or_invalid_output'],
    }
  }

  const recommendationId = await persistRecommendation({
    supabase,
    userId,
    scene: 'rescue',
    strategyVersion: strategy.strategyVersion,
    promptVersion: strategy.promptVersion,
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
    qualityLabels,
    strategySummary: strategy,
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
    strategyVersion: strategy.strategyVersion,
    promptVersion: strategy.promptVersion,
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    difficultyMode: strategy.difficultyMode,
    riskLevel: strategy.riskLevel,
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
  const strategy = buildReviewStrategy({
    context,
    score,
    answers,
  })
  let qualityLabels: RecommendationQuality | null = null
  try {
    output = await aiReview({
      locale,
      today,
      score,
      answers,
      strategy: {
        difficulty_mode: strategy.difficultyMode,
        risk_level: strategy.riskLevel,
        grounding_hints: strategy.groundingHints,
      },
    })
    qualityLabels = evaluateReviewQuality(output)
    if (qualityLabels.requires_fallback) {
      output = buildFallbackReviewPlan({
        locale,
        friction: answers.friction || null,
      })
      fallbackUsed = true
    }
  } catch {
    output = buildFallbackReviewPlan({
      locale,
      friction: answers.friction || null,
    })
    fallbackUsed = true
    qualityLabels = {
      schema_valid: false,
      actionability_score: 1,
      adoption_ready: false,
      requires_fallback: true,
      reasons: ['model_failed_or_invalid_output'],
    }
  }

  const recommendationId = await persistRecommendation({
    supabase,
    userId,
    scene: 'review',
    strategyVersion: strategy.strategyVersion,
    promptVersion: strategy.promptVersion,
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
    qualityLabels,
    strategySummary: strategy,
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
    strategyVersion: strategy.strategyVersion,
    promptVersion: strategy.promptVersion,
    model: fallbackUsed ? 'fallback_rule_v1' : getConfiguredAIModel(),
    difficultyMode: strategy.difficultyMode,
    riskLevel: strategy.riskLevel,
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
