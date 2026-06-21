import type { RewardResult } from '@/lib/rewards'
import type { StreakFeedback } from '@/lib/streak-feedback'

export type CompletionStreakSource = {
  shieldGrantedRule?: 'first_3_day' | 'refill_7_day' | null
  shieldGrantedAtStreak?: number | null
  shieldBalance?: number | null
  milestoneReached?: {
    milestone: number
    phaseKey: 'starter' | 'steady' | 'deepening' | 'resilient' | 'longrun' | 'identity'
  } | null
} | null

export type CompletionToastPayload =
  | {
      variant: 'streak'
      feedback: CompletionStreakFeedback
    }
  | {
      variant: 'ai_xp'
      actionTitle: string
      xpEarned: number
    }
  | {
      variant: 'ai_only'
      actionTitle: string
    }
  | {
      variant: 'xp_only'
      xpEarned: number
    }

export type CompletionFeedback =
  | {
      kind: 'modal'
      reward: RewardResult
      createdAt: number
      suppressedSignals: string[]
    }
  | {
      kind: 'toast'
      toast: CompletionToastPayload
      createdAt: number
      suppressedSignals: string[]
    }

export type CompletionFeedbackInput = {
  actionTitle: string
  aiCompleted: boolean
  xpEarned?: number | null
  reward?: RewardResult | null
  streak?: CompletionStreakSource
}

type CompletionStreakFeedback = Extract<StreakFeedback, { kind: 'shield_granted' | 'milestone_reached' }>

const COMPLETION_FEEDBACK_STORAGE_KEY = 'completion_feedback_v1'
export const COMPLETION_FEEDBACK_EVENT = 'completion_feedback_updated'
const COMPLETION_FEEDBACK_MAX_AGE_MS = 15_000

function isCompletionFeedbackFresh(feedback: CompletionFeedback, now = Date.now()) {
  return now - feedback.createdAt >= 0 && now - feedback.createdAt <= COMPLETION_FEEDBACK_MAX_AGE_MS
}

export function pickCompletionStreakFeedback(streak?: CompletionStreakSource): CompletionStreakFeedback | null {
  if (
    streak?.shieldGrantedRule &&
    typeof streak.shieldGrantedAtStreak === 'number'
  ) {
    return {
      kind: 'shield_granted',
      createdAt: Date.now(),
      rule: streak.shieldGrantedRule,
      grantedAtStreak: streak.shieldGrantedAtStreak,
      shieldBalanceAfter: streak.shieldBalance ?? 0,
    }
  }

  if (streak?.milestoneReached) {
    return {
      kind: 'milestone_reached',
      createdAt: Date.now(),
      milestone: streak.milestoneReached.milestone,
      phaseKey: streak.milestoneReached.phaseKey,
    }
  }

  return null
}

export function buildCompletionFeedback(
  input: CompletionFeedbackInput,
  opts?: { now?: number }
): CompletionFeedback | null {
  const createdAt = typeof opts?.now === 'number' ? opts.now : Date.now()
  const xpEarned = typeof input.xpEarned === 'number' && Number.isFinite(input.xpEarned)
    ? Math.max(0, Math.round(input.xpEarned))
    : 0
  const streakFeedback = pickCompletionStreakFeedback(input.streak)

  if (input.reward) {
    return {
      kind: 'modal',
      reward: input.reward,
      createdAt,
      suppressedSignals: [
        streakFeedback ? streakFeedback.kind : null,
        input.aiCompleted ? 'ai_completion' : null,
        xpEarned > 0 ? 'xp' : null,
      ].filter((value): value is string => Boolean(value)),
    }
  }

  if (streakFeedback) {
    return {
      kind: 'toast',
      toast: {
        variant: 'streak',
        feedback: streakFeedback,
      },
      createdAt,
      suppressedSignals: [
        input.aiCompleted ? 'ai_completion' : null,
        xpEarned > 0 ? 'xp' : null,
      ].filter((value): value is string => Boolean(value)),
    }
  }

  if (input.aiCompleted && xpEarned > 0) {
    return {
      kind: 'toast',
      toast: {
        variant: 'ai_xp',
        actionTitle: input.actionTitle,
        xpEarned,
      },
      createdAt,
      suppressedSignals: [],
    }
  }

  if (input.aiCompleted) {
    return {
      kind: 'toast',
      toast: {
        variant: 'ai_only',
        actionTitle: input.actionTitle,
      },
      createdAt,
      suppressedSignals: [],
    }
  }

  if (xpEarned > 0) {
    return {
      kind: 'toast',
      toast: {
        variant: 'xp_only',
        xpEarned,
      },
      createdAt,
      suppressedSignals: [],
    }
  }

  return null
}

export function readCompletionFeedback() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(COMPLETION_FEEDBACK_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CompletionFeedback
    if (!parsed || typeof parsed !== 'object') return null
    if (!('kind' in parsed) || !('createdAt' in parsed)) return null
    if (!isCompletionFeedbackFresh(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearCompletionFeedback() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(COMPLETION_FEEDBACK_STORAGE_KEY)
  } catch {
  }
}

export function dispatchCompletionFeedback(input: CompletionFeedbackInput) {
  if (typeof window === 'undefined') return null

  const feedback = buildCompletionFeedback(input)
  if (!feedback) return null

  try {
    window.sessionStorage.setItem(COMPLETION_FEEDBACK_STORAGE_KEY, JSON.stringify(feedback))
    window.dispatchEvent(new Event(COMPLETION_FEEDBACK_EVENT))
    return feedback
  } catch {
    return null
  }
}
