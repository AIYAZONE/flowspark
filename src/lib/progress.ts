export function calcCompletionPercent(completed: number, total: number): number {
	if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return 0
	const raw = (completed / total) * 100
	return Math.max(0, Math.min(100, Math.round(raw)))
}

export function calcDaysLeft(endDate?: string | null): number | null {
	if (!endDate) return null
	return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

export function getUrgencyProgressColor(daysLeft: number | null): string {
	if (daysLeft == null) return 'bg-primary'
	if (daysLeft < 0) return 'bg-destructive'
	if (daysLeft <= 7) return 'bg-orange-500'
	return 'bg-primary'
}

export function calcTimeProgressPercent(startDate?: string | null, endDate?: string | null): number | null {
	if (!startDate || !endDate) return null
	const start = new Date(startDate).getTime()
	const end = new Date(endDate).getTime()
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null

	const now = Date.now()
	const total = end - start
	const elapsed = Math.max(0, Math.min(total, now - start))
	const raw = (elapsed / total) * 100
	return Math.max(0, Math.min(100, Math.round(raw)))
}

export type PaceStatus = 'ahead' | 'onTrack' | 'behind'

export function getPaceStatus(actionProgress: number, timeProgress: number): PaceStatus {
	const delta = actionProgress - timeProgress
	if (delta >= 10) return 'ahead'
	if (delta <= -10) return 'behind'
	return 'onTrack'
}

export type GoalProgressInfo = {
	/** 已完成的关联行动数（仅统计未归档行动） */
	actionCompleted: number
	/** 关联行动总数（仅统计未归档行动） */
	actionTotal: number
	/** 卡片主进度条展示的完成度（0-100），优先取行动完成率，无行动时回退时间进度 */
	completionPercent: number
	/** 时间进度百分比（0-100），无起止日期时为 null */
	timePercent: number | null
	/** 距结束日期剩余天数，已逾期为负数，无结束日期为 null */
	daysLeft: number | null
	/** 主进度条所依据的指标：有行动用 actions，否则用 time */
	basis: 'actions' | 'time'
}

/**
 * 构造目标卡片所需的可视化进度信息。
 * 进度主数据来自关联行动完成率；当目标没有关联行动时回退到时间进度。
 */
export function buildGoalProgressInfo(params: {
	startDate?: string | null
	endDate?: string | null
	actionAgg?: { completed: number; total: number } | null
}): GoalProgressInfo {
	const timePercent = calcTimeProgressPercent(params.startDate, params.endDate)
	const daysLeft = calcDaysLeft(params.endDate)
	const actionTotal = params.actionAgg?.total ?? 0
	const actionCompleted = params.actionAgg?.completed ?? 0
	const actionPercent = calcCompletionPercent(actionCompleted, actionTotal)
	const basis: 'actions' | 'time' = actionTotal > 0 ? 'actions' : 'time'
	return {
		actionCompleted,
		actionTotal,
		completionPercent: basis === 'actions' ? actionPercent : (timePercent ?? 0),
		timePercent,
		daysLeft,
		basis,
	}
}
