export type StreakStatusCopy = {
  title: string
  body: string
  action: string | null
}

export function getStreakStatusCopy(params: {
  locale: 'zh' | 'en'
  streak: number
  shieldBalance: number
  recoverableMissDate: string | null
  nextGrantAtStreak: number
}): StreakStatusCopy {
  const isZh = params.locale === 'zh'

  if (params.recoverableMissDate && params.shieldBalance > 0) {
    return {
      title: isZh ? '昨天漏掉了 1 天，还能补回' : 'Yesterday is still recoverable',
      body: isZh
        ? `你有 ${params.shieldBalance} 个护盾，可以补回 ${params.recoverableMissDate}，连续性不会断。`
        : `You have ${params.shieldBalance} shield${params.shieldBalance > 1 ? 's' : ''} and can recover ${params.recoverableMissDate}.`,
      action: isZh ? '恢复昨天连续' : 'Recover Yesterday',
    }
  }

  if (params.recoverableMissDate) {
    return {
      title: isZh ? '昨天漏掉了，但现在没有护盾' : 'Yesterday was missed and no shield is available',
      body: isZh
        ? `先从今天的 5 分钟最小行动重新起步；连续到 ${params.nextGrantAtStreak} 天可再次获得护盾。`
        : `Restart with a 5-minute version today. Reach ${params.nextGrantAtStreak} days to earn the next shield.`,
      action: null,
    }
  }

  if (params.streak > 0) {
    return {
      title: isZh ? '今天再推进一步，就能保住连续' : 'One more step today keeps the streak alive',
      body: isZh
        ? `优先完成一个 5 分钟最小行动；连续达到 ${params.nextGrantAtStreak} 天可获得下一次护盾。`
        : `Complete a 5-minute minimum action today. Reach ${params.nextGrantAtStreak} days for the next shield.`,
      action: null,
    }
  }

  return {
    title: isZh ? '从一个最小行动重新开始' : 'Restart with one minimum action',
    body: isZh
      ? `连续达到 ${params.nextGrantAtStreak} 天后会获得首个护盾。`
      : `Earn your first shield when you reach ${params.nextGrantAtStreak} days.`,
    action: null,
  }
}

