export function getTodayMainThreadCopy(input: {
  locale: 'zh' | 'en'
  showStreakRiskBanner: boolean
  streakBannerBody: string
  hasTomorrowHandoff: boolean
  nextActionTitle: string | null
}): { title: string; body: string } {
  const isZh = input.locale === 'zh'

  if (input.showStreakRiskBanner) {
    return {
      title: isZh ? '今天先保连续，不先追求更多' : 'Protect continuity before chasing more today',
      body: input.streakBannerBody,
    }
  }

  if (input.hasTomorrowHandoff) {
    return {
      title: isZh ? '先把昨天的 momentum 接回来' : 'Bring yesterday’s momentum forward first',
      body: isZh
        ? '系统优先建议你延续昨天已经完成的 AI 核心行动，让推进感不要断掉。'
        : 'The system recommends extending yesterday’s completed AI core action so momentum stays alive.',
    }
  }

  if (input.nextActionTitle) {
    return {
      title: isZh
        ? `今天的主线是推进「${input.nextActionTitle}」`
        : `Today’s main thread is "${input.nextActionTitle}"`,
      body: isZh
        ? '今天不需要做更多决定。先把这一条推进到发生，其余信息都应该为它让路。'
        : 'You do not need more decisions today. Push this one thing forward and let everything else support it.',
    }
  }

  return {
    title: isZh ? '今天的执行层已经收口' : 'Today’s execution layer is closed',
    body: isZh
      ? '主线已经完成。接下来更适合补复盘、收口和为明天留出承接。'
      : 'The main thread is already complete. The next best move is to review, close the loop, and prepare tomorrow.',
  }
}

