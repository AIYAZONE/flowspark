'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createGoal } from '@/app/(authenticated)/goals/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangeFields } from '@/components/DateRangeFields'
import { SubmitButton } from '@/components/SubmitButton'
import type en from '@/i18n/en.json'

type Dict = typeof en

interface NewGoalFormProps {
  dict: Dict
  onSuccess?: (created?: { id?: string; title?: string }) => void
  action?: (formData: FormData) => Promise<unknown>
}

export function NewGoalForm({ dict, onSuccess, action }: NewGoalFormProps) {
  const submitAction = action || createGoal
  const [category, setCategory] = useState<string>('other')
  const [priority, setPriority] = useState<string>('medium')
  const [dateValid, setDateValid] = useState(true)

  async function handleSubmit(formData: FormData) {
    // 临时调试：确认提交值（稍后移除）
    // console.log('NewGoalForm submit:', Object.fromEntries((formData as unknown as Iterable<[string, FormDataEntryValue]>)))
    formData.set('category', category)
    formData.set('priority', priority)
    const result = await submitAction(formData) as { success?: boolean; goalId?: string; title?: string } | undefined
    if (onSuccess) {
      onSuccess(result && result.success ? { id: result.goalId, title: result.title } : undefined)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="title" required>{dict.goals.new.titleLabel}</Label>
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
          <Select name="category" value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder={dict.goals.category.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="other">{dict.goals.category.other}</SelectItem>
              <SelectItem value="health">{dict.goals.category.health}</SelectItem>
              <SelectItem value="career">{dict.goals.category.career}</SelectItem>
              <SelectItem value="learning">{dict.goals.category.learning}</SelectItem>
              <SelectItem value="finance">{dict.goals.category.finance}</SelectItem>
              <SelectItem value="lifestyle">{dict.goals.category.lifestyle}</SelectItem>
              <SelectItem value="social">{dict.goals.category.social}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">{dict.goals.priority.label}</Label>
          <Select name="priority" value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder={dict.goals.priority.label} />
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
        defaultStart={new Date().toISOString().split('T')[0]}
        defaultEnd={new Date().toISOString().split('T')[0]}
        labels={{ start: dict.goals.new.startDate, end: dict.goals.new.endDate, error: dict.common.dateRangeInvalid }}
      />

      <div className="grid gap-2">
        <Label htmlFor="success_criteria" required>{dict.goals.new.successCriteriaLabel}</Label>
        <Textarea
          id="success_criteria"
          name="success_criteria"
          placeholder={dict.goals.new.successCriteriaPlaceholder}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="stop_criteria" required>{dict.goals.new.abandonCriteriaLabel}</Label>
        <Textarea
          id="stop_criteria"
          name="stop_criteria"
          placeholder={dict.goals.new.abandonCriteriaPlaceholder}
          required
        />
      </div>

      <div className="flex justify-end gap-4">
        {onSuccess ? (
          <Button type="button" variant="outline" onClick={() => onSuccess()}>{dict.common.cancel}</Button>
        ) : (
          <Link href="/goals">
            <Button type="button" variant="outline">{dict.common.cancel}</Button>
          </Link>
        )}
        <SubmitButton disabled={!dateValid}>{dict.goals.new.submit}</SubmitButton>
      </div>
    </form>
  )
}
