'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NewGoalDialogShell } from '@/components/NewGoalDialogShell'
import { NewGoalForm } from '@/components/NewGoalForm'
import { createGoalModal } from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'

type Dict = typeof en

export function NewGoalRouteModal({ dict }: { dict: Dict }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  return (
    <NewGoalDialogShell
      open={open}
      title={dict.goals.newGoal}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) router.back()
      }}
    >
      <NewGoalForm
        dict={dict}
        fixedFooter
        action={createGoalModal}
        onSuccess={() => {
          setOpen(false)
          router.back()
        }}
      />
    </NewGoalDialogShell>
  )
}
