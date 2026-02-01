'use client'

import { isValidElement, cloneElement } from 'react'
import type { MouseEventHandler } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type en from '@/i18n/en.json'

type Dict = typeof en

interface AddGoalDialogProps {
  dict: Dict
  trigger?: React.ReactNode
}

export function AddGoalDialog({ dict, trigger }: AddGoalDialogProps) {
  const router = useRouter()

  if (trigger && isValidElement<{ onClick?: MouseEventHandler }>(trigger)) {
    const onClick = trigger.props.onClick
    return cloneElement(trigger, {
      onClick: (e) => {
        onClick?.(e)
        router.push('/goals/new')
      },
    })
  }

  return (
    <Button onClick={() => router.push('/goals/new')}>
      <Plus className="mr-2 h-4 w-4" />
      {dict.goals.newGoal}
    </Button>
  )
}
