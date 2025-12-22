import { Plus, CheckCircle2, Circle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toggleAction } from '../dashboard/actions'
import { createAction } from '../goals/actions'
import { getDictionary } from '@/i18n/get-dictionary'

export default async function TodayPage() {
    const supabase = await createClient()
    const dict = await getDictionary()
    const today = new Date().toISOString().split('T')[0]

    const { data: actions } = await supabase
        .from('actions')
        .select('*, goals(title)')
        .eq('action_date', today)
        .order('type', { ascending: true }) // core first

    const { data: activeGoals } = await supabase
        .from('goals')
        .select('id, title')
        .eq('status', 'active')

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Actions List */}
                <div className="md:col-span-2 space-y-4">
                    {actions?.map((action) => (
                        <Card key={action.id} className={action.type === 'core' ? 'border-primary/20 bg-primary/5' : ''}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <form action={toggleAction}>
                                        <input type="hidden" name="id" value={action.id} />
                                        <input type="hidden" name="completed" value={action.completed ? 'true' : 'false'} />
                                        <button type="submit" className="focus:outline-none">
                                            {action.completed ? (
                                                <CheckCircle2 className={`h-6 w-6 ${action.type === 'core' ? 'text-primary' : 'text-primary'}`} />
                                            ) : (
                                                <Circle className={`h-6 w-6 ${action.type === 'core' ? 'text-primary' : 'text-muted-foreground'}`} />
                                            )}
                                        </button>
                                    </form>
                                    <div>
                                        <p className={`font-medium ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                                            {action.title}
                                        </p>
                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                            <span className="capitalize px-1.5 py-0.5 rounded bg-secondary font-medium text-secondary-foreground">
                                                {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}
                                            </span>
                                            <span>{dict.today.goalPrefix}{action.goals?.title}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                <input type="hidden" name="action_date" value={today} />

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
