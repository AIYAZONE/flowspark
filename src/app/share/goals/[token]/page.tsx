import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { Card, CardContent } from '@/components/ui/card'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import Link from 'next/link'
import { PublicGoalReadonlyView } from '@/components/PublicGoalReadonlyView'

type ShareSnapshot = {
  goal: {
    id?: string
    title: string
    description: string
    start_date: string
    end_date: string
    success_criteria: string
    stop_criteria: string
    status: string
    priority?: string | null
    category?: string | null
  }
  actions: Array<{
    id: string
    title: string
    description?: string | null
    completed: boolean
    priority: string
    type: string
    start_date: string
    end_date?: string | null
  }>
  entries?: Array<{
    id: string
    kind: 'inspiration' | 'journey'
    status: 'open' | 'archived'
    content: string
    note?: string | null
    created_at: string
  }>
}

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ lang?: string }>
}

function normalizeLocale(lang?: string): 'zh' | 'en' | undefined {
  if (!lang) return undefined
  const normalized = lang.toLowerCase()
  if (normalized === 'zh' || normalized === 'en') return normalized
  return undefined
}

export default async function PublicGoalSharePage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { lang } = await searchParams
  const locale = normalizeLocale(lang)
  const supabase = await createClient()
  const dict = await getDictionary(locale)
  const currentLang = locale || 'en'

  const { data: share } = await supabase
    .from('goal_shares')
    .select('snapshot, goal_id, revoked_at, expires_at')
    .eq('token', token)
    .maybeSingle()

  const invalid = !share || !!share.revoked_at

  if (invalid) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{dict.share.expired}</CardContent>
        </Card>
      </div>
    )
  }

  const snapshotRaw = (share.snapshot || {}) as Record<string, unknown>
  const snapshot = snapshotRaw as ShareSnapshot
  const goal = snapshot.goal
  const actions = snapshot.actions || []
  const rawEntries =
    (snapshot.entries as ShareSnapshot['entries']) ||
    (snapshotRaw.goal_entries as ShareSnapshot['entries']) ||
    (snapshotRaw.inspirations as ShareSnapshot['entries']) ||
    []

  let entries: NonNullable<ShareSnapshot['entries']> = rawEntries || []
  if (!entries.length && share.goal_id) {
    const { data: fallbackEntries } = await supabase
      .from('goal_entries')
      .select('id, kind, status, content, note, created_at')
      .eq('goal_id', share.goal_id)
      .in('kind', ['inspiration', 'journey'])
      .in('status', ['open', 'archived'])
      .order('created_at', { ascending: false })
    entries = (fallbackEntries || []) as NonNullable<ShareSnapshot['entries']>
  }
  const statusLabelMap = dict.goals.status as unknown as Record<string, string>
  const typeLabelMap = dict.today.types as unknown as Record<string, string>
  const rawPriorityLabelMap = dict.goals.priority as unknown as Record<string, string>
  const priorityLabelMap = Object.fromEntries(
    Object.entries(rawPriorityLabelMap).filter(([key]) =>
      key === 'high' || key === 'medium' || key === 'low'
    )
  ) as Record<string, string>
  const categoryLabelMap = dict.goals.category as unknown as Record<string, string>
  const goalStatusLabel = statusLabelMap[goal.status] || goal.status

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{goal.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GoalStatusBadge status={goal.status} label={goalStatusLabel} />
          <span>{goal.start_date} ~ {goal.end_date}</span>
        </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-md border border-border/60 p-1 text-xs">
          <Link
            href={`/share/goals/${token}?lang=zh`}
            className={currentLang === 'zh' ? 'rounded-sm bg-primary px-2 py-1 text-primary-foreground' : 'rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground'}
          >
            中文
          </Link>
          <Link
            href={`/share/goals/${token}?lang=en`}
            className={currentLang === 'en' ? 'rounded-sm bg-primary px-2 py-1 text-primary-foreground' : 'rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground'}
          >
            EN
          </Link>
        </div>
      </div>

      <PublicGoalReadonlyView
        goal={{
          title: goal.title || '',
          description: goal.description || '',
          start_date: goal.start_date || '',
          end_date: goal.end_date || '',
          status: goal.status || 'active',
          priority: goal.priority || null,
          category: goal.category || null,
          success_criteria: goal.success_criteria || '',
          stop_criteria: goal.stop_criteria || ''
        }}
        actions={actions}
        entries={entries}
        labels={{
          actions: dict.goals.detail.actions,
          inspiration: dict.goals.detail.tabInspiration,
          journey: dict.goals.detail.tabJourney,
          details: dict.goals.detail.details,
          timeline: dict.goals.detail.timeline,
          description: dict.goals.detail.description,
          startDate: dict.goals.detail.startDate,
          endDate: dict.goals.detail.endDate,
          status: dict.goals.status.label,
          priority: dict.goals.priority.label,
          category: dict.goals.category.label,
          successCriteria: dict.goals.detail.successCriteria,
          stopCriteria: dict.goals.detail.abandonCriteria,
          emptyActions: dict.share.emptyActions,
          emptyInspiration: dict.goals.detail.emptyInspiration,
          emptyJourney: dict.goals.detail.emptyJourney,
          completed: dict.goals.filter.completed,
          incomplete: dict.goals.filter.incomplete,
          allStatus: dict.goals.filter.allStatus,
          allType: dict.goals.filter.allType,
          allPriority: dict.goals.filter.allPriority,
          searchActionsPlaceholder: dict.goals.filter.searchActionsPlaceholder,
          entryOpen: dict.goals.status.active,
          entryArchived: dict.goals.status.archived
        }}
        typeLabelMap={typeLabelMap}
        priorityLabelMap={priorityLabelMap}
        statusLabelMap={statusLabelMap}
        categoryLabelMap={categoryLabelMap}
      />
    </div>
  )
}
