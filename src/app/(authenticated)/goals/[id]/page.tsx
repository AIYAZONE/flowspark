import { format } from 'date-fns'
import { Plus, CheckCircle2, Circle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAction } from '../actions'
import { toggleAction } from '../../dashboard/actions'
import { getDictionary } from '@/i18n/get-dictionary'

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
        .order('action_date', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${goal.status === 'active' ? 'bg-green-100 text-green-800' :
                        goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Goal Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{dict.goals.detail.details}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">{dict.goals.detail.description}</h3>
                                <p className="mt-1">{goal.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground">{dict.goals.detail.startDate}</h3>
                                    <p className="mt-1">{format(new Date(goal.start_date), 'PPP')}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground">{dict.goals.detail.endDate}</h3>
                                    <p className="mt-1">{format(new Date(goal.end_date), 'PPP')}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">{dict.goals.detail.successCriteria}</h3>
                                <p className="mt-1 whitespace-pre-wrap">{goal.success_criteria}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">{dict.goals.detail.abandonCriteria}</h3>
                                <p className="mt-1 whitespace-pre-wrap">{goal.stop_criteria}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{dict.goals.detail.actions}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {actions?.map((action) => (
                                    <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <form action={toggleAction}>
                                                <input type="hidden" name="id" value={action.id} />
                                                <input type="hidden" name="completed" value={action.completed ? 'true' : 'false'} />
                                                <button type="submit" className="focus:outline-none">
                                                    {action.completed ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </form>
                                            <div>
                                                <p className={`font-medium ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                    {action.title}
                                                </p>
                                                <div className="flex gap-2 text-xs text-muted-foreground">
                                                    <span>{format(new Date(action.action_date), 'MMM d')}</span>
                                                    <span className="capitalize">• {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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

                                <div className="grid gap-2">
                                    <Label htmlFor="action_date">{dict.goals.detail.date}</Label>
                                    <Input
                                        id="action_date"
                                        name="action_date"
                                        type="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                    />
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
