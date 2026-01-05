'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangeFields } from '@/components/DateRangeFields'
import { createAction } from '@/app/(authenticated)/goals/actions'

type Goal = {
  id: string
  title: string
}

interface SetCoreActionSheetProps {
  goals: Goal[] | null
  dict: {
    dashboard: {
      setCoreAction: string
    }
    today: {
      goalLabel: string
      selectGoal: string
      actionTitleLabel: string
      actionTitlePlaceholder: string
      startTime: string
      endTime: string
    }
    common: { dateRangeInvalid: string }
  }
  defaultDate: string
}

export function SetCoreActionSheet({ goals, dict, defaultDate }: SetCoreActionSheetProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [valid, setValid] = useState(true)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      await createAction(formData)
      setOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="link" className="px-0 text-primary underline">
          {dict.dashboard.setCoreAction}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{dict.dashboard.setCoreAction}</SheetTitle>
        </SheetHeader>
        <form action={handleSubmit} className="space-y-4 mt-4">
          <input type="hidden" name="type" value="core" />

          <div className="grid gap-2">
            <Label htmlFor="goal_id">{dict.today.goalLabel}</Label>
            <Select name="goal_id" required>
              <SelectTrigger>
                <SelectValue placeholder={dict.today.selectGoal} />
              </SelectTrigger>
              <SelectContent>
                {goals?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(!goals || goals.length === 0) && (
            <div className="text-sm text-muted-foreground">
              <Link href="/goals/new" className="text-primary underline">创建目标</Link> 后设置核心行动
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">{dict.today.actionTitleLabel}</Label>
            <Input id="title" name="title" placeholder={dict.today.actionTitlePlaceholder} required />
          </div>

          <DateRangeFields
            defaultStart={defaultDate}
            defaultEnd={defaultDate}
            labels={{ start: dict.today.startTime, end: dict.today.endTime, error: dict.common.dateRangeInvalid }}
            onValidityChange={setValid}
          />

          <SheetFooter>
            <Button type="submit" disabled={isLoading || !goals || goals.length === 0 || !valid} className="w-full">
              {isLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground" />}
              {dict.dashboard.setCoreAction}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
