import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAction } from '../actions'
import { getDictionary } from '@/i18n/get-dictionary'

import { GoalDetailsCard } from '@/components/GoalDetailsCard'
import { ActionItem } from '@/components/ActionItem'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import { DeleteGoalButton } from '@/components/DeleteGoalButton'

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
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
                    <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <GoalStatusBadge
                        status={goal.status}
                        label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
                    />
                    <DeleteGoalButton id={goal.id} title={goal.title} dict={dict} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Goal Info */}
                <div className="md:col-span-2 space-y-6">
                    <GoalDetailsCard goal={goal} dict={dict} />

                    <Card>
                        <CardHeader>
                            <CardTitle>{dict.goals.detail.actions}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {actions?.map((action) => (
                                    <ActionItem key={action.id} action={action} dict={dict} />
                                ))}
                                {actions?.length === 0 && (
                                    <div className="text-center py-6 text-muted-foreground">
                                        {dict.goals.detail.noActions}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Action Form */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{dict.goals.detail.addAction}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={createAction} className="space-y-4">
                                <input type="hidden" name="goal_id" value={goal.id} />

                                <div className="grid gap-2">
                                    <Label htmlFor="title">{dict.today.actionTitleLabel}</Label>
                                    <Input id="title" name="title" placeholder={dict.today.actionTitlePlaceholder} required />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="type">{dict.today.typeLabel}</Label>
                                    <select
                                        name="type"
                                        id="type"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="core">{dict.today.types.core}</option>
                                        <option value="maintain">{dict.today.types.maintain}</option>
                                        <option value="explore">{dict.today.types.explore}</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="start_date">{dict.today.startTime}</Label>
                                        <Input
                                            id="start_date"
                                            name="start_date"
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="end_date">{dict.today.endTime}</Label>
                                        <Input
                                            id="end_date"
                                            name="end_date"
                                            type="date"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> {dict.goals.detail.addAction}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
