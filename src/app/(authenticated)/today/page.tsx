import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { AddActionDialog } from '@/components/AddActionDialog'
import { getUserTimezone, getTodayInTZ, toLocaleDateStringTZ } from '@/lib/time'
import { TodayActionList } from '@/components/TodayActionList'
import { InboxCard } from '@/components/InboxCard'

export default async function TodayPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const ownerId = user.id

  // Get active goals for the dropdown
  let { data: activeGoals } = await supabase
    .from('goals')
    .select('id, title')
    .eq('user_id', ownerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // owner_id fallback for mixed-schema data
  if (!activeGoals || activeGoals.length === 0) {
    const fallbackGoals = await supabase
      .from('goals')
      .select('id, title')
      .eq('owner_id', ownerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    activeGoals = fallbackGoals.data
  }

  const tz = await getUserTimezone(supabase, user.id)
  // Get today's actions by timezone
  const today = getTodayInTZ(tz)
  // Calculate yesterday to ensure we cover timezones where 'today' starts earlier than UTC
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const datePredicate = [
    `and(start_date.lte.${today},end_date.gte.${today})`,
    `and(end_date.lt.${today},completed.eq.false)`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.false)`,
    `and(end_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
    `and(end_date.is.null,start_date.lt.${today},completed.eq.true,updated_at.gte.${yesterday})`,
  ].join(',')

  let { data: rawActions } = await supabase
    .from('actions')
    .select(`
      *,
      action_sub_items (
        id,
        title,
        completed,
        sort_order
      ),
      goals (
        id,
        title,
        status
      )
    `)
    .eq('user_id', ownerId)
    .or(datePredicate)
    .order('completed', { ascending: true })
    .order('priority', { ascending: false })

  // owner_id fallback for mixed-schema data
  if (!rawActions || rawActions.length === 0) {
    const fallbackActions = await supabase
      .from('actions')
      .select(`
        *,
        action_sub_items (
          id,
          title,
          completed,
          sort_order
        ),
        goals (
          id,
          title,
          status
        )
      `)
      .eq('owner_id', ownerId)
      .or(datePredicate)
      .order('completed', { ascending: true })
      .order('priority', { ascending: false })
    rawActions = fallbackActions.data
  }

  // Filter actions in JS to accurately handle timezone "today"
  const actions = rawActions?.filter(action => {
    if (action.goals?.status === 'archived') return false;
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

  const { count: inboxOpenCountRaw } = await supabase
    .from('inbox_items')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('status', 'open')

  const inboxOpenCount = inboxOpenCountRaw ?? 0

  const { data: inboxRecent } = await supabase
    .from('inbox_items')
    .select('id, content, tags')
    .eq('owner_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dict.today.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {toLocaleDateStringTZ(dict.common.locale, tz, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div className="hidden md:block">
          <AddActionDialog activeGoals={activeGoals || []} dict={dict} />
        </div>
      </div>

      <div className="grid gap-6">
        <InboxCard
          dict={dict}
          openCount={inboxOpenCount}
          recentItems={(inboxRecent || []).map((it) => ({
            id: it.id as string,
            content: it.content as string,
            tags: (it.tags as string[]) || [],
          }))}
        />
        {/* Actions List with Filter */}
        <TodayActionList
          actions={actions || []}
          dict={dict}
          showGoalTitle={true}
          tz={tz}
          today={today}
          goals={activeGoals || []}
        />
      </div>
    </div>
  )
}
