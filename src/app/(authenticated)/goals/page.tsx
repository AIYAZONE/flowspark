import Link from 'next/link'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDictionary } from '@/i18n/get-dictionary'

export default async function GoalsPage() {
  const supabase = await createClient()
  const dict = await getDictionary()

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
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
          <Link href={`/goals/${goal.id}`} key={goal.id} className="block h-full">
            <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{goal.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${goal.status === 'active' ? 'bg-primary/10 text-primary' :
                    goal.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                    {dict.goals.status[goal.status as keyof typeof dict.goals.status] || goal.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {goal.description || dict.common.noDescription}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>{dict.goals.start}: {format(new Date(goal.start_date), 'MMM d, yyyy')}</div>
                  <div>{dict.goals.end}: {format(new Date(goal.end_date), 'MMM d, yyyy')}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
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
