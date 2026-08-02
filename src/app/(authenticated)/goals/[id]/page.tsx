import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'
import { queryWithOwnershipFallback } from '@/lib/ownership'
import { detectStaleActions, type StaleSignal } from '@/lib/stale-detector'

import { GoalDetailResponsiveLayout } from '@/components/GoalDetailResponsiveLayout'
import type { GoalBlueprintData } from '@/components/GoalBlueprint'

function addDaysFromDateString(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00Z`)
	d.setUTCDate(d.getUTCDate() + days)
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'UTC',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(d)
}

async function loadBlueprint(
	supabase: Awaited<ReturnType<typeof createClient>>,
	goalId: string,
	positioning: GoalBlueprintData['positioning'],
): Promise<GoalBlueprintData> {
	const { data: pillars } = await supabase
		.from('path_pillars')
		.select('id, title, rationale, sort_order')
		.eq('goal_id', goalId)
		.order('sort_order', { ascending: true })

	const { data: milestones } = await supabase
		.from('path_milestones')
		.select('id, title, target_date, sort_order, status, started_at, completed_at')
		.eq('goal_id', goalId)
		.order('sort_order', { ascending: true })

	let keyResults: Array<{ id: string; milestone_id: string; title: string; target: string | null; current: string | null }> = []
	if (milestones && milestones.length > 0) {
		const msIds = milestones.map((m) => m.id)
		const { data: krs } = await supabase
			.from('path_key_results')
			.select('id, milestone_id, title, target, current')
			.in('milestone_id', msIds)
		keyResults = (krs as typeof keyResults) || []
	}

	const milestoneData = (milestones || []).map((m) => ({
		id: m.id as string,
		title: m.title as string,
		target_date: (m.target_date as string | null) || null,
		status: (m.status as 'pending' | 'active' | 'completed' | null) || null,
		started_at: (m.started_at as string | null) || null,
		completed_at: (m.completed_at as string | null) || null,
		key_results: keyResults
			.filter((kr) => kr.milestone_id === m.id)
			.map((kr) => ({
				id: kr.id,
				title: kr.title,
				target: kr.target ?? null,
				current: kr.current ?? null,
			})),
	}))

	return {
		positioning: positioning ?? null,
		pillars: (pillars || []).map((p) => ({
			id: p.id as string,
			title: p.title as string,
			rationale: (p.rationale as string | null) ?? null,
		})),
		milestones: milestoneData,
	}
}

interface PageProps {
    params: Promise<{ id: string }>
}

type RawGoalEntry = {
	id: string
	kind: string
	status: string | null
	content: string
	note: string | null
	created_at: string
}

export default async function GoalDetailPage({ params }: PageProps) {
    const { id } = await params

    const supabase = await createClient()
    const [dict, { data: { user } }] = await Promise.all([
		getDictionary(),
		supabase.auth.getUser()
	])

    if (!user) return null

	const goalEntriesPromise = (async (): Promise<RawGoalEntry[]> => {
		const { data } = await queryWithOwnershipFallback({
			primary: 'owner_id',
			fallback: 'user_id',
			fallbackOnEmpty: false,
			execute: (ownershipColumn) => supabase
				.from('goal_entries')
				.select('id, kind, status, content, note, created_at')
				.eq('goal_id', id)
				.eq('kind', 'journey')
				.eq(ownershipColumn, user.id)
				.order('created_at', { ascending: false })
		})

		return data || []
	})()

	const [
		{ data: goal },
		{ data: activeGoals },
		{ data: actions },
		{ data: shareData },
		{ data: calendarFeedData },
		tz,
		goalEntries
	] = await Promise.all([
		supabase
			.from('goals')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single(),
		supabase
			.from('goals')
			.select('id, title')
			.eq('user_id', user.id)
			.eq('status', 'active')
			.order('created_at', { ascending: false }),
		supabase
			.from('actions')
			.select(`
				*,
				action_sub_items (
					id,
					title,
					completed,
					sort_order
				)
			`)
			.eq('goal_id', id)
			.eq('user_id', user.id)
			.order('completed', { ascending: true })
			.order('priority', { ascending: false })
			.order('start_date', { ascending: false }),
		supabase
			.from('goal_shares')
			.select('token, expires_at, revoked_at')
			.eq('goal_id', id)
			.eq('owner_id', user.id)
			.maybeSingle(),
		supabase
			.from('calendar_feeds')
			.select('token, expires_at, revoked_at')
			.eq('owner_id', user.id)
			.eq('scope', 'goal')
			.eq('goal_id', id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle(),
		getUserTimezone(supabase, user.id),
		goalEntriesPromise
	])

	if (!goal) return <div>{dict.goals.detail.notFound}</div>

	const blueprint = await loadBlueprint(supabase, id, (goal.positioning as GoalBlueprintData['positioning']) ?? null)

	const goalActions = actions || []
	const activeActions = goalActions.filter((a) => !a.archived)
	const archivedActions = goalActions.filter((a) => a.archived)

	const today = getTodayInTZ(tz)
	const startDefault = today
	const endDefault = addDaysFromDateString(startDefault, 7)

	// 驻点检测：超过 7 天无进展的 action 触发救援提示
	const staleSignal: StaleSignal = detectStaleActions(
		goalActions.map((a) => ({
			id: a.id as string,
			title: a.title as string,
			completed: a.completed as boolean | null,
			goal_id: a.goal_id as string | null,
			goal_title: goal.title as string,
			updated_at: (a.updated_at as string) || null,
			created_at: (a.created_at as string) || null,
		})),
		today
	)

	const mappedEntries = (goalEntries || []).map((e) => ({
		id: e.id as string,
		kind: e.kind as 'inspiration' | 'journey',
		status: (e.status as 'open' | 'archived' | null) || 'open',
		content: e.content as string,
		note: (e.note as string) || '',
		created_at: e.created_at as string
	}))

	// 里程碑阶段上下文（供 rescue panel 使用），来源为已加载的 blueprint.milestones
	const blueprintMilestones = blueprint?.milestones ?? []
	const milestoneStageForRescue = blueprintMilestones.length > 0 ? {
		currentMilestoneTitle: blueprintMilestones.find((m) => m.status === 'active')?.title || undefined,
		completedCount: blueprintMilestones.filter((m) => m.status === 'completed').length,
		totalCount: blueprintMilestones.length,
		progressText: `${blueprintMilestones.filter((m) => m.status === 'completed').length}/${blueprintMilestones.length}`,
	} : null

	return (
		<GoalDetailResponsiveLayout
			goal={goal}
			actions={activeActions}
			archivedActions={archivedActions}
			entries={mappedEntries}
			dict={dict}
			activeGoals={(activeGoals || []).map((g) => ({ id: g.id as string, title: g.title as string }))}
			shareInfo={{
				token: (shareData?.revoked_at ? null : (shareData?.token as string | null)) || null,
				expiresAt: (shareData?.expires_at as string | null) || null
			}}
			calendarFeedInfo={{
				token:
					(calendarFeedData?.revoked_at
						? null
						: (calendarFeedData?.token as string | null)) || null,
				expiresAt: (calendarFeedData?.expires_at as string | null) || null
			}}
			tzDefaults={{ startDefault, endDefault }}
			blueprint={blueprint}
			staleSignal={staleSignal}
			milestoneStageForRescue={milestoneStageForRescue}
		/>
	)
}
