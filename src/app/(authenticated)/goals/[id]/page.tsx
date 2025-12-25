import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/i18n/get-dictionary'

import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { ActionItem } from '@/components/ActionItem'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import { DeleteGoalButton } from '@/components/DeleteGoalButton'
import { AddActionDialog } from '@/components/AddActionDialog'

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const dict = await getDictionary()

    const { data: goal } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single()

    if (!goal) {
        return <div>{dict.goals.detail.notFound}</div>
    }

    const { data: actions } = await supabase
        .from('actions')
        .select('*')
        .eq('goal_id', id)
        .order('start_date', { ascending: true })

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
            {/* Top Navigation & Header */}
            <div className="flex items-center justify-between gap-4">
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

                <h1 className="text-2xl font-bold tracking-tight text-foreground">{goal.title}</h1>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Goal Details */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <GoalDetailsCard goal={goal} dict={dict} />
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-border/40 pb-4">
                            <h2 className="text-lg font-semibold tracking-tight">{dict.goals.detail.actions}</h2>
                            <AddActionDialog goalId={goal.id} dict={dict} />
                        </div>

                        <div className="space-y-3">
                            {actions?.map((action) => (
                                <ActionItem key={action.id} action={action} dict={dict} />
                            ))}
                            {actions?.length === 0 && (
                                <div className="text-center py-16 border rounded-xl border-dashed border-border/60 bg-muted/5">
                                    <p className="text-muted-foreground">{dict.goals.detail.noActions}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
