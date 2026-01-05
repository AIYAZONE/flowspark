'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangeFields } from '@/components/DateRangeFields'
import { createAction } from '@/app/(authenticated)/goals/actions'
import { Plus } from 'lucide-react'
import { SubmitButton } from '@/components/SubmitButton'

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
    priority: { label: string; high: string; medium: string; low: string }
  }
  common: { dateRangeInvalid: string; saving: string }
}

export function AddActionForm({ activeGoals, dict, today }: { activeGoals: Goal[] | null; dict: Dict; today: string }) {
  const [valid, setValid] = useState(true)
  return (
    <form action={createAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="goal_id">{dict.today.goalLabel}</Label>
        <Select name="goal_id" required defaultValue="">
          <SelectTrigger>
            <SelectValue placeholder={dict.today.selectGoal} />
          </SelectTrigger>
          <SelectContent>
            {activeGoals?.map(goal => (
              <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <Select name="type" defaultValue="core">
            <SelectTrigger>
              <SelectValue placeholder={dict.today.typeLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="core">{dict.today.types.core}</SelectItem>
              <SelectItem value="maintenance">{dict.today.types.maintenance}</SelectItem>
              <SelectItem value="learning">{dict.today.types.learning}</SelectItem>
              <SelectItem value="review">{dict.today.types.review}</SelectItem>
              <SelectItem value="rest">{dict.today.types.rest}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">{dict.today.priorityLabel}</Label>
          <Select name="priority" defaultValue="medium">
            <SelectTrigger>
              <SelectValue placeholder={dict.today.priorityLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">{dict.goals.priority.high}</SelectItem>
              <SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
              <SelectItem value="low">{dict.goals.priority.low}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DateRangeFields
        defaultStart={today}
        defaultEnd={today}
        labels={{ start: dict.today.startTime, end: dict.today.endTime, error: dict.common.dateRangeInvalid }}
        onValidityChange={setValid}
      />

      <SubmitButton className="w-full" disabled={!valid} loadingText={dict.common.saving}>
        <Plus className="mr-2 h-4 w-4" />
        {dict.today.addActionBtn}
      </SubmitButton>
    </form>
  )
}
