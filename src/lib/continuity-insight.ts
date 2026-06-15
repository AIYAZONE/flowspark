export type ContinuityInsightCopy = {
  title: string
  summary: string
  advice: string
}

export function buildContinuityInsightCopy(params: {
  locale: 'zh' | 'en'
  currentStreak: number
  shieldBalance: number
  repairCount30: number
  shortOptionShare: number | null
}): ContinuityInsightCopy {
  const isZh = params.locale === 'zh'
  const shortShare = params.shortOptionShare
  const usesShortMore = typeof shortShare === 'number' && shortShare >= 0.6
  const hasRepairs = params.repairCount30 > 0

  const title = isZh ? '连续性洞察' : 'Continuity insights'
  const summary = isZh
    ? `当前连续 ${params.currentStreak} 天，护盾 ${params.shieldBalance} 个。`
    : `Current streak: ${params.currentStreak} days. Shields: ${params.shieldBalance}.`

  if (hasRepairs) {
    return {
      title,
      summary,
      advice: isZh
        ? '最近你更可能需要“优先保连续”。建议先用 5 分钟版本稳定节奏，再逐步提升强度。'
        : 'You recently benefited from continuity first. Use a 5-minute version to stabilize, then ramp up gradually.',
    }
  }

  if (usesShortMore) {
    return {
      title,
      summary,
      advice: isZh
        ? '你更偏好低摩擦起步。系统后续会更优先提供更容易开始的建议版本。'
        : 'You prefer low-friction starts. The system will lean toward easier-to-start options.',
    }
  }

  return {
    title,
    summary,
    advice: isZh
      ? '你的连续性较稳定。可以在不破坏连续的前提下，逐步提高单次推进强度。'
      : 'Your continuity looks stable. You can ramp up intensity gradually without breaking the streak.',
  }
}

