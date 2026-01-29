'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NewGoalForm } from './NewGoalForm'
import { createGoalModal } from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'

type Dict = typeof en

interface AddGoalDialogProps {
  dict: Dict
  trigger?: React.ReactNode
}

export function AddGoalDialog({ dict, trigger }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dict.goals.newGoal}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dict.goals.newGoal}</DialogTitle>
        </DialogHeader>
        <NewGoalForm 
            dict={dict} 
            onSuccess={() => setOpen(false)} 
            action={createGoalModal} 
        />
      </DialogContent>
    </Dialog>
  )
}
