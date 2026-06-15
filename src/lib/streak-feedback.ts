export type StreakFeedback =
  | {
      kind: 'shield_granted'
      createdAt: number
      rule: 'first_3_day' | 'refill_7_day'
      shieldBalanceAfter: number
    }
  | {
      kind: 'recovery_success'
      createdAt: number
      targetDate: string
      currentStreak: number
    }
  | {
      kind: 'rescue_adopted'
      createdAt: number
      minutes: 5 | 10 | 20
      mode: 'replace' | 'add'
    }

type BuildParams =
  | Omit<Extract<StreakFeedback, { kind: 'shield_granted' }>, 'createdAt'>
  | Omit<Extract<StreakFeedback, { kind: 'recovery_success' }>, 'createdAt'>
  | Omit<Extract<StreakFeedback, { kind: 'rescue_adopted' }>, 'createdAt'>

export function buildStreakFeedback(params: BuildParams, opts?: { now?: number }): StreakFeedback {
  const createdAt = typeof opts?.now === 'number' ? opts.now : Date.now()
  return { ...params, createdAt } as StreakFeedback
}

export function isStreakFeedbackFresh(
  feedback: StreakFeedback,
  opts?: { now?: number; maxAgeMs?: number }
) {
  const now = typeof opts?.now === 'number' ? opts.now : Date.now()
  const maxAgeMs = typeof opts?.maxAgeMs === 'number' ? opts.maxAgeMs : 2 * 60 * 1000
  if (!Number.isFinite(feedback.createdAt)) return false
  return now - feedback.createdAt >= 0 && now - feedback.createdAt <= maxAgeMs
}

export type StreakFeedbackCopy = {
  tone: 'success' | 'info'
  title: string
  body: string
}

export function formatStreakFeedbackCopy(
  feedback: StreakFeedback,
  opts: { locale: 'zh' | 'en' }
): StreakFeedbackCopy {
  const isZh = opts.locale === 'zh'

  if (feedback.kind === 'shield_granted') {
    return {
      tone: 'success',
      title: isZh ? '护盾已到账' : 'Shield unlocked',
      body: isZh
        ? `你获得了 1 个护盾（当前 ${feedback.shieldBalanceAfter} 个）。护盾可用于补回昨天的连续，不会额外获得 XP。`
        : `You earned 1 shield (now ${feedback.shieldBalanceAfter}). Shields can recover a missed yesterday and do not grant extra XP.`,
    }
  }

  if (feedback.kind === 'recovery_success') {
    return {
      tone: 'success',
      title: isZh ? '已补回昨天' : 'Yesterday recovered',
      body: isZh
        ? `已补回 ${feedback.targetDate}，当前连续 ${feedback.currentStreak} 天。`
        : `Recovered ${feedback.targetDate}. Current streak: ${feedback.currentStreak} days.`,
    }
  }

  return {
    tone: 'info',
    title: isZh ? '保连续优先' : 'Streak-safe mode',
    body: isZh
      ? `已采用 ${feedback.minutes} 分钟最小版本，先保住连续性，再逐步提升强度。`
      : `Adopted the ${feedback.minutes}-minute minimum version to preserve your streak first, then ramp up.`,
  }
}

