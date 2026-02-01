'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { createAction, createGoal } from '@/app/(authenticated)/goals/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangeFields } from '@/components/DateRangeFields'
import { GoalCategorySelect } from '@/components/GoalCategorySelect'
import { SubmitButton } from '@/components/SubmitButton'
import { normalizeCategoryInput } from '@/lib/goalCategories'
import type en from '@/i18n/en.json'

type Dict = typeof en

interface NewGoalFormProps {
  dict: Dict
  onSuccess?: (created?: { id?: string; title?: string }) => void
  action?: (formData: FormData) => Promise<unknown>
}

type ActionType = 'core' | 'maintenance' | 'learning' | 'review' | 'rest'
type ActionPriority = 'high' | 'medium' | 'low'

type DraftAction = {
  id: string
  enabled: boolean
  title: string
  description: string
  type: ActionType
  priority: ActionPriority
  start_date: string
  end_date: string
  estimated_minutes?: number
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function NewGoalForm({ dict, onSuccess, action }: NewGoalFormProps) {
  const submitAction = action || createGoal
  const formRef = useRef<HTMLFormElement | null>(null)
  const [category, setCategory] = useState<string>('other')
  const [priority, setPriority] = useState<string>('medium')
  const [dateValid, setDateValid] = useState(true)
  const [goalTitle, setGoalTitle] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [draftActions, setDraftActions] = useState<DraftAction[]>([])
  const [creatingActions, setCreatingActions] = useState(false)
  const hasEnabledDrafts = draftActions.some(a => a.enabled)

  async function handleSubmit(formData: FormData) {
    // 临时调试：确认提交值（稍后移除）
    // console.log('NewGoalForm submit:', Object.fromEntries((formData as unknown as Iterable<[string, FormDataEntryValue]>)))
    formData.set('category', normalizeCategoryInput(category))
    formData.set('priority', priority)
    const result = await submitAction(formData) as { success?: boolean; goalId?: string; title?: string } | undefined
    const goalId = result?.goalId

    if (goalId && draftActions.some(a => a.enabled)) {
      setCreatingActions(true)
      try {
        for (const a of draftActions) {
          if (!a.enabled) continue
          const actionData = new FormData()
          actionData.set('goal_id', goalId)
          actionData.set('title', a.title)
          actionData.set('type', a.type)
          actionData.set('priority', a.priority)
          actionData.set('description', a.description)
          actionData.set('start_date', a.start_date)
          actionData.set('end_date', a.end_date)
          await createAction(actionData)
        }
      } finally {
        setCreatingActions(false)
      }
    }
    if (onSuccess) {
      onSuccess(result && result.success ? { id: result.goalId, title: result.title } : undefined)
    }
  }

  async function handleAISplit() {
    setAiError(null)
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const goalTitle = (formData.get('title') as string) || ''
    const goalDescription = (formData.get('description') as string) || ''
    const startDate = (formData.get('start_date') as string) || ''
    const endDate = (formData.get('end_date') as string) || ''
    const locale = (dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'

    if (!goalTitle.trim() || !startDate || !endDate) {
      setAiError(dict.common.errors.missing_fields)
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalTitle, goalDescription, startDate, endDate, locale })
      })

      const json = (await res.json()) as { actions?: unknown; error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        setAiError((dict.common.errors as Record<string, string>)[key] || dict.common.errors.operation_failed)
        return
      }

      const actions = Array.isArray(json.actions) ? json.actions : []
      const drafts: DraftAction[] = []

      for (const item of actions) {
        if (!item || typeof item !== 'object') continue
        const obj = item as Record<string, unknown>
        const title = typeof obj.title === 'string' ? obj.title.trim() : ''
        if (!title) continue
        const description = typeof obj.description === 'string' ? obj.description : ''
        const type = (typeof obj.type === 'string' ? obj.type : 'core') as ActionType
        const priority = (typeof obj.priority === 'string' ? obj.priority : 'medium') as ActionPriority
        const start_date = (typeof obj.start_date === 'string' ? obj.start_date : startDate)
        const end_date = (typeof obj.end_date === 'string' ? obj.end_date : endDate)
        const estimated_minutes = typeof obj.estimated_minutes === 'number' ? obj.estimated_minutes : undefined

        drafts.push({
          id: makeId(),
          enabled: true,
          title,
          description,
          type,
          priority,
          start_date,
          end_date,
          estimated_minutes
        })
      }

      if (drafts.length === 0) {
        setAiError(dict.common.errors.operation_failed)
        return
      }

      setDraftActions(drafts)
    } catch {
      setAiError(dict.common.errors.operation_failed)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="title" required>{dict.goals.new.titleLabel}</Label>
        <Input
          id="title"
          name="title"
          placeholder={dict.goals.new.titlePlaceholder}
          required
          onChange={(e) => setGoalTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">{dict.goals.new.descriptionLabel}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={dict.goals.new.descriptionPlaceholder}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleAISplit}
            disabled={aiLoading || creatingActions || !goalTitle.trim() || !dateValid}
          >
            {aiLoading && <LoadingSpinner size={16} className="mr-2 text-current" />}
            {dict.goals.new.aiSplitButton || 'AI 帮我拆解'}
          </Button>
          <div className="text-xs text-muted-foreground">
            {dict.goals.new.aiSplitHint || '仅生成草案，不会创建目标；点击“创建目标”才会保存'}
          </div>
          {creatingActions && (
            <div className="text-sm text-muted-foreground flex items-center">
              <LoadingSpinner size={14} className="mr-2 text-current" />
              {dict.goals.new.aiCreatingActions || '正在创建行动...'}
            </div>
          )}
        </div>
        {aiError && <div className="text-sm text-destructive">{aiError}</div>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">{dict.goals.category.label}</Label>
          <GoalCategorySelect dict={dict} value={category} onChange={setCategory} />
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
        onValidityChange={setDateValid}
      />

      {draftActions.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="font-medium">{dict.goals.new.aiSuggestionsTitle || 'AI 建议行动（可编辑）'}</div>
          <div className="space-y-3">
            {draftActions.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-md border border-border/50 bg-background/50 p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={a.enabled}
                  onChange={(e) => {
                    const enabled = e.target.checked
                    setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, enabled } : x))
                  }}
                />
                <div className="flex-1 space-y-2">
                  <Input
                    value={a.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, title } : x))
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={a.type}
                      onChange={(e) => {
                        const type = e.target.value as ActionType
                        setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, type } : x))
                      }}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="core">{dict.today.types.core}</option>
                      <option value="maintenance">{dict.today.types.maintenance}</option>
                      <option value="learning">{dict.today.types.learning}</option>
                      <option value="review">{dict.today.types.review}</option>
                      <option value="rest">{dict.today.types.rest}</option>
                    </select>
                    <select
                      value={a.priority}
                      onChange={(e) => {
                        const priority = e.target.value as ActionPriority
                        setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, priority } : x))
                      }}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="high">{dict.goals.priority.high}</option>
                      <option value="medium">{dict.goals.priority.medium}</option>
                      <option value="low">{dict.goals.priority.low}</option>
                    </select>
                  </div>
                  <Textarea
                    value={a.description}
                    onChange={(e) => {
                      const description = e.target.value
                      setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, description } : x))
                    }}
                    className="min-h-[70px] text-sm bg-background/50"
                    placeholder={dict.common.noDescription}
                  />
                  {typeof a.estimated_minutes === 'number' && (
                    <div className="text-xs text-muted-foreground">
                      {dict.goals.new.aiEstimatedMinutes?.replace('{minutes}', a.estimated_minutes.toString()) || `约 ${a.estimated_minutes} 分钟`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <SubmitButton disabled={!dateValid || creatingActions}>
          {hasEnabledDrafts ? (dict.goals.new.submitWithActions || dict.goals.new.submit) : dict.goals.new.submit}
        </SubmitButton>
      </div>
    </form>
  )
}
