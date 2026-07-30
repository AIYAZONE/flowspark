'use client'

import { useState, useTransition } from 'react'
import type { Dictionary } from '@/i18n/types'
import { archiveAction } from '@/app/(authenticated)/goals/actions'

type ReviewItemKind = 'archive' | 'reorder' | 'focus' | 'complete'

type ReviewItem = {
  goal_id: string | null
  action_id: string | null
  title: string
  action_kind: ReviewItemKind
  reason: string
}

type ReviewOutput = {
  summary_sentence: string
  detected_friction_tag: string | null
  tomorrow_card: {
    risk: string
    if_then: { if: string; then: string }
    suggested_core_action_direction: string
  }
  review_items?: ReviewItem[]
  confidence?: 'low' | 'medium' | 'high'
}

type ReviewApiResponse = { ok: boolean; data: ReviewOutput }

const KIND_LABEL_KEY: Record<ReviewItemKind, keyof Dictionary['review']> = {
  archive: 'kindArchive',
  reorder: 'kindReorder',
  focus: 'kindFocus',
  complete: 'kindComplete'
}

const KIND_STYLE: Record<ReviewItemKind, string> = {
  archive: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  reorder: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  focus: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  complete: 'bg-violet-500/10 text-violet-600 border-violet-500/20'
}

export function WeeklyReviewClient({
  dict,
  locale,
  today
}: {
  dict: Dictionary
  locale: 'en' | 'zh'
  today: string
}) {
  const r = dict.review
  const [score, setScore] = useState<number | null>(null)
  const [friction, setFriction] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [result, setResult] = useState<ReviewOutput | null>(null)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const [archivePending, setArchivePending] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [, startArchive] = useTransition()

  async function runReview() {
    setLoading(true)
    setError(false)
    setArchiveError(null)
    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          today,
          score,
          answers: { friction, note }
        })
      })
      const json = (await res.json()) as ReviewApiResponse
      if (!res.ok || !json.ok) throw new Error('bad_response')
      setResult(json.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  function handleArchive(item: ReviewItem) {
    if (!item.action_id) return
    const actionId = item.action_id
    setArchiveError(null)
    setArchivePending(actionId)
    startArchive(async () => {
      try {
        const fd = new FormData()
        fd.set('id', actionId)
        await archiveAction(fd)
        setArchivedIds((prev) => new Set(prev).add(actionId))
      } catch {
        setArchiveError(r.archiveError)
      } finally {
        setArchivePending(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{r.title}</h1>
        <p className="text-sm text-muted-foreground">{r.subtitle}</p>
      </header>

      {!result && (
        <section className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-medium">{r.scoreLabel}</p>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  className={`h-9 min-w-9 rounded-full border px-3 text-sm transition-colors ${
                    score === n
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {n}
                  <span className="ml-1 text-xs opacity-70">{r[(`score${n}`) as keyof Dictionary['review']]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="review-friction">
              {r.frictionLabel}
            </label>
            <textarea
              id="review-friction"
              value={friction}
              onChange={(e) => setFriction(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              placeholder="…"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="review-note">
              {r.noteLabel}
            </label>
            <textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              placeholder="…"
            />
          </div>

          <button
            type="button"
            onClick={runReview}
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? r.generating : r.startBtn}
          </button>

          {error && (
            <p className="text-sm text-destructive">
              {r.errorTitle} · <button className="underline" onClick={runReview}>{r.retry}</button>
            </p>
          )}
        </section>
      )}

      {result && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.summaryLabel}</p>
            <p className="mt-1 text-base">{result.summary_sentence}</p>
            {result.detected_friction_tag && (
              <span className="mt-3 inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                {r.frictionTag}：{result.detected_friction_tag}
              </span>
            )}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.tomorrowTitle}</p>
            <dl className="mt-2 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-muted-foreground">{r.riskLabel}</dt>
                <dd>{result.tomorrow_card.risk}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-muted-foreground">{r.ifLabel}</dt>
                <dd>{result.tomorrow_card.if_then.if}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-muted-foreground">{r.thenLabel}</dt>
                <dd>{result.tomorrow_card.if_then.then}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-muted-foreground">{r.directionLabel}</dt>
                <dd>{result.tomorrow_card.suggested_core_action_direction}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.actionItemsTitle}</p>
            {!result.review_items || result.review_items.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{r.actionItemsEmpty}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {result.review_items.map((item, i) => {
                  const target = item.goal_id ? `/goals/${item.goal_id}` : '/goals'
                  const isArchived = item.action_id ? archivedIds.has(item.action_id) : false
                  return (
                    <li key={i} className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-xs ${KIND_STYLE[item.action_kind]}`}>
                              {r[KIND_LABEL_KEY[item.action_kind]]}
                            </span>
                            <span className="truncate text-sm font-medium">{item.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.reason}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <a
                            href={target}
                            className="inline-flex h-8 items-center rounded-lg border border-border/60 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50"
                          >
                            {r.viewBtn}
                          </a>
                          {item.action_kind === 'archive' && item.action_id && (
                            <button
                              type="button"
                              disabled={isArchived || archivePending === item.action_id}
                              onClick={() => handleArchive(item)}
                              className="inline-flex h-8 items-center rounded-lg bg-amber-500/10 px-2.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-60"
                            >
                              {isArchived ? r.archived : archivePending === item.action_id ? r.archiving : r.archiveBtn}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {archiveError && <p className="mt-2 text-xs text-destructive">{archiveError}</p>}
          </section>

          <button
            type="button"
            onClick={() => {
              setResult(null)
              setArchivedIds(new Set())
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border/60 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            {r.regenerate}
          </button>
        </div>
      )}
    </div>
  )
}
