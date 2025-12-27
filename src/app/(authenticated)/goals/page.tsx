import Link from 'next/link'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDictionary } from '@/i18n/get-dictionary'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'

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
        <Link href="/goals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dict.goals.newGoal}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals?.map((goal) => (
          <Card key={goal.id} className="group h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <Link href={`/goals/${goal.id}`} className="flex-1 min-w-0">
                  <CardTitle className="text-xl leading-normal hover:underline underline-offset-4">
                    {goal.title}
                  </CardTitle>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <GoalStatusBadge
                    status={goal.status}
                    label={dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/goals/${goal.id}`} className="block space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                  {goal.description || dict.common.noDescription}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg bg-muted/40 p-4">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.detail.startDate}</h3>
                    <p className="text-xs font-medium text-foreground/90 font-mono">
                      {format(new Date(goal.start_date), 'yyyy-MM-dd')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.detail.endDate}</h3>
                    <p className="text-xs font-medium text-foreground/90 font-mono">
                      {format(new Date(goal.end_date), 'yyyy-MM-dd')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.priority.label}</h3>
                    <p className="text-xs font-medium text-foreground/90 capitalize">
                      {dict.goals.priority[goal.priority as keyof typeof dict.goals.priority] || goal.priority || dict.goals.priority.medium}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{dict.goals.category.label}</h3>
                    <p className="text-xs font-medium text-foreground/90 capitalize">
                      {dict.goals.category[goal.category as keyof typeof dict.goals.category] || goal.category || dict.goals.category.other}
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
        {goals?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-card text-muted-foreground">
            <p className="mb-4">{dict.goals.noGoals}</p>
            <Link href="/goals/new">
              <Button variant="outline">{dict.goals.createFirst}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
