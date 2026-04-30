'use client'

import { useMemo, useState } from 'react'
import type en from '@/i18n/en.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, History, Trash2, Rocket } from 'lucide-react'
import { createActionFromPotential, deletePotentialSession, getPotentialSession } from '@/app/(authenticated)/potential/actions'

type Dict = typeof en

type PotentialResult = {
  summary: string
  strengths: string[]
  risks: string[]
  opportunities?: string[]
  execution_style?: string
  next_7_days?: Array<{ day: string; focus: string }>
  actions: Array<{
    title: string
    reason: string
  }>
}

type PotentialResultLoose = {
  summary?: string
  strengths?: string[]
  risks?: string[]
  opportunities?: string[]
  execution_style?: string
  next_7_days?: Array<{ day: string; focus: string }>
  actions?: Array<{
    title: string
    reason: string
  }>
}

type PotentialSession = {
  id: string
  profile_input: string
  goal_input: string
  result_json: PotentialResultLoose
  created_actions_json: Array<{ actionId: string; title: string; goalId: string; createdAt: string }>
  created_at: string
}

function normalizeResult(input: PotentialResultLoose | null | undefined): PotentialResult {
  return {
    summary: typeof input?.summary === 'string' ? input.summary : '',
    strengths: Array.isArray(input?.strengths) ? input.strengths : [],
    risks: Array.isArray(input?.risks) ? input.risks : [],
    opportunities: Array.isArray(input?.opportunities) ? input.opportunities : [],
    execution_style: typeof input?.execution_style === 'string' ? input.execution_style : '',
    next_7_days: Array.isArray(input?.next_7_days) ? input.next_7_days : [],
    actions: Array.isArray(input?.actions) ? input.actions : []
  }
}

export function PotentialDiscoveryCard({
  dict,
  goals,
  initialSessions
}: {
  dict: Dict
  goals: Array<{ id: string; title: string }>
  initialSessions: Array<Record<string, unknown>>
}) {
  const [profile, setProfile] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [creatingTitle, setCreatingTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PotentialResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<PotentialSession[]>(
    (initialSessions || []) as PotentialSession[]
  )

  const createdTitleSet = useMemo(() => {
    if (!sessionId) return new Set<string>()
    const current = sessions.find((s) => s.id === sessionId)
    const created = current?.created_actions_json || []
    return new Set(created.map((x) => x.title))
  }, [sessions, sessionId])

  async function generate() {
    setError(null)
    setResult(null)
    if (!profile.trim() || !goal.trim()) {
      setError(dict.common.errors.missing_fields)
      return
    }

    const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
    setLoading(true)
    try {
      const res = await fetch('/api/ai/potential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profile.trim(), goal: goal.trim(), locale })
      })
      const json = (await res.json()) as { sessionId?: string; result?: PotentialResult; error?: string }
      if (!res.ok || !json.result) {
        const key = json.error || 'operation_failed'
        const errors = dict.common.errors as unknown as Record<string, string>
        setError(errors[key] || dict.common.errors.operation_failed)
        return
      }
      const nextSessionId = json.sessionId || null
      setSessionId(nextSessionId)
      setResult(json.result)
      if (nextSessionId) {
        const nextItem: PotentialSession = {
          id: nextSessionId,
          profile_input: profile.trim(),
          goal_input: goal.trim(),
          result_json: json.result,
          created_actions_json: [],
          created_at: new Date().toISOString()
        }
        setSessions((prev) => [nextItem, ...prev.filter((x) => x.id !== nextSessionId)].slice(0, 20))
      }
    } catch {
      setError(dict.common.errors.operation_failed)
    } finally {
      setLoading(false)
    }
  }

  async function createNow(action: { title: string; reason: string }) {
    if (!sessionId || !selectedGoalId) {
      setError(dict.common.errors.missing_fields)
      return
    }
    setError(null)
    setCreatingTitle(action.title)
    try {
      const created = await createActionFromPotential({
        sessionId,
        goalId: selectedGoalId,
        action
      })
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
              ...s,
              created_actions_json: [
                ...(Array.isArray(s.created_actions_json) ? s.created_actions_json : []),
                {
                  actionId: created.actionId,
                  title: created.title,
                  goalId: selectedGoalId,
                  createdAt: new Date().toISOString()
                }
              ]
            }
            : s
        )
      )
    } catch (e) {
      const key = e instanceof Error ? e.message : 'operation_failed'
      const errors = dict.common.errors as unknown as Record<string, string>
      setError(errors[key] || dict.common.errors.operation_failed)
    } finally {
      setCreatingTitle(null)
    }
  }

  async function reuseSession(id: string) {
    try {
      const data = await getPotentialSession(id)
      if (!data) return
      setProfile(data.profile_input || '')
      setGoal(data.goal_input || '')
      setResult(normalizeResult(data.result_json))
      setSessionId(data.id)
      setSessions((prev) => [data, ...prev.filter((x) => x.id !== data.id)])
    } catch {
      setError(dict.common.errors.operation_failed)
    }
  }

  async function removeSession(id: string) {
    try {
      await deletePotentialSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (sessionId === id) {
        setSessionId(null)
        setResult(null)
      }
    } catch {
      setError(dict.common.errors.operation_failed)
    }
  }

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-20 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {dict.potential.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{dict.potential.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{dict.potential.targetLabel}</Label>
          <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
            <SelectTrigger>
              <SelectValue placeholder={dict.potential.targetPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {goals.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="potential-profile">{dict.potential.profileLabel}</Label>
          <Textarea
            id="potential-profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder={dict.potential.profilePlaceholder}
            rows={5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="potential-goal">{dict.potential.goalLabel}</Label>
          <Textarea
            id="potential-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={dict.potential.goalPlaceholder}
            rows={3}
          />
        </div>
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <Button type="button" onClick={generate} disabled={loading}>
          {loading ? dict.potential.loading : dict.potential.generate}
        </Button>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {result ? (
            <div className="space-y-4 rounded-lg border border-primary/30 bg-background/50 p-4 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
              <div>
                <div className="text-sm font-medium">{dict.potential.resultTitle}</div>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium">{dict.potential.strengthsTitle}</div>
                  <ul className="mt-1 text-sm text-muted-foreground list-disc pl-5">
                    {result.strengths.map((s, idx) => (
                      <li key={`${s}-${idx}`}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium">{dict.potential.risksTitle}</div>
                  <ul className="mt-1 text-sm text-muted-foreground list-disc pl-5">
                    {result.risks.map((r, idx) => (
                      <li key={`${r}-${idx}`}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {Array.isArray(result.opportunities) && result.opportunities.length > 0 ? (
                <div>
                  <div className="text-sm font-medium">{dict.potential.opportunitiesTitle}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.opportunities.map((o, idx) => (
                      <span key={`${o}-${idx}`} className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {result.execution_style ? (
                <div className="rounded-md border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{dict.potential.executionStyleTitle}：</span>
                  {result.execution_style}
                </div>
              ) : null}
              {Array.isArray(result.next_7_days) && result.next_7_days.length > 0 ? (
                <div>
                  <div className="text-sm font-medium">{dict.potential.next7DaysTitle}</div>
                  <div className="mt-2 space-y-2">
                    {result.next_7_days.map((x, idx) => (
                      <div key={`${x.day}-${idx}`} className="rounded-md border border-border/50 bg-muted/20 p-2 text-sm">
                        <div className="font-medium">{x.day}</div>
                        <div className="text-xs text-muted-foreground">{x.focus}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <div className="text-sm font-medium">{dict.potential.suggestionsTitle}</div>
                <div className="mt-2 space-y-2">
                  {result.actions.map((a, idx) => {
                    const created = createdTitleSet.has(a.title)
                    const creating = creatingTitle === a.title
                    return (
                      <button
                        key={`${a.title}-${idx}`}
                        type="button"
                        className="w-full rounded-md border border-primary/30 bg-background/60 p-2 text-left transition hover:border-primary/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.10)]"
                        onClick={() => createNow(a)}
                        disabled={creating || created}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium">{a.title}</div>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${created ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border/60 bg-muted/30 text-muted-foreground'}`}>
                            {created ? dict.potential.created : creating ? dict.potential.creating : dict.potential.createNow}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{a.reason}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              {dict.potential.emptyResultHint}
            </div>
          )}

          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" />
              {dict.potential.historyTitle}
            </div>
            {sessions.length === 0 ? (
              <div className="text-xs text-muted-foreground">{dict.potential.emptyHistory}</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="rounded-md border border-border/50 bg-background/70 p-2">
                    <div className="line-clamp-1 text-xs text-muted-foreground">{s.goal_input}</div>
                    <div className="mt-1 line-clamp-2 text-sm">{s.result_json?.summary || '-'}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => reuseSession(s.id)}>
                        <Rocket className="mr-1 h-3 w-3" />
                        {dict.potential.reuse}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => removeSession(s.id)}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        {dict.potential.deleteSession}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
