import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { GoalListFilter } from '@/components/GoalListFilter'
import { AddGoalDialog } from '@/components/AddGoalDialog'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{dict.goals.title}</h1>
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{dict.goals.subtitle}</div>
        </div>
        <AddGoalDialog
          dict={dict}
          trigger={
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-[color,background-color,box-shadow,transform] duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:scale-[0.985] active:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {dict.goals.newGoal}
            </button>
          }
        />
      </div>

      <GoalListFilter initialGoals={goals || []} dict={dict} />
    </div>
  )
}
