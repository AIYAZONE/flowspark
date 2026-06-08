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
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'
import { scheduleRangesWithinGoal } from '@/lib/actionScheduling'
import type en from '@/i18n/en.json'
import type { GoalBriefInput, GoalSetupStepAOutput, GoalSetupStepBOutput } from '@/lib/ai/phase2aSchemas'

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
  const newDict = dict.goals.new as unknown as Record<string, string>
  const [createMode, setCreateMode] = useState<'manual' | 'ai'>('manual')
  const [goalStart, setGoalStart] = useState(() => new Date().toISOString().slice(0, 10))
  const [goalEnd, setGoalEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState<string>('other')
  const [priority, setPriority] = useState<string>('medium')
  const [dateValid, setDateValid] = useState(true)
  const [goalTitle, setGoalTitle] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [aiStepA, setAiStepA] = useState<GoalSetupStepAOutput | null>(null)
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({})
  const [aiStepB, setAiStepB] = useState<GoalSetupStepBOutput | null>(null)
  const [draftActions, setDraftActions] = useState<DraftAction[]>([])
  const [creatingActions, setCreatingActions] = useState(false)
  const hasEnabledDrafts = draftActions.some(a => a.enabled)
  const [successCriteriaText, setSuccessCriteriaText] = useState('')
  const [stopCriteriaText, setStopCriteriaText] = useState('')

  async function handleSubmit(formData: FormData) {
    setSubmitError(null)
    // 临时调试：确认提交值（稍后移除）
    // console.log('NewGoalForm submit:', Object.fromEntries((formData as unknown as Iterable<[string, FormDataEntryValue]>)))
    formData.set('category', normalizeCategoryInput(category))
    formData.set('priority', priority)
    const goalStartDate = ((formData.get('start_date') as string) || '').trim()
    const goalEndDate = ((formData.get('end_date') as string) || '').trim()
    let result: unknown
    try {
      result = await submitAction(formData)
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'digest' in error &&
        typeof (error as { digest?: unknown }).digest === 'string' &&
        (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      ) {
        throw error
      }
      const code = error instanceof Error ? error.message : 'operation_failed'
      const errors = dict.common.errors as unknown as Record<string, string>
      setSubmitError(errors[code] || errors.operation_failed)
      return
    }

    if (result && typeof result === 'object' && 'error' in result) {
      const code = typeof (result as { error?: unknown }).error === 'string'
        ? (result as { error: string }).error
        : 'operation_failed'
      const errors = dict.common.errors as unknown as Record<string, string>
      setSubmitError(errors[code] || errors.operation_failed)
      return
    }

    const typed = result as { success?: boolean; goalId?: string; title?: string } | undefined
    const goalId = typed?.goalId

    if (goalId && draftActions.some(a => a.enabled)) {
      setCreatingActions(true)
      try {
        const enabledCount = draftActions.filter(a => a.enabled).length
        for (const a of draftActions) {
          if (!a.enabled) continue
          let start_date = (a.start_date || goalStartDate).trim()
          let end_date = (a.end_date || start_date || goalEndDate).trim()
          if (end_date && start_date && end_date < start_date) end_date = start_date
          if (goalStartDate && start_date && start_date < goalStartDate) start_date = goalStartDate
          if (goalEndDate && end_date && end_date > goalEndDate) end_date = goalEndDate
          if (goalEndDate && start_date && start_date > goalEndDate) start_date = goalEndDate
          if (goalStartDate && end_date && end_date < goalStartDate) end_date = goalStartDate
          if (end_date && start_date && end_date < start_date) end_date = start_date

          const actionData = new FormData()
          actionData.set('goal_id', goalId)
          actionData.set('title', a.title)
          actionData.set('type', a.type)
          actionData.set('priority', a.priority)
          actionData.set('description', a.description)
          actionData.set('start_date', start_date)
          actionData.set('end_date', end_date)
          await createAction(actionData)
        }
        logEvent('ai_goal_setup_apply', { applied_actions: enabledCount, used_ai: !!aiStepB })
        sendAIFeedback('ai_goal_setup_apply', { applied_actions: enabledCount, used_ai: !!aiStepB })
      } finally {
        setCreatingActions(false)
      }
    }
    if (onSuccess) {
      onSuccess(typed && typed.success ? { id: typed.goalId, title: typed.title } : undefined)
    }
  }

  function buildGoalBrief(formData: FormData): GoalBriefInput {
    const title = ((formData.get('title') as string) || '').trim()
    const descriptionRaw = ((formData.get('description') as string) || '').trim()
    const start_date = ((formData.get('start_date') as string) || '').trim() || null
    const end_date = ((formData.get('end_date') as string) || '').trim() || null
    const success_criteria = ((formData.get('success_criteria') as string) || '').trim() || null
    const stop_criteria = ((formData.get('stop_criteria') as string) || '').trim() || null

    return {
      title,
      description: descriptionRaw || null,
      start_date,
      end_date,
      priority: (priority as GoalBriefInput['priority']) || 'medium',
      category: normalizeCategoryInput(category),
      success_criteria,
      stop_criteria,
      user_context: { time_budget_bucket: 'unknown', constraints: [], likely_frictions: [], preference: null }
    }
  }

  function mapStepBToDraftActions(stepB: GoalSetupStepBOutput) {
    const ifThenLines = stepB.if_then_plans
      .map(p => `If-Then: 如果${p.if} 那么${p.then}`)
      .join('\n')

    const ranges = scheduleRangesWithinGoal({
      start: stepB.goal_draft.start_date,
      end: stepB.goal_draft.end_date,
      count: stepB.actions.length
    })

    const drafts: DraftAction[] = []
    for (const [idx, a] of stepB.actions.entries()) {
      const numberedTitle = /^\d+\./.test(a.title.trim()) ? a.title.trim() : `${idx + 1}. ${a.title}`
      const descriptionParts = [`Why: ${a.why}`, `DoD: ${a.definition_of_done}`]
      if (ifThenLines) descriptionParts.push(ifThenLines)
      const r = ranges[idx]
      drafts.push({
        id: makeId(),
        enabled: true,
        title: numberedTitle,
        description: descriptionParts.join('\n'),
        type: a.action_type,
        priority: (a.priority || 'medium') as ActionPriority,
        start_date: r?.start ?? stepB.goal_draft.start_date,
        end_date: r?.end ?? stepB.goal_draft.end_date,
        estimated_minutes: a.estimated_minutes
      })
    }
    return drafts
  }

  function formatCriteriaMarkdown(stepB: GoalSetupStepBOutput) {
    const successLines = stepB.success_criteria.map(c => `- ${c.type === 'outcome' ? '结果型' : '过程型'}：${c.text}`)
    const stopLines = stepB.stop_criteria.map(c => `- ${c.type === 'resource' ? '资源' : '方向'}：${c.text}`)
    return { success: successLines.join('\n'), stop: stopLines.join('\n') }
  }

  async function handleAISplit() {
    setAiError(null)
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const startDate = ((formData.get('start_date') as string) || '').trim()
    const endDate = ((formData.get('end_date') as string) || '').trim()
    const locale = (dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'

    const brief = buildGoalBrief(formData)

    if (!brief.title) {
      setAiError(dict.common.errors.missing_fields)
      return
    }
    if (createMode === 'ai' && !brief.description) {
      setAiError(dict.common.errors.missing_fields)
      return
    }
    if (createMode === 'manual' && (!startDate || !endDate)) {
      setAiError(dict.common.errors.missing_fields)
      return
    }

    setAiLoading(true)
    try {
      logEvent('ai_goal_setup_click', {
        source: 'new_goal',
        has_desc: !!brief.description,
        desc_len: brief.description ? brief.description.length : 0
      })
      sendAIFeedback('ai_goal_setup_click', {
        source: 'new_goal',
        has_desc: !!brief.description,
        desc_len: brief.description ? brief.description.length : 0
      })
      setAiStepA(null)
      setAiStepB(null)
      setDraftActions([])
      setAiAnswers({})

      const res = await fetch('/api/ai/goal-setup/step-a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, locale, today: new Date().toISOString().slice(0, 10) })
      })

      const json = (await res.json()) as { result?: GoalSetupStepAOutput; error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        setAiError((dict.common.errors as Record<string, string>)[key] || dict.common.errors.operation_failed)
        return
      }

      const result = json.result
      if (!result) {
        setAiError(dict.common.errors.operation_failed)
        return
      }

      setAiStepA(result)
      if (result.need_more_info.blocking) {
        logEvent('ai_goal_setup_stepA_need_more', { missing: result.need_more_info.missing })
        sendAIFeedback('ai_goal_setup_stepA_need_more', { missing_count: result.need_more_info.missing.length })
      } else {
        logEvent('ai_goal_setup_stepA_success', { questions: result.clarifying_questions.length })
        sendAIFeedback('ai_goal_setup_stepA_success', { questions: result.clarifying_questions.length })
      }
      if (!result.need_more_info.blocking) {
        const initialAnswers: Record<string, string> = {}
        for (const q of result.clarifying_questions) initialAnswers[q.id] = ''
        setAiAnswers(initialAnswers)
      }
    } catch {
      setAiError(dict.common.errors.operation_failed)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleAIGenerateDrafts() {
    setAiError(null)
    if (!formRef.current) return
    if (!aiStepA || aiStepA.need_more_info.blocking) return

    const formData = new FormData(formRef.current)
    const startDate = ((formData.get('start_date') as string) || '').trim()
    const endDate = ((formData.get('end_date') as string) || '').trim()
    const locale = (dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
    const brief = buildGoalBrief(formData)

    if (!brief.title) {
      setAiError(dict.common.errors.missing_fields)
      return
    }
    if (createMode === 'ai' && !brief.description) {
      setAiError(dict.common.errors.missing_fields)
      return
    }
    if (createMode === 'manual' && (!startDate || !endDate)) {
      setAiError(dict.common.errors.missing_fields)
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/goal-setup/step-b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, answers: aiAnswers, locale, today: new Date().toISOString().slice(0, 10) })
      })
      const json = (await res.json()) as { result?: GoalSetupStepBOutput; error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        setAiError((dict.common.errors as Record<string, string>)[key] || dict.common.errors.operation_failed)
        return
      }

      const result = json.result
      if (!result) {
        setAiError(dict.common.errors.operation_failed)
        return
      }

      setAiStepB(result)
      setCategory(result.goal_draft.category)
      setPriority(result.goal_draft.priority)
      setGoalStart(result.goal_draft.start_date)
      setGoalEnd(result.goal_draft.end_date)
      setDateValid(true)
      logEvent('ai_goal_setup_stepB_success', { actions: result.actions.length, has_if_then: result.if_then_plans.length > 0 })
      sendAIFeedback('ai_goal_setup_stepB_success', { actions: result.actions.length, has_if_then: result.if_then_plans.length > 0 })
      const drafts = mapStepBToDraftActions(result)
      setDraftActions(drafts)
      const criteria = formatCriteriaMarkdown(result)
      setSuccessCriteriaText(criteria.success)
      setStopCriteriaText(criteria.stop)
    } catch {
      setAiError(dict.common.errors.operation_failed)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${createMode === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setCreateMode('manual')}
        >
          {newDict.manualCreate || '手动创建'}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${createMode === 'ai' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setCreateMode('ai')}
        >
          {newDict.aiSplitCreate || 'AI 拆解创建'}
        </button>
      </div>

      {submitError && (
        <div className="text-sm text-destructive" role="alert">
          {submitError}
        </div>
      )}

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
            disabled={aiLoading || creatingActions || !goalTitle.trim() || (createMode === 'manual' && !dateValid)}
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

      {aiStepA && (
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{newDict.aiUnderstandingTitle || 'AI 理解摘要（草案）'}</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{aiStepA.understanding.goal_summary}</div>
              {aiStepA.understanding.key_constraints.length > 0 && (
                <div className="text-xs">
                  <div className="font-medium text-foreground/80">{newDict.aiConstraintsLabel || '关键约束'}</div>
                  <ul className="list-disc pl-5">
                    {aiStepA.understanding.key_constraints.map((c, i) => (
                      <li key={`${c}-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiStepA.understanding.likely_failure_reasons.length > 0 && (
                <div className="text-xs">
                  <div className="font-medium text-foreground/80">{newDict.aiFrictionsLabel || '可能阻力'}</div>
                  <ul className="list-disc pl-5">
                    {aiStepA.understanding.likely_failure_reasons.map((c, i) => (
                      <li key={`${c}-${i}`}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-xs">
                <div className="font-medium text-foreground/80">{newDict.aiLeverageLabel || '建议杠杆点'}</div>
                <div>{aiStepA.understanding.leverage_point}</div>
              </div>
            </div>
          </div>

          {aiStepA.need_more_info.blocking ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-destructive">{newDict.aiNeedMoreTitle || '还需要补充'}</div>
              <div className="text-sm text-muted-foreground">{aiStepA.need_more_info.message}</div>
              {aiStepA.need_more_info.missing.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {aiStepA.need_more_info.missing.map((m, i) => (
                    <li key={`${m}-${i}`}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium">{newDict.aiQuestionsTitle || '快速澄清（2-3 题）'}</div>
              <div className="space-y-3">
                {aiStepA.clarifying_questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <div className="text-sm">{q.question}</div>
                    {q.type === 'single_choice' ? (
                      <Select
                        value={aiAnswers[q.id] || undefined}
                        onValueChange={(value) => {
                          setAiAnswers(prev => ({ ...prev, [q.id]: value }))
                        }}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder={newDict.aiSelectPlaceholder || '请选择'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(q.options || []).map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={aiAnswers[q.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          setAiAnswers(prev => ({ ...prev, [q.id]: value }))
                        }}
                        placeholder={newDict.aiShortAnswerPlaceholder || '一句话回答即可'}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={handleAIGenerateDrafts}
                disabled={aiLoading || creatingActions}
              >
                {aiLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
                {newDict.aiGenerateDraftsButton || '生成草案'}
              </Button>
            </div>
          )}
        </div>
      )}

      {createMode === 'manual' || aiStepB ? (
        <>
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
            defaultStart={goalStart}
            defaultEnd={goalEnd}
            valueStart={goalStart}
            valueEnd={goalEnd}
            onChange={({ start, end }) => {
              setGoalStart(start)
              setGoalEnd(end)
            }}
            labels={{ start: dict.goals.new.startDate, end: dict.goals.new.endDate, error: dict.common.dateRangeInvalid }}
            onValidityChange={setDateValid}
          />
        </>
      ) : null}

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
                    <Select
                      value={a.type}
                      onValueChange={(value) => {
                        const type = value as ActionType
                        setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, type } : x))
                      }}
                    >
                      <SelectTrigger className="bg-background/50">
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
                    <Select
                      value={a.priority}
                      onValueChange={(value) => {
                        const priority = value as ActionPriority
                        setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, priority } : x))
                      }}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder={dict.goals.priority.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">{dict.goals.priority.high}</SelectItem>
                        <SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
                        <SelectItem value="low">{dict.goals.priority.low}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={a.start_date}
                      onChange={(e) => {
                        const start_date = e.target.value
                        setDraftActions(prev => prev.map(x => {
                          if (x.id !== a.id) return x
                          const nextEnd = x.end_date && x.end_date < start_date ? start_date : x.end_date
                          return { ...x, start_date, end_date: nextEnd }
                        }))
                      }}
                    />
                    <Input
                      type="date"
                      value={a.end_date}
                      min={a.start_date}
                      onChange={(e) => {
                        const end_date = e.target.value
                        setDraftActions(prev => prev.map(x => x.id === a.id ? { ...x, end_date } : x))
                      }}
                    />
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

      {createMode === 'manual' || aiStepB ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="success_criteria" required>{dict.goals.new.successCriteriaLabel}</Label>
            <Textarea
              id="success_criteria"
              name="success_criteria"
              placeholder={dict.goals.new.successCriteriaPlaceholder}
              required
              value={successCriteriaText}
              onChange={(e) => setSuccessCriteriaText(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="stop_criteria" required>{dict.goals.new.abandonCriteriaLabel}</Label>
            <Textarea
              id="stop_criteria"
              name="stop_criteria"
              placeholder={dict.goals.new.abandonCriteriaPlaceholder}
              required
              value={stopCriteriaText}
              onChange={(e) => setStopCriteriaText(e.target.value)}
            />
          </div>
        </>
      ) : null}

      <div className="flex justify-end gap-4">
        {onSuccess ? (
          <Button type="button" variant="outline" onClick={() => onSuccess()}>{dict.common.cancel}</Button>
        ) : (
          <Link href="/goals">
            <Button type="button" variant="outline">{dict.common.cancel}</Button>
          </Link>
        )}
        <SubmitButton disabled={!dateValid || creatingActions || (createMode === 'ai' && !aiStepB)}>
          {hasEnabledDrafts ? (dict.goals.new.submitWithActions || dict.goals.new.submit) : dict.goals.new.submit}
        </SubmitButton>
      </div>
    </form>
  )
}
