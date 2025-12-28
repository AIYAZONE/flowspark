import { Plus, CheckCircle2, Circle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toggleAction } from '../dashboard/actions'
import { getDictionary } from '@/i18n/get-dictionary'
import { AddActionForm, type Dict } from '@/components/AddActionForm'

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
                            <AddActionForm activeGoals={activeGoals || []} dict={dict as Dict} today={today} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
