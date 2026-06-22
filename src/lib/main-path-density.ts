import type { PrimaryPathContext } from '@/lib/path-context'

type Locale = 'zh' | 'en'

export type MainPathDensityContext = {
  goalId: string
  recentMetricStatus: 'ready' | 'fallback' | 'hidden'
  recentCompletedCount7d: number | null
  recentActiveCount7d: number | null
  completionCount: number
  remainingCount: number
  totalCount: number
  recentSummary: string | null
  progressSummary: string
  meaningSummary: string
}

export function buildMainPathDensityContext(params: {
  locale: Locale
  primaryPathContext: PrimaryPathContext | null
  totalCount: number
  completionCount: number
  recentCompletedCount7d: number | null
  recentActiveCount7d: number | null
}): MainPathDensityContext | null {
  const {
    locale,
    primaryPathContext,
    totalCount,
    completionCount,
    recentCompletedCount7d,
    recentActiveCount7d,
  } = params

  if (!primaryPathContext) return null

  const isZh = locale === 'zh'
  const remainingCount = Math.max(totalCount - completionCount, 0)

  const recentMetricStatus: MainPathDensityContext['recentMetricStatus'] =
    typeof recentCompletedCount7d === 'number' && recentCompletedCount7d > 0
      ? 'ready'
      : typeof recentActiveCount7d === 'number' && recentActiveCount7d > 0
        ? 'fallback'
        : 'hidden'

  const recentSummary =
    recentMetricStatus === 'ready'
      ? (isZh
          ? `近 7 天推进 ${recentCompletedCount7d} 次`
          : `${recentCompletedCount7d} moves in the last 7 days`)
      : recentMetricStatus === 'fallback'
        ? (isZh
            ? `近 7 天主线有 ${recentActiveCount7d} 次活跃`
            : `${recentActiveCount7d} main-path touches in the last 7 days`)
        : null

  const progressSummary = isZh
    ? `已完成 ${completionCount} / 共 ${totalCount}`
    : `${completionCount} completed of ${totalCount}`

  let meaningSummary: string
  if (totalCount === 0) {
    meaningSummary = isZh
      ? '这条主线还没有形成稳定动作承接。今天最值钱的一步，不是继续判断，而是把它先落成一个可执行动作。'
      : 'This main path still lacks a stable execution layer. The highest-value move today is not more judgment, but turning it into one executable action.'
  } else if (remainingCount === 0) {
    meaningSummary = isZh
      ? '这条主线已经接近收口。今天更适合补最后的闭环、复盘和承接，而不是继续横向扩展。'
      : 'This main path is already near closure. Today is better used for the final loop, review, and handoff rather than expanding sideways.'
  } else if (recentMetricStatus === 'ready') {
    meaningSummary = isZh
      ? `最近 7 天已经出现稳定推进信号。今天这一步的价值，不是多做一件事，而是继续把「${primaryPathContext.title}」维持在推进密度里。`
      : `The last 7 days already show stable movement. The value of today’s move is not doing one more thing, but keeping "${primaryPathContext.title}" inside an active execution rhythm.`
  } else if (recentMetricStatus === 'fallback') {
    meaningSummary = isZh
      ? `这条主线最近有活跃触达，但稳定完成信号还不够。今天更重要的是把活跃感变成一次真实推进。`
      : `This main path has shown recent activity, but stable completion signals are still thin. Today matters because it can turn activity into a real move.`
  } else {
    meaningSummary = isZh
      ? `${primaryPathContext.titleText} 今天这一步更像重新把主线点亮，而不是简单完成一个任务。`
      : `${primaryPathContext.titleText} Today’s move is more about lighting the main path back up than simply finishing a task.`
  }

  return {
    goalId: primaryPathContext.goalId,
    recentMetricStatus,
    recentCompletedCount7d,
    recentActiveCount7d,
    completionCount,
    remainingCount,
    totalCount,
    recentSummary,
    progressSummary,
    meaningSummary,
  }
}
