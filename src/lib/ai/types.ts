import type { TodayPlanOutput } from '@/lib/ai/phase2aSchemas'

export type CoachScene =
  | 'goal_setup'
  | 'today_plan'
  | 'rescue'
  | 'review'
  | 'weekly_insight'

export type CoachConfidence = 'low' | 'medium' | 'high'

export type CoachApiResponse<T> = {
  ok: boolean
  scene: CoachScene
  recommendationId?: string
  data?: T
  confidence?: CoachConfidence
  fallbackUsed?: boolean
  errorCode?: string
}

export type TodayPlanApiResponse = CoachApiResponse<TodayPlanOutput>
