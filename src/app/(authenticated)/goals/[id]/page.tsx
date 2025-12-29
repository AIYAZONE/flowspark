import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/i18n/get-dictionary'

import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { ActionListFilter } from '@/components/ActionListFilter'
import { AddActionDialog } from '@/components/AddActionDialog'

interface PageProps {
    params: Promise<{ id: string }>
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

    // Get actions for this goal
    const { data: actions } = await supabase
        .from('actions')
        .select('*')
        .eq('goal_id', id)
        .eq('user_id', user.id)
        .order('completed', { ascending: true }) // Uncompleted first
        .order('priority', { ascending: false }) // High priority first

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/goals">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 backdrop-blur-xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    >
                        <div className="rounded-full bg-background/80 p-1 group-hover:bg-background transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{dict.common.back}</span>
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">{goal.title}</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Goal Details */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <GoalDetailsCard goal={goal} dict={dict} />
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">{dict.goals.detail.actions}</h2>
                        <AddActionDialog goalId={goal.id} dict={dict} />
                    </div>

                    <ActionListFilter
                        initialActions={actions || []}
                        dict={dict}
                        showGoalTitle={false}
                    />
                </div>
            </div>
        </div>
    )
}
