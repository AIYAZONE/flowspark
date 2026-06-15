export type StreakStatusCopy = {
  title: string
  body: string
  action: string | null
}

export type ShieldBadgeAction = 'recover' | 'rules'

export function getShieldBadgeAction(params: {
  shieldBalance: number
  recoverableMissDate: string | null
}): ShieldBadgeAction {
  if (params.shieldBalance > 0 && params.recoverableMissDate) {
    return 'recover'
  }

  return 'rules'
}

export function getShieldBadgeDialogCopy(params: {
  locale: 'zh' | 'en'
  shieldBalance: number
  nextGrantAtStreak: number
}) {
  const isZh = params.locale === 'zh'

  return {
    title: isZh ? '护盾怎么用' : 'How shields work',
    body: isZh
      ? `护盾只能补回昨天漏掉的 1 天。你当前有 ${params.shieldBalance} 个护盾；继续保持连续，到 ${params.nextGrantAtStreak} 天会获得下一次护盾。`
      : `Shields can only recover a missed yesterday. You currently have ${params.shieldBalance} shield${params.shieldBalance === 1 ? '' : 's'}; keep the streak going to ${params.nextGrantAtStreak} days for the next shield.`,
  }
}

export function getStreakStatusCopy(params: {
  locale: 'zh' | 'en'
  streak: number
  todayCompleted: boolean
  shieldBalance: number
  recoverableMissDate: string | null
  nextGrantAtStreak: number
}): StreakStatusCopy {
  const isZh = params.locale === 'zh'

  if (params.recoverableMissDate && params.shieldBalance > 0) {
    return {
      title: isZh ? '昨天漏掉了 1 天，还能补回' : 'Yesterday is still recoverable',
      body: isZh
        ? `你有 ${params.shieldBalance} 个护盾，可补回 ${params.recoverableMissDate}。`
        : `You have ${params.shieldBalance} shield${params.shieldBalance > 1 ? 's' : ''} and can recover ${params.recoverableMissDate}.`,
      action: isZh ? '恢复昨天连续' : 'Recover Yesterday',
    }
  }

  if (params.recoverableMissDate) {
    return {
      title: isZh ? '昨天漏掉了，但现在没有护盾' : 'Yesterday was missed and no shield is available',
      body: isZh
        ? `先从今天的最小行动重新起步；连续到 ${params.nextGrantAtStreak} 天可再次获得护盾。`
        : `Restart with a 5-minute version today. Reach ${params.nextGrantAtStreak} days to earn the next shield.`,
      action: null,
    }
  }

  if (params.streak > 0) {
    if (params.todayCompleted) {
      return {
        title: isZh ? '今天已保住连续' : 'Today is already secured',
        body: isZh
          ? `今天已有完成记录；连续到 ${params.nextGrantAtStreak} 天可获下一次护盾。`
          : `You already completed something today. Keep it going and reach ${params.nextGrantAtStreak} days for the next shield.`,
        action: null,
      }
    }

    return {
      title: isZh ? '今天再推进一步，就能保住连续' : 'One more step today keeps the streak alive',
      body: isZh
        ? `先完成 1 个最小行动；连续到 ${params.nextGrantAtStreak} 天可获下一次护盾。`
        : `Complete a 5-minute minimum action today. Reach ${params.nextGrantAtStreak} days for the next shield.`,
      action: null,
    }
  }

  return {
    title: isZh ? '从一个最小行动重新开始' : 'Restart with one minimum action',
    body: isZh
      ? `连续到 ${params.nextGrantAtStreak} 天后会获得首个护盾。`
      : `Earn your first shield when you reach ${params.nextGrantAtStreak} days.`,
    action: null,
  }
}
