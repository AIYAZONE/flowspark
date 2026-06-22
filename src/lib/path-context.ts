type Locale = 'zh' | 'en'

type GoalLike = {
  id: string
  title: string
  priority?: string | null
  start_date?: string | null
  end_date?: string | null
  success_criteria?: string | null
  stop_criteria?: string | null
  actions?: Array<{ id: string; completed?: boolean | null }> | null
}

export type PrimaryPathContext = {
  goalId: string
  title: string
  stageLabel: string
  titleText: string
  body: string
  evidence: string
  ctaLabel: string
}

function compareGoals(a: GoalLike, b: GoalLike) {
  const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
  const pA = pMap[a.priority || 'medium'] ?? 2
  const pB = pMap[b.priority || 'medium'] ?? 2
  if (pA !== pB) return pB - pA

  const endA = a.end_date || '9999-12-31'
  const endB = b.end_date || '9999-12-31'
  if (endA !== endB) return endA < endB ? -1 : 1

  const startA = a.start_date || '9999-12-31'
  const startB = b.start_date || '9999-12-31'
  if (startA !== startB) return startA < startB ? -1 : 1

  return a.title.localeCompare(b.title)
}

function diffDays(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00.000Z`).getTime()
  const to = new Date(`${toDate}T00:00:00.000Z`).getTime()
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}

export function buildPrimaryPathContext(params: {
  locale: Locale
  today: string
  goals: GoalLike[]
}): PrimaryPathContext | null {
  const { locale, today, goals } = params
  const isZh = locale === 'zh'
  const primaryGoal = [...goals].sort(compareGoals)[0]
  if (!primaryGoal) return null

  const actions = primaryGoal.actions || []
  const totalActions = actions.length
  const completedActions = actions.filter((action) => action.completed).length
  const progress = totalActions > 0 ? completedActions / totalActions : 0
  const daysToDeadline = primaryGoal.end_date ? diffDays(today, primaryGoal.end_date) : null

  if (totalActions === 0) {
    return {
      goalId: primaryGoal.id,
      title: primaryGoal.title,
      stageLabel: isZh ? 'Path Stage' : 'Path Stage',
      titleText: isZh ? '这条路径还在落点阶段，今天先把它变成可执行。' : 'This path is still in its setup stage, so today should make it executable.',
      body: isZh
        ? `「${primaryGoal.title}」已经是当前最重要的路径，但系统还没有看到足够的行动承接。今天最值钱的一步，是把方向落成一个具体动作。`
        : `"${primaryGoal.title}" is already your highest-priority path, but the system still lacks enough execution support. The best move today is to turn direction into a concrete action.`,
      evidence: isZh
        ? '当前优先级最高，但还没有挂接行动，说明它是方向明确、执行尚未落地的主线路径。'
        : 'It is currently the highest-priority path, but it has no attached actions yet, which means direction is clear while execution is not grounded.',
      ctaLabel: isZh ? '去完善这条路径' : 'Refine this path',
    }
  }

  if (completedActions === 0) {
    return {
      goalId: primaryGoal.id,
      title: primaryGoal.title,
      stageLabel: isZh ? 'Path Stage' : 'Path Stage',
      titleText: isZh ? '这条路径已进入启动期，今天先让它发生第一次真实推进。' : 'This path has entered activation, so today should create the first real move.',
      body: isZh
        ? `「${primaryGoal.title}」已经有承接动作，但系统还没看到完成信号。今天最重要的不是做很多，而是拿到第一次真实完成。`
        : `"${primaryGoal.title}" already has supporting actions, but the system has not seen a completion signal yet. Today matters less for volume and more for getting the first real completion.`,
      evidence: isZh
        ? `这条路径下已有 ${totalActions} 个动作，但完成数仍为 0。`
        : `This path already has ${totalActions} actions underneath it, but completions are still at 0.`,
      ctaLabel: isZh ? '去推进这条路径' : 'Move this path',
    }
  }

  if ((daysToDeadline != null && daysToDeadline <= 7) || progress >= 0.8) {
    return {
      goalId: primaryGoal.id,
      title: primaryGoal.title,
      stageLabel: isZh ? 'Path Stage' : 'Path Stage',
      titleText: isZh ? '这条路径进入收口窗口，今天更适合完成关键闭环。' : 'This path is in a closing window, so today should finish the key loop.',
      body: isZh
        ? `「${primaryGoal.title}」已经推进到后半段，今天系统更倾向收关键尾，而不是继续横向扩展。`
        : `"${primaryGoal.title}" is already in its later phase, so today the system prefers closing critical loops instead of expanding sideways.`,
      evidence: isZh
        ? daysToDeadline != null && daysToDeadline <= 7
          ? `距离路径截止只剩 ${daysToDeadline} 天，且已出现稳定完成信号。`
          : `这条路径当前完成度约 ${Math.round(progress * 100)}%，说明它更接近收口而不是起步。`
        : daysToDeadline != null && daysToDeadline <= 7
          ? `Only ${daysToDeadline} day(s) remain before the path deadline, and completion signals are already present.`
          : `This path is about ${Math.round(progress * 100)}% complete, which places it closer to closing than to starting.`,
      ctaLabel: isZh ? '去收关键尾' : 'Close the loop',
    }
  }

  if (progress >= 0.35) {
    return {
      goalId: primaryGoal.id,
      title: primaryGoal.title,
      stageLabel: isZh ? 'Path Stage' : 'Path Stage',
      titleText: isZh ? '这条路径处在稳定推进期，今天应继续压实主线。' : 'This path is in a steady execution phase, so today should keep pressing the main thread forward.',
      body: isZh
        ? `「${primaryGoal.title}」已经不是概念阶段，系统会把今天的主线更多压向持续推进，而不是重新判断方向。`
        : `"${primaryGoal.title}" is no longer in a conceptual phase. The system should push today toward sustained execution instead of rethinking direction.`,
      evidence: isZh
        ? `这条路径已完成 ${completedActions}/${totalActions} 个动作，说明执行链条已经启动。`
        : `This path has completed ${completedActions}/${totalActions} actions, which means the execution chain is already active.`,
      ctaLabel: isZh ? '继续压实主线' : 'Keep the main thread moving',
    }
  }

  return {
    goalId: primaryGoal.id,
    title: primaryGoal.title,
    stageLabel: isZh ? 'Path Stage' : 'Path Stage',
    titleText: isZh ? '这条路径还在铺轨期，今天先把执行密度做起来。' : 'This path is still laying tracks, so today should build execution density.',
    body: isZh
      ? `「${primaryGoal.title}」已经有起步信号，但系统还需要更多连续推进来确认它真正进入稳定主线。`
      : `"${primaryGoal.title}" already shows starting signals, but the system still needs more repeated execution to confirm it as a stable main thread.`,
    evidence: isZh
      ? `这条路径已有 ${completedActions} 次完成，但整体推进还未进入后半程。`
      : `This path already has ${completedActions} completions, but overall progress is not yet in the later phase.`,
    ctaLabel: isZh ? '继续铺轨推进' : 'Build momentum',
  }
}
