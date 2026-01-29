import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { getDictionary } from '@/i18n/get-dictionary'
import { GoalListFilter } from '@/components/GoalListFilter'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { Plus } from 'lucide-react'

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
        <div className="hidden md:block">
          <AddGoalDialog dict={dict} />
        </div>
      </div>

      <GoalListFilter initialGoals={goals || []} dict={dict} />

      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <AddGoalDialog 
          dict={dict} 
          trigger={
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          } 
        />
      </div>
    </div>
  )
}
