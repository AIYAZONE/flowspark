import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{dict.goals.title}</h1>
        <AddGoalDialog dict={dict} />
      </div>

      <GoalListFilter initialGoals={goals || []} dict={dict} />
    </div>
  )
}
