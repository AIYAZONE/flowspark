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
	if (daysLeft == null) return 'bg-blue-500'
	if (daysLeft < 0) return 'bg-rose-500'
	if (daysLeft <= 7) return 'bg-orange-500'
	if (daysLeft <= 21) return 'bg-amber-500'
	if (daysLeft <= 60) return 'bg-blue-500'
	return 'bg-emerald-500'
}
