import Link from 'next/link'
import { createGoal } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary } from '@/i18n/get-dictionary'
import { DateRangeFields } from '@/components/DateRangeFields'
import { NewGoalForm } from '@/components/NewGoalForm'

export default async function NewGoalPage() {
  const dict = await getDictionary()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{dict.goals.new.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{dict.goals.new.details}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewGoalForm dict={dict} />
        </CardContent>
      </Card>
    </div>
  )
}
