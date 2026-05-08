import type {
  RescueOutput,
  ReviewOutput,
  TodayPlanOutput,
} from '@/lib/ai/phase2aSchemas'

export type CoachScene =
  | 'goal_setup'
  | 'today_plan'
  | 'rescue'
  | 'review'
  | 'weekly_insight'

export type CoachConfidence = 'low' | 'medium' | 'high'
export type CoachDifficultyMode = 'starter' | 'balanced' | 'push'
export type CoachRiskLevel = 'low' | 'medium' | 'high'

export type RecommendationQuality = {
  schema_valid: boolean
  actionability_score: number
  adoption_ready: boolean
  requires_fallback: boolean
  reasons: string[]
}

export type RecommendationStrategySummary = {
  scene: CoachScene
  strategyVersion: string
  promptVersion: string
  difficultyMode?: CoachDifficultyMode
  riskLevel?: CoachRiskLevel
  selectedGoalId?: string | null
  groundingHints: string[]
  fallbackPolicy: string[]
}

export type CoachApiResponse<T> = {
  ok: boolean
  scene: CoachScene
  recommendationId?: string
  strategyVersion?: string
  promptVersion?: string
  model?: string
  data?: T
  confidence?: CoachConfidence
  fallbackUsed?: boolean
  errorCode?: string
}

export type CoachMomentumBucket = 'high' | 'medium' | 'low' | 'unknown'

export type CoachContext = {
  identity: {
    userId: string
    locale: 'zh' | 'en'
    timezone: string
  }
  profile: {
    primaryGoalArea?: string | null
    preferredTimeBucket?: string | null
    motivationStyle?: string | null
    difficultyTolerance?: string | null
    riskOfDropout?: string | null
    currentStage?: string | null
    summary?: string | null
  }
  goals: Array<{
    id: string
    title: string
    priority: string | null
    status?: string | null
    startDate?: string | null
    endDate?: string | null
    successCriteria?: string | null
    stopCriteria?: string | null
  }>
  behavior: {
    completionRate7d?: number | null
    completionRate30d?: number | null
    scoreAvg7d?: number | null
    momentumBucket?: CoachMomentumBucket
    activeTimeBucket?: string | null
  }
  frictions: Array<{
    reasonTag: string
    count: number
    lastOccurredAt: string
  }>
  recentAI: Array<{
    scene: string
    adopted: boolean | null
    completed: boolean | null
  }>
}

export type WeeklyInsightOutput = {
  type: 'weekly_insight'
  summary: string
  momentum: CoachMomentumBucket
  strongestTimeBucket: string | null
  topFriction: string | null
  recommendation: string
  confidence?: CoachConfidence
}

export type TodayPlanApiResponse = CoachApiResponse<TodayPlanOutput>
export type RescueApiResponse = CoachApiResponse<RescueOutput>
export type ReviewApiResponse = CoachApiResponse<ReviewOutput>
export type WeeklyInsightApiResponse = CoachApiResponse<WeeklyInsightOutput>
