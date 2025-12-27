import { Plus, CheckCircle2, Circle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toggleAction } from '../dashboard/actions'
import { createAction } from '../goals/actions'
import { getDictionary } from '@/i18n/get-dictionary'

import { ActionItem } from '@/components/ActionItem'

export default async function TodayPage() {
    const supabase = await createClient()
    const dict = await getDictionary()
    const today = new Date().toISOString().split('T')[0]
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: actions } = await supabase
        .from('actions')
        .select('*, goals(title)')
        .eq('user_id', user.id)
        .or(`start_date.eq.${today},and(start_date.lt.${today},completed.eq.false)`)
        .order('start_date', { ascending: true })
        .order('type', { ascending: true }) // core first

    const { data: activeGoals } = await supabase
        .from('goals')
        .select('id, title')
        .eq('status', 'active')
        .eq('user_id', user.id)

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Actions List */}
                <div className="md:col-span-2 space-y-4">
                    {actions?.map((action) => (
                        <ActionItem key={action.id} action={action} dict={dict} showGoalTitle={true} />
                    ))}
                    {actions?.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground bg-card rounded-lg border border-dashed">
                            {dict.today.noActions}
                        </div>
                    )}
                </div>

                {/* Add Action Form */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{dict.today.addActionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={createAction} className="space-y-4">

                                <div className="grid gap-2">
                                    <Label htmlFor="goal_id">{dict.today.goalLabel}</Label>
                                    <select
                                        name="goal_id"
                                        id="goal_id"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                        defaultValue=""
                                    >
                                        <option value="" disabled>{dict.today.selectGoal}</option>
                                        {activeGoals?.map(goal => (
                                            <option key={goal.id} value={goal.id}>{goal.title}</option>
                                        ))}
                                    </select>
                                </div>

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
                                        defaultValue="core"
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
                                            defaultValue={today}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="end_date">{dict.today.endTime}</Label>
                                        <Input id="end_date" name="end_date" type="date" />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> {dict.today.addActionBtn}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
