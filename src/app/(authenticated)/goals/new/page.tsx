import Link from 'next/link'
import { createGoal } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary } from '@/i18n/get-dictionary'

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
          <form action={createGoal} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">{dict.goals.new.titleLabel}</Label>
              <Input id="title" name="title" placeholder={dict.goals.new.titlePlaceholder} required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">{dict.goals.new.descriptionLabel}</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder={dict.goals.new.descriptionPlaceholder}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="category">{dict.goals.category.label}</Label>
                    <select 
                        id="category" 
                        name="category" 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="other">{dict.goals.category.other}</option>
                        <option value="health">{dict.goals.category.health}</option>
                        <option value="career">{dict.goals.category.career}</option>
                        <option value="learning">{dict.goals.category.learning}</option>
                        <option value="finance">{dict.goals.category.finance}</option>
                        <option value="lifestyle">{dict.goals.category.lifestyle}</option>
                        <option value="social">{dict.goals.category.social}</option>
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="priority">{dict.goals.priority.label}</Label>
                    <select 
                        id="priority" 
                        name="priority" 
                        defaultValue="medium"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="high">{dict.goals.priority.high}</option>
                        <option value="medium">{dict.goals.priority.medium}</option>
                        <option value="low">{dict.goals.priority.low}</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="start_date">{dict.goals.new.startDate}</Label>
                    <Input id="start_date" name="start_date" type="date" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="end_date">{dict.goals.new.endDate}</Label>
                    <Input id="end_date" name="end_date" type="date" required />
                </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="success_criteria">{dict.goals.new.successCriteriaLabel}</Label>
              <Textarea 
                id="success_criteria" 
                name="success_criteria" 
                placeholder={dict.goals.new.successCriteriaPlaceholder}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stop_criteria">{dict.goals.new.abandonCriteriaLabel}</Label>
              <Textarea 
                id="stop_criteria" 
                name="stop_criteria" 
                placeholder={dict.goals.new.abandonCriteriaPlaceholder}
                required
              />
            </div>

            <div className="flex justify-end gap-4">
                <Link href="/goals">
                    <Button type="button" variant="outline">{dict.common.cancel}</Button>
                </Link>
                <Button type="submit">{dict.goals.new.submit}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
