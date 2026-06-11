'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Check, CheckCircle2, Circle, Copy, Save, Sparkles } from 'lucide-react'

import type { Dictionary, GoalNewDictionary, TodayDictionary, CommonErrorDictionary } from '@/i18n/types'
import type { RescueOutput } from '@/lib/ai/phase2aSchemas'
import type { RescueApiResponse } from '@/lib/ai/types'
import type { AIBreakdownActionDraft } from '@/lib/ai/breakdown'
import { parseAITodayPlanFromDescription } from '@/lib/aiTodayPlan'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/SubmitButton'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRangeFields } from '@/components/DateRangeFields'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetClose, SheetFormContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ActionDescriptionEditor, type ActionAttachmentDraft } from '@/components/ActionDescriptionEditor'
import { RichTextContentView } from '@/components/RichTextContentView'
import { RichTextImagePreviewDialog } from '@/components/RichTextImagePreviewDialog'
import { ActionSubItemsSection } from '@/components/ActionSubItemsSection'
import { ModalActionFooter } from '@/components/ModalActionFooter'
import { ModalHeaderActions } from '@/components/ModalHeaderActions'
import { DESKTOP_MODAL_SHELL_CLASS } from '@/components/responsive-classes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createActionAndReturnId, updateAction } from '@/app/(authenticated)/goals/actions'
import { parseActionRecurrenceDescription, type ActionRecurrenceRule } from '@/lib/actionRecurrence'

interface Action {
  id: string
  title: string
  completed: boolean
  type: string
  priority?: string
  description?: string
  start_date: string
  end_date?: string | null
  ai_recommendation_id?: string | null
  goal_id: string
  goals?: {
    title: string
  } | null
  action_sub_items?: Array<{
    id: string
    title: string
    completed: boolean
    sort_order: number
  }>
}

type PanelMode = 'view' | 'edit' | 'rescue'

type EditSubItemDraft = {
  id?: string
  title: string
  completed: boolean
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function richTextToPlainText(input: string, locale: 'zh' | 'en'): string {
  const imageLabel = locale === 'zh' ? '图片' : 'Image'
  const normalized = decodeHtmlEntities(input)

  const withMarkdownImages = normalized.replace(
    /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_: string, src: string) => `\n${imageLabel}：${src}\n`
  )

  const withHtmlImages = withMarkdownImages.replace(
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    (_: string, src: string) => `\n${imageLabel}：${src}\n`
  )

  return withHtmlImages
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function ActionItemPanel({
  open,
  onOpenChange,
  panelMode,
  onPanelModeChange,
  action,
  dict,
  tz,
  goals,
  isDesktop,
  onToggleSubItem,
  subItemBusyId,
  onRequestDelete,
  onRescueOutcomeStateChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  panelMode: PanelMode
  onPanelModeChange: (mode: PanelMode) => void
  action: Action
  dict: Dictionary
  tz: string
  goals: { id: string; title: string }[]
  isDesktop: boolean
  onToggleSubItem: (id: string, currentCompleted: boolean) => Promise<void>
  subItemBusyId: string | null
  onRequestDelete: () => void
  onRescueOutcomeStateChange: (state: 'idle' | 'adopted' | 'dismissed') => void
}) {
  const router = useRouter()
  const recurrenceMeta = parseActionRecurrenceDescription(action.description || '')
  const todayText: TodayDictionary = dict.today
  const goalNewText: GoalNewDictionary = dict.goals.new
  const commonErrors: CommonErrorDictionary = dict.common.errors

  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const rescueTitleText = locale === 'zh' ? '卡住救援' : 'Rescue'
  const copyTitleText = locale === 'zh' ? '复制标题' : 'Copy title'
  const copyFullText = locale === 'zh' ? '复制标题和详情' : 'Copy title + details'
  const copiedText = locale === 'zh' ? '已复制' : 'Copied'
  const aiPlanCardTitle = locale === 'zh' ? 'AI 今日推进建议' : 'AI Today Focus'
  const aiPlanBasedOnLabel = locale === 'zh' ? '基于任务' : 'Based on'
  const aiPlanVariantLabel = locale === 'zh' ? '推进版本' : 'Focus mode'
  const aiPlanReasonLabel = locale === 'zh' ? '建议原因' : 'Why this'
  const closeLabel = locale === 'zh' ? '关闭' : 'Close'

  const [isLoading, setIsLoading] = useState(false)
  const [dateRangeValid, setDateRangeValid] = useState(true)
  const [uploadUserId, setUploadUserId] = useState<string>('')
  const [editTitle, setEditTitle] = useState(action.title)
  const [editDescription, setEditDescription] = useState(action.description || '')
  const [editGoalId, setEditGoalId] = useState(action.goal_id)
  const [editType, setEditType] = useState(action.type || 'core')
  const [editPriority, setEditPriority] = useState(action.priority || 'medium')
  const [editRepeatRule, setEditRepeatRule] = useState<ActionRecurrenceRule>(recurrenceMeta.recurrence)
  const [editStartDate, setEditStartDate] = useState(action.start_date)
  const [editEndDate, setEditEndDate] = useState(action.end_date || action.start_date)
  const [editSubItems, setEditSubItems] = useState<EditSubItemDraft[]>(
    (action.action_sub_items || []).map((item) => ({
      id: item.id,
      title: item.title,
      completed: Boolean(item.completed)
    }))
  )
  const [editAttachmentsDraft, setEditAttachmentsDraft] = useState<ActionAttachmentDraft[]>([])
  const [editDescriptionUploading, setEditDescriptionUploading] = useState(false)
  const [editAiLoading, setEditAiLoading] = useState(false)
  const [editAiError, setEditAiError] = useState<string | null>(null)
  const [editAiDrafts, setEditAiDrafts] = useState<AIBreakdownActionDraft[]>([])
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [discardIntent, setDiscardIntent] = useState<'switch_to_view' | 'close_panel'>('switch_to_view')
  const [copiedMode, setCopiedMode] = useState<'title' | 'full' | null>(null)
  const [isPanelFullscreen, setIsPanelFullscreen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const unsavedConfirmText = goalNewText.confirmDiscardChanges || '你有未保存的修改，确认放弃吗？'

  const [rescueReason, setRescueReason] = useState<RescueOutput['reason_tag']>('too_hard')
  const [rescueLoading, setRescueLoading] = useState(false)
  const [rescueError, setRescueError] = useState<string | null>(null)
  const [rescueResult, setRescueResult] = useState<RescueOutput | null>(null)
  const [rescueRecommendationId, setRescueRecommendationId] = useState<string | null>(null)
  const [rescueOutcomeState, setRescueOutcomeState] = useState<'idle' | 'adopted' | 'dismissed'>('idle')

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id || ''
      setUploadUserId(uid)
    })
  }, [])

  useEffect(() => {
    if (!open) return
    if (panelMode !== 'rescue') return
    logEvent('ai_rescue_click', { action_id: action.id })
    sendAIFeedback('ai_rescue_click', { action_id: action.id, goal_id: action.goal_id })
  }, [action.goal_id, action.id, open, panelMode])

  useEffect(() => {
    if (panelMode !== 'rescue') return
    setRescueError(null)
    setRescueResult(null)
    setRescueRecommendationId(null)
    setRescueOutcomeState('idle')
    onRescueOutcomeStateChange('idle')
  }, [onRescueOutcomeStateChange, panelMode])

  function resetEditDraftFromAction() {
    setEditTitle(action.title)
    setEditDescription(action.description || '')
    setEditGoalId(action.goal_id)
    setEditType(action.type || 'core')
    setEditPriority(action.priority || 'medium')
    setEditRepeatRule(parseActionRecurrenceDescription(action.description || '').recurrence)
    setEditStartDate(action.start_date)
    setEditEndDate(action.end_date || action.start_date)
    setEditSubItems(
      (action.action_sub_items || []).map((item) => ({
        id: item.id,
        title: item.title,
        completed: Boolean(item.completed)
      }))
    )
    setEditAttachmentsDraft([])
    setEditDescriptionUploading(false)
    setEditAiLoading(false)
    setEditAiError(null)
    setEditAiDrafts([])
    if (!open) {
      setIsPanelFullscreen(false)
    }
  }

  const isEditDirty = (() => {
    const baseStart = action.start_date || ''
    const baseEnd = action.end_date || action.start_date || ''
    return (
      editTitle !== action.title ||
      editDescription !== (action.description || '') ||
      editGoalId !== action.goal_id ||
      editType !== (action.type || 'core') ||
      editPriority !== (action.priority || 'medium') ||
      editRepeatRule !== parseActionRecurrenceDescription(action.description || '').recurrence ||
      editStartDate !== baseStart ||
      editEndDate !== baseEnd ||
      JSON.stringify(editSubItems) !==
        JSON.stringify(
          (action.action_sub_items || []).map((item) => ({
            id: item.id,
            title: item.title,
            completed: Boolean(item.completed)
          }))
        ) ||
      editAttachmentsDraft.length > 0
    )
  })()

  function confirmDiscardAndProceed() {
    setDiscardDialogOpen(false)
    resetEditDraftFromAction()
    onPanelModeChange('view')
    if (discardIntent === 'close_panel') {
      onOpenChange(false)
    }
  }

  function requestExitEdit(intent: 'switch_to_view' | 'close_panel') {
    if (isEditDirty) {
      setDiscardIntent(intent)
      setDiscardDialogOpen(true)
      return
    }
    resetEditDraftFromAction()
    onPanelModeChange('view')
    if (intent === 'close_panel') {
      onOpenChange(false)
      setIsPanelFullscreen(false)
    }
  }

  const handlePanelOpenChange = (next: boolean) => {
    if (!next && panelMode === 'edit') {
      requestExitEdit('close_panel')
      return
    }

    if (!next && panelMode === 'rescue' && rescueResult && rescueRecommendationId && rescueOutcomeState === 'idle') {
      setRescueOutcomeState('dismissed')
      onRescueOutcomeStateChange('dismissed')
      void fetch(`/api/ai/recommendations/${rescueRecommendationId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackLabel: 'dismiss' })
      }).catch(() => {})
    }

    onOpenChange(next)
    if (!next) {
      onPanelModeChange('view')
      setIsPanelFullscreen(false)
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!dateRangeValid || editDescriptionUploading) return
    setIsLoading(true)
    try {
      await updateAction(formData)
      onPanelModeChange('view')
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const recurrenceLabelMap: Record<ActionRecurrenceRule, string> = {
    none: todayText.repeatNone || (locale === 'zh' ? '不重复' : 'No repeat'),
    daily: todayText.repeatDaily || (locale === 'zh' ? '每天' : 'Daily'),
    weekly: todayText.repeatWeekly || (locale === 'zh' ? '每周' : 'Weekly'),
    monthly: todayText.repeatMonthly || (locale === 'zh' ? '每月' : 'Monthly'),
  }

  const parsedAITodayPlan = parseAITodayPlanFromDescription(recurrenceMeta.cleanDescription || '')
  const displayDescription = parsedAITodayPlan?.remainingDescription || recurrenceMeta.cleanDescription || ''
  const hasDescription = Boolean(displayDescription)
  const goalTitle = action.goals?.title || goals.find((g) => g.id === action.goal_id)?.title || ''

  const rescueReasonOptions: Array<{ value: RescueOutput['reason_tag']; label: string }> = [
    { value: 'no_time', label: locale === 'zh' ? '没时间' : 'No time' },
    { value: 'too_hard', label: locale === 'zh' ? '太难' : 'Too hard' },
    { value: 'anxiety', label: locale === 'zh' ? '焦虑' : 'Anxiety' },
    { value: 'unclear_next', label: locale === 'zh' ? '不知道下一步' : 'Unclear next' },
    { value: 'low_energy', label: locale === 'zh' ? '没精力' : 'Low energy' },
    { value: 'other', label: locale === 'zh' ? '其他' : 'Other' },
  ]

  const metaBadges = (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span className="capitalize px-2 py-0.5 rounded-full bg-secondary/50 font-medium text-secondary-foreground border border-border/50">
        {dict.today.types[action.type as keyof typeof dict.today.types] || action.type}
      </span>
      <span
        className={cn(
          'capitalize px-2 py-0.5 rounded-full font-medium border',
          action.priority === 'high'
            ? 'bg-red-500/10 text-red-500 border-red-500/20'
            : action.priority === 'medium'
              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              : action.priority === 'low'
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                : 'bg-muted text-muted-foreground border-border'
        )}
      >
        {dict.goals.priority[action.priority as keyof typeof dict.goals.priority] || action.priority || dict.goals.priority.medium}
      </span>
      {recurrenceMeta.recurrence !== 'none' ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/6 px-2 py-0.5 font-medium text-primary">
          {recurrenceLabelMap[recurrenceMeta.recurrence]}
        </span>
      ) : null}
      <span className="font-mono text-[11px] opacity-80 flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" />
        {format(new Date(action.start_date), 'yyyy-MM-dd')}
        {action.end_date && action.end_date !== action.start_date && ` ~ ${format(new Date(action.end_date), 'yyyy-MM-dd')}`}
      </span>
    </div>
  )

  const aiPlanInsightCard = parsedAITodayPlan ? (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        {aiPlanCardTitle}
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-background/90 px-3 py-1 font-medium text-foreground border border-border/50">
            {aiPlanVariantLabel}：{parsedAITodayPlan.variantLabel}
          </span>
          {parsedAITodayPlan.basedOn ? (
            <span className="rounded-full bg-background/90 px-3 py-1 font-medium text-muted-foreground border border-border/50">
              {aiPlanBasedOnLabel}：{parsedAITodayPlan.basedOn}
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-border/50 bg-background/85 p-3">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {locale === 'zh' ? '第一步' : 'First step'}
            </div>
            <div className="text-sm leading-6 text-foreground">{parsedAITodayPlan.firstStep}</div>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/85 p-3">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {locale === 'zh' ? '完成标准' : 'Definition of done'}
            </div>
            <div className="text-sm leading-6 text-foreground">{parsedAITodayPlan.definitionOfDone}</div>
          </div>
        </div>
        {parsedAITodayPlan.reason ? (
          <div className="rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground leading-6">
            <span className="mr-2 font-medium text-foreground">{aiPlanReasonLabel}</span>
            {parsedAITodayPlan.reason}
          </div>
        ) : null}
      </div>
    </div>
  ) : null

  const viewDescription = hasDescription ? (
    <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
      <RichTextContentView html={displayDescription} onImageClick={setPreviewImageUrl} />
    </div>
  ) : parsedAITodayPlan ? null : (
    <div className="rounded-lg border border-border/50 bg-secondary/10 p-4 text-sm text-muted-foreground/70">
      {dict.common.noDescription}
    </div>
  )

  async function handleCopy(mode: 'title' | 'full') {
    const title = action.title.trim()
    const description = richTextToPlainText(displayDescription, locale).trim()
    const text = mode === 'title' ? title : [title, description].filter(Boolean).join('\n\n')
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopiedMode(mode)
      setTimeout(() => {
        setCopiedMode((current) => (current === mode ? null : current))
      }, 1200)
    } catch (error) {
      console.error(error)
    }
  }

  const copyActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => handleCopy('title')} className="gap-1.5">
        {copiedMode === 'title' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiedMode === 'title' ? copiedText : copyTitleText}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => handleCopy('full')} className="gap-1.5">
        {copiedMode === 'full' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiedMode === 'full' ? copiedText : copyFullText}
      </Button>
    </div>
  )

  async function handleAISplitForEdit() {
    setEditAiError(null)
    setEditAiDrafts([])
    const computedGoalTitle = goals.find((g) => g.id === editGoalId)?.title || action.goals?.title || editTitle.trim()
    if (!editGoalId || !editTitle.trim()) {
      setEditAiError(dict.common.errors.missing_fields)
      return
    }
    setEditAiLoading(true)
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: computedGoalTitle,
          goalDescription: editTitle.trim(),
          startDate: editStartDate,
          endDate: editEndDate,
          locale
        })
      })
      const json = (await res.json()) as { actions?: AIBreakdownActionDraft[]; error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        setEditAiError(commonErrors[key as keyof CommonErrorDictionary] || commonErrors.operation_failed)
        return
      }
      const drafts = Array.isArray(json.actions) ? json.actions : []
      if (drafts.length === 0) {
        setEditAiError(dict.common.errors.operation_failed)
        return
      }
      setEditAiDrafts(drafts.slice(0, 5))
    } catch {
      setEditAiError(dict.common.errors.operation_failed)
    } finally {
      setEditAiLoading(false)
    }
  }

  function applyEditAIDraft(draft: AIBreakdownActionDraft) {
    const title = draft.title.trim()
    if (!title) return
    setEditSubItems((prev) => {
      if (prev.some((item) => item.title.trim() === title)) return prev
      return [...prev, { title, completed: false }]
    })
    setEditAiError(null)
  }

  function importAllEditAIDrafts() {
    if (editAiDrafts.length === 0) return
    setEditSubItems((prev) => {
      const existing = new Set(prev.map((item) => item.title.trim()))
      const imported = editAiDrafts
        .map((draft) => draft.title.trim())
        .filter((title) => title && !existing.has(title))
        .map((title) => ({ title, completed: false }))
      return [...prev, ...imported]
    })
  }

  async function generateRescue() {
    if (!goalTitle) return
    setRescueError(null)
    setRescueLoading(true)
    setRescueRecommendationId(null)
    setRescueOutcomeState('idle')
    onRescueOutcomeStateChange('idle')
    try {
      const res = await fetch('/api/ai/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          reason_tag: rescueReason,
          action: { id: action.id, title: action.title, description: action.description || null },
          goal: { id: action.goal_id, title: goalTitle }
        })
      })
      const json = (await res.json()) as RescueApiResponse & { error?: string }
      if (!res.ok) {
        const key = json.error || 'operation_failed'
        setRescueError(commonErrors[key as keyof CommonErrorDictionary] || commonErrors.operation_failed)
        return
      }
      if (!json.data || !json.recommendationId) {
        setRescueError(dict.common.errors.operation_failed)
        return
      }
      setRescueResult(json.data)
      setRescueRecommendationId(json.recommendationId)
    } catch {
      setRescueError(dict.common.errors.operation_failed)
    } finally {
      setRescueLoading(false)
    }
  }

  async function applyRescueReplace() {
    if (!rescueResult) return
    setRescueLoading(true)
    try {
      const endDateStr = action.end_date || action.start_date
      const description = [
        `First step: ${rescueResult.minimal_variant.first_step}`,
        `DoD: ${rescueResult.minimal_variant.definition_of_done}`,
        `If-Then: 如果${rescueResult.if_then.if} 那么${rescueResult.if_then.then}`
      ].join('\n')

      const formData = new FormData()
      formData.set('id', action.id)
      formData.set('goal_id', action.goal_id)
      formData.set('title', rescueResult.minimal_variant.title)
      formData.set('type', action.type || 'core')
      formData.set('priority', action.priority || 'medium')
      formData.set('description', description)
      formData.set('start_date', action.start_date)
      formData.set('end_date', endDateStr)
      if (rescueRecommendationId) {
        formData.set('ai_recommendation_id', rescueRecommendationId)
      }
      await updateAction(formData)

      if (rescueRecommendationId) {
        setRescueOutcomeState('adopted')
        onRescueOutcomeStateChange('adopted')
        void fetch(`/api/ai/recommendations/${rescueRecommendationId}/adopt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optionSelected: '5m',
            actionId: action.id
          })
        }).catch(() => {})
      }

      logEvent('ai_rescue_apply', { mode: 'replace', option: '5m', action_id: action.id })
      sendAIFeedback('ai_rescue_apply', { mode: 'replace', option: '5m', action_id: action.id, goal_id: action.goal_id, reason: rescueReason })
      onPanelModeChange('view')
      onOpenChange(false)
      router.refresh()
    } catch {
      setRescueError(dict.common.errors.operation_failed)
    } finally {
      setRescueLoading(false)
    }
  }

  async function applyRescueAdd() {
    if (!rescueResult) return
    setRescueLoading(true)
    try {
      const endDateStr = action.end_date || action.start_date
      const description = [
        `First step: ${rescueResult.minimal_variant.first_step}`,
        `DoD: ${rescueResult.minimal_variant.definition_of_done}`,
        `If-Then: 如果${rescueResult.if_then.if} 那么${rescueResult.if_then.then}`
      ].join('\n')

      const formData = new FormData()
      formData.set('goal_id', action.goal_id)
      formData.set('title', rescueResult.minimal_variant.title)
      formData.set('type', 'maintenance')
      formData.set('priority', action.priority || 'medium')
      formData.set('description', description)
      formData.set('start_date', action.start_date)
      formData.set('end_date', endDateStr)
      if (rescueRecommendationId) {
        formData.set('ai_recommendation_id', rescueRecommendationId)
      }
      const created = await createActionAndReturnId(formData) as { actionId?: string | null }
      if (rescueRecommendationId) {
        setRescueOutcomeState('adopted')
        onRescueOutcomeStateChange('adopted')
        void fetch(`/api/ai/recommendations/${rescueRecommendationId}/adopt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optionSelected: '5m',
            actionId: created?.actionId || null
          })
        }).catch(() => {})
      }

      logEvent('ai_rescue_apply', { mode: 'add', option: '5m', action_id: action.id })
      sendAIFeedback('ai_rescue_apply', { mode: 'add', option: '5m', action_id: action.id, goal_id: action.goal_id, reason: rescueReason })
      onPanelModeChange('view')
      onOpenChange(false)
      router.refresh()
    } catch {
      setRescueError(dict.common.errors.operation_failed)
    } finally {
      setRescueLoading(false)
    }
  }

  const editFormFields = (
    <>
      <input type="hidden" name="id" value={action.id} />
      <input type="hidden" name="from_goal_id" value={action.goal_id} />
      <input type="hidden" name="repeat_rule" value={editRepeatRule} />
      <input
        type="hidden"
        name="sub_items"
        value={JSON.stringify(
          editSubItems
            .map((item, idx) => ({
              id: item.id,
              title: item.title.trim(),
              completed: item.completed,
              sort_order: idx
            }))
            .filter((item) => item.title.length > 0)
        )}
      />

      <div className="space-y-2">
        <Input
          name="title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          required
          className="bg-background/50 font-medium"
          placeholder={dict.today.actionTitlePlaceholder}
        />
      </div>

      <div className="space-y-2">
        {uploadUserId ? (
          <ActionDescriptionEditor
            userId={uploadUserId}
            value={editDescription}
            onChange={setEditDescription}
            attachments={editAttachmentsDraft}
            onAttachmentsChange={setEditAttachmentsDraft}
            onUploadingChange={setEditDescriptionUploading}
            dict={dict}
          />
        ) : (
          <div className="text-xs text-muted-foreground">{dict.common.loading}</div>
        )}
      </div>

      {goals.length > 0 ? (
        <div className="space-y-1">
          <Label htmlFor="goal_id" className="text-xs text-muted-foreground mb-1 block">
            {dict.today.goalLabel}
          </Label>
          <Select name="goal_id" value={editGoalId} onValueChange={setEditGoalId}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder={dict.today.goalLabel} />
            </SelectTrigger>
            <SelectContent>
              {goals.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <input type="hidden" name="goal_id" value={action.goal_id} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="type" className="text-xs text-muted-foreground mb-1 block">{dict.today.typeLabel}</Label>
          <Select name="type" value={editType} onValueChange={setEditType}>
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
        </div>
        <div className="space-y-1">
          <Label htmlFor="priority" className="text-xs text-muted-foreground mb-1 block">{dict.today.priorityLabel}</Label>
          <Select name="priority" value={editPriority} onValueChange={setEditPriority}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder={dict.today.priorityLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">{dict.goals.priority.high}</SelectItem>
              <SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
              <SelectItem value="low">{dict.goals.priority.low}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`repeat-rule-${action.id}`}>{todayText.repeatLabel || '重复规则'}</Label>
        <Select value={editRepeatRule} onValueChange={(value) => setEditRepeatRule(value as ActionRecurrenceRule)}>
          <SelectTrigger id={`repeat-rule-${action.id}`} className="w-full">
            <SelectValue placeholder={todayText.repeatLabel || '重复规则'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{todayText.repeatNone || '不重复'}</SelectItem>
            <SelectItem value="daily">{todayText.repeatDaily || '每天'}</SelectItem>
            <SelectItem value="weekly">{todayText.repeatWeekly || '每周'}</SelectItem>
            <SelectItem value="monthly">{todayText.repeatMonthly || '每月'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <DateRangeFields
          defaultStart={editStartDate}
          defaultEnd={editEndDate}
          valueStart={editStartDate}
          valueEnd={editEndDate}
          onChange={({ start, end }) => {
            setEditStartDate(start)
            setEditEndDate(end)
          }}
          labels={{ start: dict.today.startTime, end: dict.today.endTime, error: dict.common.dateRangeInvalid }}
          onValidityChange={setDateRangeValid}
          className="grid-cols-2"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            {todayText.subItemsLabel || '子行动'}
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAISplitForEdit}
              disabled={editAiLoading || !editTitle.trim() || !editGoalId}
            >
              {editAiLoading ? dict.common.loading : dict.goals.new.aiSplitButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditSubItems((prev) => [...prev, { title: '', completed: false }])}
            >
              {goalNewText.subItemsAdd || '新增子行动'}
            </Button>
          </div>
        </div>
        {editAiError ? <div className="text-xs text-destructive">{editAiError}</div> : null}
        {editSubItems.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            {goalNewText.subItemsEmptyHint || '可手动添加子行动'}
          </div>
        ) : (
          <div className="space-y-2">
            {editSubItems.map((item, idx) => (
              <div key={item.id || `draft-${idx}`} className="flex items-center gap-2">
                <button
                  type="button"
                  className="shrink-0"
                  onClick={() =>
                    setEditSubItems((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, completed: !x.completed } : x))
                    )
                  }
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <Input
                  value={item.title}
                  onChange={(e) =>
                    setEditSubItems((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x))
                    )
                  }
                  placeholder={`${goalNewText.subItemsPlaceholder || '子行动'} ${idx + 1}`}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditSubItems((prev) => prev.filter((_, i) => i !== idx))}>
                  {dict.common.delete || '删除'}
                </Button>
              </div>
            ))}
          </div>
        )}
        {editAiDrafts.length > 0 ? (
          <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">{dict.goals.new.aiSuggestionsTitle}</div>
              <Button type="button" variant="outline" size="sm" onClick={importAllEditAIDrafts}>
                {goalNewText.aiImportSubItems || '全部导入为子行动'}
              </Button>
            </div>
            <div className="space-y-2">
              {editAiDrafts.map((draft, idx) => (
                <button
                  key={`${draft.title}-${idx}`}
                  type="button"
                  onClick={() => applyEditAIDraft(draft)}
                  className="w-full rounded-md border border-border/60 bg-background/70 p-2 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="text-sm font-medium">{draft.title}</div>
                  {draft.description ? (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{draft.description}</div>
                  ) : null}
                  <div className="mt-1 text-[11px] text-primary">
                    {goalNewText.aiImportOneSubItem || '点击导入为子行动'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {editDescriptionUploading ? (
        <div className="text-xs text-muted-foreground">
          {goalNewText.wait_upload_complete || '图片上传中，请稍后提交。'}
        </div>
      ) : null}
    </>
  )

  const content =
    panelMode === 'edit' ? (
      <div className={cn('space-y-4 pb-4 sm:pb-6', isPanelFullscreen && 'pr-1')}>{editFormFields}</div>
    ) : panelMode === 'rescue' ? (
      <div className={cn('space-y-4', isPanelFullscreen && 'pr-1')}>
        {!goalTitle ? (
          <div className="text-sm text-muted-foreground">{dict.common.errors.operation_failed}</div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium">{locale === 'zh' ? '原因' : 'Reason'}</div>
              <Select
                value={rescueReason}
                onValueChange={(value) => setRescueReason(value as RescueOutput['reason_tag'])}
                disabled={rescueLoading}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder={locale === 'zh' ? '选择原因' : 'Select reason'} />
                </SelectTrigger>
                <SelectContent>
                  {rescueReasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={generateRescue} disabled={rescueLoading}>
                {rescueLoading && <LoadingSpinner size={16} className="mr-2 text-primary-foreground/80" />}
                {locale === 'zh' ? '生成 5 分钟版本' : 'Generate 5-min version'}
              </Button>
              {rescueError && <div className="text-sm text-destructive">{rescueError}</div>}
            </div>

            {rescueResult ? (
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="text-sm font-medium">{rescueResult.minimal_variant.title}</div>
                <div className="text-sm text-muted-foreground">
                  <div>{locale === 'zh' ? '第一步：' : 'First step: '}{rescueResult.minimal_variant.first_step}</div>
                  <div>{locale === 'zh' ? '完成定义：' : 'DoD: '}{rescueResult.minimal_variant.definition_of_done}</div>
                  <div>{locale === 'zh' ? 'If-Then：如果' : 'If-Then: if '}{rescueResult.if_then.if}{locale === 'zh' ? '那么' : ' then '}{rescueResult.if_then.then}</div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    ) : (
      <div className={cn('space-y-4', isPanelFullscreen && 'pr-1')}>
        {metaBadges}
        {copyActions}
        {aiPlanInsightCard}
        {viewDescription}
        <ActionSubItemsSection
          items={[...(action.action_sub_items || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))}
          label={todayText.subItemsLabel || '子行动'}
          completedCount={(action.action_sub_items || []).filter((item) => item.completed).length}
          onToggleItem={onToggleSubItem}
          busyId={subItemBusyId}
        />
      </div>
    )

  const footer =
    panelMode === 'edit' ? (
      <ModalActionFooter insetBottom={!isDesktop ? 'calc(env(safe-area-inset-bottom) + 1rem)' : undefined} className={!isDesktop ? 'px-4 md:px-4' : undefined}>
        <div className={isDesktop ? 'flex justify-end gap-2' : 'flex items-center gap-2'}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={!isDesktop ? 'flex-1' : undefined}
            onClick={() => requestExitEdit('switch_to_view')}
            disabled={isLoading}
          >
            {dict.common.cancel}
          </Button>
          <SubmitButton
            size="sm"
            className={!isDesktop ? 'flex-1' : undefined}
            disabled={isLoading || !dateRangeValid || editDescriptionUploading}
          >
            <Save className="mr-1 h-4 w-4" />
            {dict.common.save}
          </SubmitButton>
        </div>
      </ModalActionFooter>
    ) : panelMode === 'rescue' ? (
      rescueResult ? (
        <ModalActionFooter insetBottom={!isDesktop ? 'calc(env(safe-area-inset-bottom) + 1rem)' : undefined} className={!isDesktop ? 'px-4 md:px-4' : undefined}>
          <div className={isDesktop ? 'flex justify-end gap-2' : 'flex items-center justify-between gap-2'}>
            <Button type="button" variant="outline" size="sm" className={!isDesktop ? 'flex-1' : undefined} onClick={() => onPanelModeChange('view')} disabled={rescueLoading}>
              {dict.common.back || 'Back'}
            </Button>
            <Button type="button" variant="outline" size="sm" className={!isDesktop ? 'flex-1' : undefined} onClick={applyRescueAdd} disabled={rescueLoading}>
              {locale === 'zh' ? (isDesktop ? '新增最小行动' : '新增') : 'Add'}
            </Button>
            <Button type="button" size="sm" className={!isDesktop ? 'flex-1' : undefined} onClick={applyRescueReplace} disabled={rescueLoading}>
              {locale === 'zh' ? (isDesktop ? '替换当前行动' : '替换') : 'Replace'}
            </Button>
          </div>
        </ModalActionFooter>
      ) : null
    ) : (
      <ModalActionFooter insetBottom={!isDesktop ? 'calc(env(safe-area-inset-bottom) + 1rem)' : undefined} className={!isDesktop ? 'px-4 md:px-4' : undefined}>
        <div className={isDesktop ? 'flex justify-end gap-2' : 'flex items-center gap-2'}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              !isDesktop ? 'flex-1' : undefined,
              'border-destructive/30 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30'
            )}
            onClick={onRequestDelete}
          >
            {dict.common.delete}
          </Button>
          {action.type === 'core' && !action.completed && goalTitle ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={!isDesktop ? 'flex-1' : undefined}
              onClick={() => onPanelModeChange('rescue')}
              disabled={isLoading}
            >
              {rescueTitleText}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={!isDesktop ? 'flex-1' : undefined}
            onClick={() => {
              resetEditDraftFromAction()
              onPanelModeChange('edit')
            }}
            disabled={isLoading}
          >
            {dict.common.edit}
          </Button>
        </div>
      </ModalActionFooter>
    )

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={handlePanelOpenChange}>
          <DialogFormContent
            mobileMode={isPanelFullscreen ? 'fullscreen' : 'sheet'}
            hideCloseButton
            className={cn(
              DESKTOP_MODAL_SHELL_CLASS,
              isPanelFullscreen ? 'overflow-hidden p-0 sm:p-0' : 'max-w-lg overflow-hidden p-0 sm:p-0'
            )}
          >
            <div className={cn('flex min-h-0 flex-col', isPanelFullscreen ? 'h-full' : 'max-h-[85vh]')}>
              <DialogHeader className="px-4 pt-4 text-left sm:px-6 sm:pt-6">
                <div className="flex items-start justify-between gap-3">
                  <DialogTitle className="min-w-0 flex-1 text-left leading-snug">
                    {panelMode === 'edit' ? dict.common.edit : (panelMode === 'rescue' ? rescueTitleText : action.title)}
                  </DialogTitle>
                  <ModalHeaderActions
                    isFullscreen={isPanelFullscreen}
                    onToggleFullscreen={() => setIsPanelFullscreen((value) => !value)}
                    fullscreenLabel={dict.common.fullscreen}
                    exitFullscreenLabel={dict.common.exitFullscreen}
                    closeLabel={closeLabel}
                    renderCloseButton={(button) => <DialogClose asChild>{button}</DialogClose>}
                  />
                </div>
              </DialogHeader>
              {panelMode === 'edit' ? (
                <form action={handleUpdate} className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 sm:px-6">{content}</div>
                  {footer}
                </form>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 sm:px-6">{content}</div>
                  {footer}
                </>
              )}
            </div>
          </DialogFormContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={handlePanelOpenChange}>
          <SheetFormContent
            side="bottom"
            mobileMode={isPanelFullscreen ? 'fullscreen' : 'sheet'}
            className={cn(
              isPanelFullscreen
                ? 'overflow-hidden p-0'
                : panelMode === 'edit'
                  ? 'overflow-hidden p-0'
                  : 'max-h-[85vh] overflow-hidden rounded-t-2xl p-0'
            )}
          >
            <div className={cn('flex min-h-0 flex-col', isPanelFullscreen ? 'h-full' : 'max-h-[85vh]')}>
              <SheetHeader className="px-4 pt-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <SheetTitle className="block min-w-0 flex-1 text-left text-base leading-snug">
                    {panelMode === 'edit' ? dict.common.edit : (panelMode === 'rescue' ? rescueTitleText : action.title)}
                  </SheetTitle>
                  <ModalHeaderActions
                    isFullscreen={isPanelFullscreen}
                    onToggleFullscreen={() => setIsPanelFullscreen((value) => !value)}
                    fullscreenLabel={dict.common.fullscreen}
                    exitFullscreenLabel={dict.common.exitFullscreen}
                    closeLabel={closeLabel}
                    renderCloseButton={(button) => <SheetClose asChild>{button}</SheetClose>}
                  />
                </div>
              </SheetHeader>
              {panelMode === 'edit' ? (
                <form action={handleUpdate} className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">{content}</div>
                  {footer}
                </form>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">{content}</div>
                  {footer}
                </>
              )}
            </div>
          </SheetFormContent>
        </Sheet>
      )}

      <RichTextImagePreviewDialog
        open={Boolean(previewImageUrl)}
        imageUrl={previewImageUrl}
        title={dict.common.imagePreviewTitle}
        openOriginalLabel={dict.common.openOriginal}
        onOpenChange={(next) => {
          if (!next) setPreviewImageUrl(null)
        }}
      />

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{locale === 'zh' ? '放弃未保存修改？' : 'Discard unsaved changes?'}</AlertDialogTitle>
            <AlertDialogDescription>{unsavedConfirmText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{locale === 'zh' ? '继续编辑' : 'Keep editing'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDiscardAndProceed()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {locale === 'zh' ? '放弃修改' : 'Discard changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
