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
