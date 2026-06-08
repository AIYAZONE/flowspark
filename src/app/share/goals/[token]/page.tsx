import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { Card, CardContent } from '@/components/ui/card'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import Link from 'next/link'
import { PublicGoalReadonlyView } from '@/components/PublicGoalReadonlyView'
import { getSiteUrl } from '@/lib/get-site-url'

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

function isShareExpired(expiresAt?: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now())
}

function toPlainText(input: string) {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(input: string, maxLength: number) {
  if (input.length <= maxLength) return input
  return `${input.slice(0, maxLength).trim()}...`
}

async function getPublicSharePayload(token: string) {
  const supabase = await createClient()
  const { data: share } = await supabase
    .from('goal_shares')
    .select('snapshot, goal_id, revoked_at, expires_at')
    .eq('token', token)
    .maybeSingle()

  const invalid = !share || Boolean(share.revoked_at) || isShareExpired(share.expires_at as string | null)

  return {
    supabase,
    share,
    invalid
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { token } = await params
  const { lang } = await searchParams
  const locale = normalizeLocale(lang)
  const dict = await getDictionary(locale)
  const { share, invalid } = await getPublicSharePayload(token)
  const siteUrl = getSiteUrl()
  const shareUrl = `${siteUrl}share/goals/${token}${locale ? `?lang=${locale}` : ''}`
  const imageUrl = `${siteUrl}icons/apple-touch-icon.png`

  if (invalid || !share) {
    return {
      title: dict.share.openTitle,
      description: dict.share.expired,
      alternates: { canonical: shareUrl },
      openGraph: {
        title: dict.share.openTitle,
        description: dict.share.expired,
        url: shareUrl,
        siteName: 'FlowSpark',
        type: 'website',
        images: [{ url: imageUrl }]
      },
      twitter: {
        card: 'summary',
        title: dict.share.openTitle,
        description: dict.share.expired,
        images: [imageUrl]
      }
    }
  }

  const snapshot = (share.snapshot || {}) as ShareSnapshot
  const goal = snapshot.goal
  const actions = snapshot.actions || []
  const entries = snapshot.entries || []
  const inspirationCount = entries.filter((entry) => entry.kind === 'inspiration').length
  const journeyCount = entries.filter((entry) => entry.kind === 'journey').length
  const summaryPrefix = `${actions.length} ${dict.goals.detail.actions} / ${inspirationCount} ${dict.goals.detail.tabInspiration} / ${journeyCount} ${dict.goals.detail.tabJourney}`
  const descriptionSource = toPlainText(goal.description || goal.success_criteria || dict.share.readonlyHint)
  const description = truncateText(`${summaryPrefix} · ${descriptionSource}`, 150)
  const title = `${goal.title} | ${dict.share.openTitle}`

  return {
    title,
    description,
    alternates: { canonical: shareUrl },
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: 'FlowSpark',
      type: 'website',
      images: [{ url: imageUrl }]
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl]
    }
  }
}

export default async function PublicGoalSharePage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { lang } = await searchParams
  const locale = normalizeLocale(lang)
  const dict = await getDictionary(locale)
  const currentLang = locale || 'en'
  const { supabase, share, invalid } = await getPublicSharePayload(token)

  if (invalid || !share) {
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
  const inspirationCount = entries.filter((entry) => entry.kind === 'inspiration').length
  const journeyCount = entries.filter((entry) => entry.kind === 'journey').length
  const statusLabelMap: Record<string, string> = {
    active: dict.goals.status.active,
    completed: dict.goals.status.completed,
    abandoned: dict.goals.status.abandoned,
    archived: dict.goals.status.archived
  }
  const typeLabelMap: Record<string, string> = {
    core: dict.today.types.core,
    maintenance: dict.today.types.maintenance,
    learning: dict.today.types.learning,
    review: dict.today.types.review,
    rest: dict.today.types.rest
  }
  const priorityLabelMap: Record<string, string> = {
    high: dict.goals.priority.high,
    medium: dict.goals.priority.medium,
    low: dict.goals.priority.low
  }
  const categoryLabelMap: Record<string, string> = {
    personal_brand: dict.goals.category.personal_brand,
    company_project: dict.goals.category.company_project,
    health: dict.goals.category.health,
    career: dict.goals.category.career,
    learning: dict.goals.category.learning,
    finance: dict.goals.category.finance,
    lifestyle: dict.goals.category.lifestyle,
    social: dict.goals.category.social,
    other: dict.goals.category.other,
    custom: dict.goals.category.custom
  }
  const goalStatusLabel = statusLabelMap[goal.status] || goal.status

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="rounded-3xl border border-border/50 bg-linear-to-br from-primary/8 via-background to-background p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
              FlowSpark
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{goal.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <GoalStatusBadge status={goal.status} label={goalStatusLabel} />
                <span>{goal.start_date} ~ {goal.end_date}</span>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{dict.share.readonlyHint}</p>
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
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
            <div className="text-xs text-muted-foreground">{dict.goals.detail.actions}</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">{actions.length}</div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
            <div className="text-xs text-muted-foreground">{dict.goals.detail.tabInspiration}</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">{inspirationCount}</div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
            <div className="text-xs text-muted-foreground">{dict.goals.detail.tabJourney}</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">{journeyCount}</div>
          </div>
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
