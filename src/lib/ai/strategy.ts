import type {
  CoachActionBrief,
  CoachContext,
  CoachDifficultyMode,
  CoachRiskLevel,
  RecommendationQuality,
  RecommendationStrategySummary,
} from '@/lib/ai/types'
import type { RescueOutput, ReviewOutput, TodayPlanOutput } from '@/lib/ai/phase2aSchemas'

type GoalCandidate = {
  id: string
  title: string
  priority?: string | null
  start_date?: string | null
  end_date?: string | null
  success_criteria?: string | null
  stop_criteria?: string | null
}

function scoreGoal(goal: GoalCandidate) {
  const priorityScore = goal.priority === 'high' ? 30 : goal.priority === 'medium' ? 20 : 10
  const urgencyScore = goal.end_date
    ? Math.max(0, 20 - Math.min(20, Math.floor((new Date(goal.end_date).getTime() - Date.now()) / 86400000)))
    : 0
  const criteriaScore = (goal.success_criteria ? 8 : 0) + (goal.stop_criteria ? 4 : 0)
  return priorityScore + urgencyScore + criteriaScore
}

function computeRiskLevel(context: CoachContext): CoachRiskLevel {
  const lowCompletion = (context.behavior.completionRate7d ?? 0) < 0.45
  const manyFrictions = (context.frictions[0]?.count ?? 0) >= 3
  const profileRisk = !!context.profile.riskOfDropout
  if ((lowCompletion && manyFrictions) || profileRisk) return 'high'
  if (lowCompletion || manyFrictions) return 'medium'
  return 'low'
}

function computeDifficultyMode(context: CoachContext, riskLevel: CoachRiskLevel): CoachDifficultyMode {
  if (riskLevel === 'high') return 'starter'
  if (context.profile.difficultyTolerance === 'low') return 'starter'
  if (context.behavior.momentumBucket === 'high' && context.behavior.completionRate7d && context.behavior.completionRate7d >= 0.7) {
    return 'push'
  }
  return 'balanced'
}

function recentAISummary(context: CoachContext, scene?: string) {
  const rows = scene ? context.recentAI.filter(item => item.scene === scene) : context.recentAI
  const total = rows.length
  const adopted = rows.filter(item => item.adopted).length
  const completed = rows.filter(item => item.completed).length
  return {
    total,
    adoptedRate: total ? adopted / total : 0,
    completedRate: total ? completed / total : 0,
  }
}

function deriveUserPreferenceSignals(context: CoachContext) {
  const optionCounts = { short: 0, long: 0 }
  const rejectCounts = new Map<string, number>()
  const adoptionByScene = new Map<string, { total: number; adopted: number }>()

  function normalizeFeedback(label: string) {
    const trimmed = (label || '').trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('not_fit')) return 'not_fit'
    return trimmed
  }

  for (const item of context.recentAI) {
    const option = item.optionSelected || ''
    if (option === '5m' || option === '10m') optionCounts.short += 1
    else if (option === '20m') optionCounts.long += 1

    const label = normalizeFeedback(item.feedbackLabel || '')
    if (label && label !== 'dismiss' && label !== 'close_result' && label !== 'useful') {
      rejectCounts.set(label, (rejectCounts.get(label) || 0) + 1)
    }

    const scene = item.scene || 'unknown'
    if (!scene || scene === 'unknown') continue
    if (item.adopted == null) continue
    const current = adoptionByScene.get(scene) || { total: 0, adopted: 0 }
    current.total += 1
    if (item.adopted) current.adopted += 1
    adoptionByScene.set(scene, current)
  }

  let prefersShort: boolean | null = null
  const totalOptions = optionCounts.short + optionCounts.long
  if (totalOptions >= 3) {
    if (optionCounts.short >= optionCounts.long * 2) prefersShort = true
    else if (optionCounts.long >= optionCounts.short * 2) prefersShort = false
  }

  let topRejectReason: string | null = null
  for (const [key, count] of rejectCounts.entries()) {
    if (!topRejectReason || count > (rejectCounts.get(topRejectReason) || 0)) {
      topRejectReason = key
    }
  }

  let lowTrustScene: string | null = null
  let lowestRate = 1
  for (const [scene, value] of adoptionByScene.entries()) {
    if (value.total < 3) continue
    const rate = value.total ? value.adopted / value.total : 1
    if (rate < lowestRate) {
      lowestRate = rate
      lowTrustScene = scene
    }
  }
  if (lowestRate >= 0.25) lowTrustScene = null

  return { prefersShort, topRejectReason, lowTrustScene }
}

function distinctNonEmpty(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => !!value && !!value.trim()))]
}

function scoreAction(action: CoachActionBrief, selectedGoalId: string | null) {
  let score = 0
  if (action.type === 'core') score += 30
  if (!action.completed) score += 20
  if (selectedGoalId && action.goalId === selectedGoalId) score += 20
  if (action.priority === 'high') score += 15
  else if (action.priority === 'medium') score += 8
  if (action.description) score += 3
  if (action.endDate) {
    const days = Math.floor((new Date(action.endDate).getTime() - Date.now()) / 86400000)
    score += Math.max(0, 8 - Math.min(8, Math.abs(days)))
  }
  return score
}

export function buildTodayStrategy(params: {
  context: CoachContext
  goals: GoalCandidate[]
}): RecommendationStrategySummary {
  const { context, goals } = params
  const riskLevel = computeRiskLevel(context)
  const signals = deriveUserPreferenceSignals(context)
  let difficultyMode = computeDifficultyMode(context, riskLevel)
  if (signals.prefersShort === true && difficultyMode === 'push') difficultyMode = 'balanced'
  if (signals.lowTrustScene === 'today_plan' && difficultyMode === 'push') difficultyMode = 'balanced'
  if (signals.topRejectReason === 'no_time' || signals.topRejectReason === 'too_hard') {
    difficultyMode = 'starter'
  }
  const scoredGoal = [...goals].sort((a, b) => scoreGoal(b) - scoreGoal(a))[0] || null
  const prioritizedActions = [
    ...context.actionContext.todayOpen,
    ...context.actionContext.overdueOpen,
    ...context.actionContext.candidateActions,
  ]
  const selectedAction = [...prioritizedActions]
    .sort((a, b) => scoreAction(b, scoredGoal?.id || null) - scoreAction(a, scoredGoal?.id || null))[0] || null
  const selectedGoal =
    (selectedAction?.goalId ? goals.find(goal => goal.id === selectedAction.goalId) ?? null : null) || scoredGoal
  const recentToday = recentAISummary(context, 'today_plan')
  const groundingHints = distinctNonEmpty([
    selectedGoal ? `selected_goal:${selectedGoal.title}` : null,
    selectedAction ? `selected_action:${selectedAction.title}` : null,
    context.profile.summary ? `profile_summary:${context.profile.summary}` : null,
    context.profile.preferredTimeBucket ? `preferred_time_bucket:${context.profile.preferredTimeBucket}` : null,
    context.frictions[0]?.reasonTag ? `top_friction:${context.frictions[0].reasonTag}` : null,
    context.behavior.momentumBucket ? `momentum:${context.behavior.momentumBucket}` : null,
    `recent_today_adoption:${Math.round(recentToday.adoptedRate * 100)}%`,
    signals.prefersShort == null ? null : `prefers_short:${signals.prefersShort ? 'yes' : 'no'}`,
    signals.topRejectReason ? `top_reject_reason:${signals.topRejectReason}` : null,
    signals.lowTrustScene ? `low_trust_scene:${signals.lowTrustScene}` : null,
  ])

  return {
    scene: 'today_plan',
    strategyVersion: 'phase_c_v1',
    promptVersion: 'today_plan_v3',
    difficultyMode,
    riskLevel,
    selectedGoalId: selectedGoal?.id || null,
    selectedActionId: selectedAction?.id || null,
    selectedActionTitle: selectedAction?.title || null,
    groundingHints,
    fallbackPolicy: riskLevel === 'high'
      ? ['prefer_starter_variant', 'fallback_on_low_actionability']
      : ['fallback_on_invalid_output'],
  }
}

export function buildRescueStrategy(params: {
  context: CoachContext
  reasonTag: RescueOutput['reason_tag']
  actionTitle: string
}): RecommendationStrategySummary {
  const riskLevel = computeRiskLevel(params.context)
  const signals = deriveUserPreferenceSignals(params.context)
  let difficultyMode: CoachDifficultyMode =
    params.reasonTag === 'no_time' || params.reasonTag === 'low_energy'
      ? 'starter'
      : riskLevel === 'high'
        ? 'starter'
        : 'balanced'
  if (signals.lowTrustScene === 'rescue') difficultyMode = 'starter'
  if (signals.topRejectReason === 'no_time' || signals.topRejectReason === 'too_hard') difficultyMode = 'starter'

  return {
    scene: 'rescue',
    strategyVersion: 'phase_c_v1',
    promptVersion: 'rescue_v2',
    difficultyMode,
    riskLevel,
    selectedGoalId: null,
    groundingHints: distinctNonEmpty([
      `reason:${params.reasonTag}`,
      `action:${params.actionTitle}`,
      params.context.frictions[0]?.reasonTag ? `top_friction:${params.context.frictions[0].reasonTag}` : null,
      signals.prefersShort == null ? null : `prefers_short:${signals.prefersShort ? 'yes' : 'no'}`,
      signals.topRejectReason ? `top_reject_reason:${signals.topRejectReason}` : null,
    ]),
    fallbackPolicy: ['minimal_variant_under_5_to_10_minutes', 'fallback_on_non_minimal_output'],
  }
}

export function buildReviewStrategy(params: {
  context: CoachContext
  score: number | null
  answers: Record<string, string>
}): RecommendationStrategySummary {
  const riskLevel = computeRiskLevel(params.context)
  const signals = deriveUserPreferenceSignals(params.context)
  let difficultyMode: CoachDifficultyMode =
    riskLevel === 'high' || (params.score != null && params.score <= 2) ? 'starter' : 'balanced'
  if (signals.lowTrustScene === 'review') difficultyMode = 'starter'
  if (signals.topRejectReason === 'too_hard') difficultyMode = 'starter'

  return {
    scene: 'review',
    strategyVersion: 'phase_c_v1',
    promptVersion: 'review_v2',
    difficultyMode,
    riskLevel,
    selectedGoalId: null,
    groundingHints: distinctNonEmpty([
      params.answers.friction ? `reported_friction:${params.answers.friction}` : null,
      params.context.frictions[0]?.reasonTag ? `top_friction:${params.context.frictions[0].reasonTag}` : null,
      params.context.profile.riskOfDropout ? `dropout_risk:${params.context.profile.riskOfDropout}` : null,
      signals.prefersShort == null ? null : `prefers_short:${signals.prefersShort ? 'yes' : 'no'}`,
      signals.topRejectReason ? `top_reject_reason:${signals.topRejectReason}` : null,
    ]),
    fallbackPolicy: ['fallback_on_empty_tomorrow_card', 'prefer_minimal_if_then'],
  }
}

export function evaluateTodayPlanQuality(params: {
  output: TodayPlanOutput
  strategy: RecommendationStrategySummary
}): RecommendationQuality {
  const core = params.output.recommendations.find(item => item.kind === 'core')
  const reasons: string[] = []
  let score = 5
  if (!core) {
    reasons.push('missing_core_recommendation')
    score -= 4
  }
  if (params.strategy.selectedGoalId && core?.goal_id !== params.strategy.selectedGoalId) {
    reasons.push('core_not_grounded_to_selected_goal')
    score -= 2
  }
  const titles = (core?.variants || []).map(item => item.title)
  const uniqueTitleStems = new Set(titles.map(item => item.replace(/\s+/g, '').slice(0, 10)))
  if (uniqueTitleStems.size > 2) {
    reasons.push('variants_not_aligned')
    score -= 2
  }
  if ((core?.reason || '').length < 8) {
    reasons.push('reason_too_short')
    score -= 1
  }
  const actionability = Math.max(0, Math.min(5, score))
  return {
    schema_valid: true,
    actionability_score: actionability,
    adoption_ready: actionability >= 3,
    requires_fallback: actionability <= 2,
    reasons,
  }
}

export function evaluateRescueQuality(output: RescueOutput): RecommendationQuality {
  const reasons: string[] = []
  let score = 5
  if ((output.minimal_variant.title || '').length < 4) {
    reasons.push('minimal_title_too_short')
    score -= 1
  }
  if ((output.if_then.then || '').length < 4) {
    reasons.push('if_then_not_actionable')
    score -= 2
  }
  return {
    schema_valid: true,
    actionability_score: Math.max(0, Math.min(5, score)),
    adoption_ready: score >= 3,
    requires_fallback: score <= 2,
    reasons,
  }
}

export function evaluateReviewQuality(output: ReviewOutput): RecommendationQuality {
  const reasons: string[] = []
  let score = 5
  if ((output.tomorrow_card.suggested_core_action_direction || '').length < 6) {
    reasons.push('direction_too_weak')
    score -= 2
  }
  if ((output.tomorrow_card.if_then.then || '').length < 4) {
    reasons.push('if_then_then_too_short')
    score -= 1
  }
  return {
    schema_valid: true,
    actionability_score: Math.max(0, Math.min(5, score)),
    adoption_ready: score >= 3,
    requires_fallback: score <= 2,
    reasons,
  }
}
