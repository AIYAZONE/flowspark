'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewGoalForm } from '@/components/NewGoalForm'
import { createGoalModal } from '@/app/(authenticated)/goals/actions'
import type en from '@/i18n/en.json'

type Dict = typeof en

export function NewGoalFullPage({ dict }: { dict: Dict }) {
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-lg border border-border/60 bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 bg-background/85 backdrop-blur px-4 py-3 sm:px-6">
          <div className="text-left">
            <div className="text-lg font-semibold leading-none tracking-tight">{dict.goals.newGoal}</div>
            <div className="mt-1 text-sm text-muted-foreground">{dict.goals.new.details}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={dict.common.cancel}
            onClick={() => router.push('/goals')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <NewGoalForm
            dict={dict}
            action={createGoalModal}
            onSuccess={(created) => {
              const id = created?.id
              router.push(id ? `/goals/${id}` : '/goals')
            }}
          />
        </div>
      </div>
    </div>
  )
}
