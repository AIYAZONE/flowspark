import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { GoalListFilter } from '@/components/GoalListFilter'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { buildGoalProgressInfo, type GoalProgressInfo } from '@/lib/progress'
import type { AreaMeta } from '@/lib/goalCategories'

export default async function GoalsPage() {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: areaMeta } = await supabase
    .from('area_meta')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  const { data: actionRows } = await supabase
    .from('actions')
    .select('goal_id, completed')
    .eq('user_id', user.id)
    .eq('archived', false)
    .not('goal_id', 'is', null)

  const actionAgg = new Map<string, { completed: number; total: number }>()
  for (const row of actionRows || []) {
    if (!row.goal_id) continue
    const current = actionAgg.get(row.goal_id) || { completed: 0, total: 0 }
    current.total += 1
    if (row.completed) current.completed += 1
    actionAgg.set(row.goal_id, current)
  }

  const goalsWithProgress = (goals || []).map((goal) => {
    const progress: GoalProgressInfo = buildGoalProgressInfo({
      startDate: goal.start_date,
      endDate: goal.end_date,
      actionAgg: goal.id ? actionAgg.get(goal.id) : null,
    })
    return { ...goal, progress }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {dict.goals.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {dict.goals.subtitle}
          </p>
        </div>
        <AddGoalDialog
          dict={dict}
          trigger={
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {dict.goals.newGoal}
            </button>
          }
        />
      </div>

      <GoalListFilter initialGoals={goalsWithProgress} areaMeta={areaMeta || []} dict={dict} />
    </div>
  )
}
