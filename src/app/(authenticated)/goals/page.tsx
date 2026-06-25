import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { GoalListFilter } from '@/components/GoalListFilter'

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
    <div className="space-y-7">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{dict.goals.title}</h1>
        <div className="mt-1 text-sm text-muted-foreground/90">{dict.goals.subtitle}</div>
      </div>

      <GoalListFilter initialGoals={goals || []} dict={dict} />
    </div>
  )
}
