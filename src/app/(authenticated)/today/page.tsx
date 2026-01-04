import { Plus, CheckCircle2, Circle } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toggleAction } from '../dashboard/actions'
import { getDictionary } from '@/i18n/get-dictionary'
import { AddActionDialog } from '@/components/AddActionDialog'
import { getUserTimezone, getTodayInTZ, toLocaleDateStringTZ } from '@/lib/time'
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

  const tz = await getUserTimezone(supabase, user.id)
  // Get today's actions by timezone
  const today = getTodayInTZ(tz)
  // Calculate yesterday to ensure we cover timezones where 'today' starts earlier than UTC
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const { data: rawActions } = await supabase
    .from('actions')
    .select(`
      *,
      goals (
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .or(
      [
        `and(start_date.lte.${today},end_date.gte.${today})`,
        `and(end_date.lt.${today},completed.eq.false)`,
        `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
        `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
        `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
      ].join(',')
    )
    .order('completed', { ascending: true })
    .order('priority', { ascending: false })

  // Filter actions in JS to accurately handle timezone "today"
  const actions = rawActions?.filter(action => {
    // If it's a regular active action or incomplete delayed action, keep it
    const isRegular = action.start_date <= today && (action.end_date || action.start_date) >= today;
    const isDelayedIncomplete = !action.completed && (action.end_date || action.start_date) < today;

    if (isRegular || isDelayedIncomplete) return true;

    // For completed delayed actions, strictly check if updated_at is "today" in user's timezone
    if (action.completed && action.updated_at) {
      const updatedDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(action.updated_at));
      return updatedDate === today;
    }

    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {toLocaleDateStringTZ(dict.common.locale, tz, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <AddActionDialog activeGoals={activeGoals || []} dict={dict} />
      </div>

      <div className="grid gap-6">
        {/* Actions List with Filter */}
        <ActionListFilter
          initialActions={actions || []}
          dict={dict}
          showGoalTitle={true}
          tz={tz}
        />
      </div>
    </div>
  )
}
