'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DateRangeFields } from '@/components/DateRangeFields'
import { createAction } from '@/app/(authenticated)/goals/actions'
import { Plus } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'

type Goal = { id: string; title: string }

export interface Dict {
  today: {
    addActionTitle: string
    goalLabel: string
    selectGoal: string
    actionTitleLabel: string
    actionTitlePlaceholder: string
    typeLabel: string
    types: { core: string; maintenance: string; learning: string; review: string; rest: string }
    priorityLabel: string
    descriptionLabel: string
    descriptionPlaceholder: string
    addActionBtn: string
    startTime: string
    endTime: string
  }
  goals: {
    priority: { high: string; medium: string; low: string }
  }
  common: { dateRangeInvalid: string }
}

export function AddActionForm({ activeGoals, dict, today }: { activeGoals: Goal[] | null; dict: Dict; today: string }) {
  const [valid, setValid] = useState(true)
  return (
    <form action={createAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="goal_id">{dict.today.goalLabel}</Label>
        <select
          name="goal_id"
          id="goal_id"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
          defaultValue=""
        >
          <option value="" disabled>{dict.today.selectGoal}</option>
          {activeGoals?.map(goal => (
            <option key={goal.id} value={goal.id}>{goal.title}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="title">{dict.today.actionTitleLabel}</Label>
        <Input id="title" name="title" placeholder={dict.today.actionTitlePlaceholder} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">{dict.today.descriptionLabel}</Label>
        <Textarea id="description" name="description" placeholder={dict.today.descriptionPlaceholder} className="min-h-[80px]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">{dict.today.typeLabel}</Label>
          <select
            name="type"
            id="type"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue="core"
          >
            <option value="core">{dict.today.types.core}</option>
            <option value="maintenance">{dict.today.types.maintenance}</option>
            <option value="learning">{dict.today.types.learning}</option>
            <option value="review">{dict.today.types.review}</option>
            <option value="rest">{dict.today.types.rest}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">{dict.today.priorityLabel}</Label>
          <select
            name="priority"
            id="priority"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue="medium"
          >
            <option value="high">{dict.goals.priority.high}</option>
            <option value="medium">{dict.goals.priority.medium}</option>
            <option value="low">{dict.goals.priority.low}</option>
          </select>
        </div>
      </div>

      <DateRangeFields
        defaultStart={today}
        defaultEnd={today}
        labels={{ start: dict.today.startTime, end: dict.today.endTime, error: dict.common.dateRangeInvalid }}
        onValidityChange={setValid}
      />

      <Button type="submit" className="w-full" disabled={!valid}>
        <Plus className="mr-2 h-4 w-4" /> {dict.today.addActionBtn}
      </Button>
    </form>
  )
}
