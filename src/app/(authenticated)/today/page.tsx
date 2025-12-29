import { Plus, CheckCircle2, Circle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toggleAction } from '../dashboard/actions'
import { getDictionary } from '@/i18n/get-dictionary'
import { AddActionDialog } from '@/components/AddActionDialog'
import { ActionListFilter } from '@/components/ActionListFilter'

export default async function TodayPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get active goals for the dropdown
  const { data: activeGoals } = await supabase
    .from('goals')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Get today's actions
  const today = new Date().toISOString().split('T')[0]
  const { data: actions } = await supabase
    .from('actions')
    .select(`
      *,
      goals (
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('completed', { ascending: true }) // Uncompleted first
    .order('priority', { ascending: false }) // High priority first (if using text sort, high < low? No, need mapping. But here just simple sort)
    // Actually sorting is better handled in client or with complex query. 
    // Let's rely on client sort in ActionListFilter for consistency.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(dict.common.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Actions List with Filter */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold leading-none tracking-tight">{dict.today.todaysActions}</h2>
                <AddActionDialog activeGoals={activeGoals || []} dict={dict} />
            </div>
            <ActionListFilter 
                initialActions={actions || []} 
                dict={dict} 
                showGoalTitle={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
