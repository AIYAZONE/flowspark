export type SystemNotificationKind = 'shield_granted' | 'milestone_reached' | 'recovery_success'

export type SystemNotificationRow =
  | {
      id: string
      kind: 'shield_granted'
      payload: {
        rule: 'first_3_day' | 'refill_7_day'
        grantedAtStreak: number
        shieldBalanceAfter: number
      }
      read_at: string | null
      created_at: string
    }
  | {
      id: string
      kind: 'milestone_reached'
      payload: {
        milestone: number
        phaseKey: 'starter' | 'steady' | 'deepening' | 'resilient' | 'longrun' | 'identity'
      }
      read_at: string | null
      created_at: string
    }
  | {
      id: string
      kind: 'recovery_success'
      payload: {
        targetDate: string
        currentStreak: number
      }
      read_at: string | null
      created_at: string
    }

export type SystemNotificationCopy = {
  tone: 'success' | 'info'
  title: string
  body: string
}

import { formatStreakFeedbackCopy } from './streak-feedback.ts'

export function formatSystemNotificationCopy(
  notification: SystemNotificationRow,
  opts: { locale: 'zh' | 'en' }
): SystemNotificationCopy {
  const createdAt = Number.isFinite(Date.parse(notification.created_at))
    ? Date.parse(notification.created_at)
    : Date.now()

  if (notification.kind === 'shield_granted') {
    return formatStreakFeedbackCopy(
      {
        kind: 'shield_granted',
        createdAt,
        rule: notification.payload.rule,
        grantedAtStreak: notification.payload.grantedAtStreak,
        shieldBalanceAfter: notification.payload.shieldBalanceAfter,
      },
      opts
    )
  }

  if (notification.kind === 'recovery_success') {
    return formatStreakFeedbackCopy(
      {
        kind: 'recovery_success',
        createdAt,
        targetDate: notification.payload.targetDate,
        currentStreak: notification.payload.currentStreak,
      },
      opts
    )
  }

  return formatStreakFeedbackCopy(
    {
      kind: 'milestone_reached',
      createdAt,
      milestone: notification.payload.milestone,
      phaseKey: notification.payload.phaseKey,
    },
    opts
  )
}
