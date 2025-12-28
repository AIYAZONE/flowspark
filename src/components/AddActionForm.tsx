'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DateRangeFields } from '@/components/DateRangeFields'
import { createAction } from '@/app/(authenticated)/goals/actions'
import { Plus } from 'lucide-react'

type Goal = { id: string; title: string }

export interface Dict {
  today: {
    addActionTitle: string
    goalLabel: string
    selectGoal: string
    actionTitleLabel: string
    actionTitlePlaceholder: string
    typeLabel: string
    types: { core: string; maintain: string; explore: string }
    addActionBtn: string
    startTime: string
    endTime: string
  }
  common: { dateRangeInvalid: string }
}

export function AddActionForm({ activeGoals, dict, today }: { activeGoals: Goal[] | null; dict: any; today: string }) {
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
        <Label htmlFor="type">{dict.today.typeLabel}</Label>
        <select
          name="type"
          id="type"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue="core"
        >
          <option value="core">{dict.today.types.core}</option>
          <option value="maintain">{dict.today.types.maintain}</option>
          <option value="explore">{dict.today.types.explore}</option>
        </select>
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
