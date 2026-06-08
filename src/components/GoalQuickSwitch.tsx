'use client'

import { useRouter } from 'next/navigation'

import type en from '@/i18n/en.json'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Dict = typeof en

interface GoalQuickSwitchProps {
  currentGoalId: string
  goals: Array<{ id: string; title: string }>
  dict: Dict
  className?: string
}

export function GoalQuickSwitch({ currentGoalId, goals, dict, className }: GoalQuickSwitchProps) {
  const router = useRouter()

  if (goals.length <= 1) return null

  return (
    <Select value={currentGoalId} onValueChange={(value) => router.push(`/goals/${value}`)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={dict.goals.detail.switchGoal} />
      </SelectTrigger>
      <SelectContent>
        {goals.map((goal) => (
          <SelectItem key={goal.id} value={goal.id}>
            {goal.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
