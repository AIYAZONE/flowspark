import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/get-dictionary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalStatusBadge } from '@/components/GoalStatusBadge'
import Link from 'next/link'

type ShareSnapshot = {
  goal: {
    title: string
    description: string
    start_date: string
    end_date: string
    success_criteria: string
    stop_criteria: string
    status: string
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
    .select('snapshot, revoked_at, expires_at')
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

  const snapshot = share.snapshot as ShareSnapshot
  const goal = snapshot.goal
  const actions = snapshot.actions || []
  const statusLabelMap = dict.goals.status as unknown as Record<string, string>
  const typeLabelMap = dict.today.types as unknown as Record<string, string>
  const priorityLabelMap = dict.goals.priority as unknown as Record<string, string>
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

      <Card>
        <CardHeader>
          <CardTitle>{dict.goals.detail.description}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
          {goal.description || dict.common.noDescription}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.goals.detail.actions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.length === 0 ? (
            <div className="text-sm text-muted-foreground">{dict.share.emptyActions}</div>
          ) : (
            actions.map((a) => (
              <div key={a.id} className="rounded-md border border-border/50 bg-muted/20 p-3">
                <div className="text-sm font-medium">{a.title}</div>
                {a.description ? <div className="mt-1 text-xs text-muted-foreground">{a.description}</div> : null}
                <div className="mt-2 text-xs text-muted-foreground">
                  {a.completed ? dict.goals.filter.completed : dict.goals.filter.incomplete} · {typeLabelMap[a.type] || a.type} · {priorityLabelMap[a.priority] || a.priority}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
