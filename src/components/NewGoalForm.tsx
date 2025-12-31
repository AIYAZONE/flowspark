'use client'

import Link from 'next/link'
import { createGoal } from '@/app/(authenticated)/goals/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import { useFormStatus } from 'react-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type en from '@/i18n/en.json'

type Dict = typeof en

function SubmitButton({ dict }: { dict: Dict }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoadingSpinner size={16} className="mr-2" />}
      {dict.goals.new.submit}
    </Button>
  )
}

export function NewGoalForm({ dict }: { dict: Dict }) {
  return (
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

      <DateRangeFields
        defaultStart={new Date().toISOString().split('T')[0]}
        defaultEnd={new Date().toISOString().split('T')[0]}
        labels={{ start: dict.goals.new.startDate, end: dict.goals.new.endDate, error: dict.common.dateRangeInvalid }}
      />

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
        <SubmitButton dict={dict} />
      </div>
    </form>
  )
}
