import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/i18n/get-dictionary'
import { getTodayInTZ, getUserTimezone } from '@/lib/time'

import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { GoalDetailMobileLayout } from '@/components/GoalDetailMobileLayout'
import { GoalSubItemsTabs } from '@/components/GoalSubItemsTabs'

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

interface PageProps {
    params: Promise<{ id: string }>
}

type RawGoalEntry = {
	id: string
	kind: string
	content: string
	note: string | null
	created_at: string
}

export default async function GoalDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const dict = await getDictionary()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get goal details
    const { data: goal } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!goal) return <div>{dict.goals.detail.notFound}</div>

    const { data: activeGoals } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    // Get actions for this goal
    const { data: actions } = await supabase
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
        .order('completed', { ascending: true }) // Uncompleted first
        .order('priority', { ascending: false }) // High priority first
        .order('start_date', { ascending: false }) // Newest first

    const { data: shareData } = await supabase
        .from('goal_shares')
        .select('token, expires_at, revoked_at')
        .eq('goal_id', id)
        .eq('owner_id', user.id)
        .maybeSingle()

	const tz = await getUserTimezone(supabase, user.id)
	const startDefault = getTodayInTZ(tz)
	const endDefault = addDaysFromDateString(startDefault, 7)

	let goalEntries: RawGoalEntry[] = []
	{
		const { data, error } = await supabase
			.from('goal_entries')
			.select('id, kind, content, note, created_at')
			.eq('goal_id', id)
			.eq('owner_id', user.id)
			.eq('status', 'open')
			.order('created_at', { ascending: false })

		if (error && (error.code === '42703' || error.message?.includes('column'))) {
			const { data: legacyData } = await supabase
				.from('goal_entries')
				.select('id, kind, content, note, created_at')
				.eq('goal_id', id)
				.eq('user_id', user.id)
				.eq('status', 'open')
				.order('created_at', { ascending: false })
			goalEntries = legacyData || []
		} else {
			goalEntries = data || []
		}
	}

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/goals">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-primary/10 hover:text-primary active:bg-primary/10 active:text-primary transition-all duration-300"
                    >
                        <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{dict.common.back}</span>
                    </Button>
                </Link>
                <h1 className="text-lg md:text-2xl font-bold tracking-tight">{goal.title}</h1>
            </div>

            <GoalDetailMobileLayout
				goal={goal}
				actions={actions || []}
				entries={(goalEntries || []).map((e) => ({
					id: e.id as string,
					kind: e.kind as 'inspiration' | 'journey',
					content: e.content as string,
					note: (e.note as string) || '',
					created_at: e.created_at as string
				}))}
				dict={dict}
				goalsForEdit={activeGoals || []}
				shareInfo={{
					token: (shareData?.revoked_at ? null : (shareData?.token as string | null)) || null,
					expiresAt: (shareData?.expires_at as string | null) || null
				}}
				tzDefaults={{ startDefault, endDefault }}
			/>

            <div className="hidden lg:grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <GoalDetailsCard
                            goal={goal}
                            dict={dict}
                            initialShareToken={(shareData?.revoked_at ? null : (shareData?.token as string | null)) || null}
                            initialShareExpiresAt={(shareData?.expires_at as string | null) || null}
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
					<GoalSubItemsTabs
						goalId={goal.id as string}
						actions={actions || []}
						entries={(goalEntries || []).map((e) => ({
							id: e.id as string,
							kind: e.kind as 'inspiration' | 'journey',
							content: e.content as string,
							note: (e.note as string) || '',
							created_at: e.created_at as string
						}))}
						dict={dict}
						goalsForEdit={activeGoals || []}
						tzDefaults={{ startDefault, endDefault }}
					/>
                </div>
            </div>
        </div>
    )
}
