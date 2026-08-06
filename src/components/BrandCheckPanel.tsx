'use client'

import { useState } from 'react'
import type { Dictionary } from '@/i18n/types'

type BrandCheckHit = {
  persona_title: string
  verdict: 'aligned' | 'conflict' | 'off_tone'
  note: string
}

type BrandCheckData = {
  consistency_score: number
  hits: BrandCheckHit[]
  suggestion: string
  confidence?: 'low' | 'medium' | 'high'
}

const VERDICT_STYLE: Record<BrandCheckHit['verdict'], { label: string; cls: string }> = {
  aligned: { label: '一致', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  conflict: { label: '冲突', cls: 'bg-destructive/10 text-destructive' },
  off_tone: { label: '风格不符', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
}

export function BrandCheckPanel({ r }: { r: Dictionary['brandCheck'] }) {
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BrandCheckData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runCheck() {
    if (!draft.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/brand-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draft.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json?.data) throw new Error(json?.error || 'check_failed')
      setResult(json.data as BrandCheckData)
    } catch {
      setError(r.checkError)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor =
    result == null
      ? ''
      : result.consistency_score >= 75
        ? 'text-emerald-600 dark:text-emerald-400'
        : result.consistency_score >= 50
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-destructive'

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{r.subtitle}</p>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={r.placeholder}
        rows={5}
        className="w-full resize-y rounded-xl border border-border/50 bg-background/60 p-3 text-sm outline-none focus:border-primary/40"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={runCheck}
          disabled={loading || !draft.trim()}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? r.checking : r.runCheck}
        </button>
        {result && (
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setDraft('')
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {r.clear}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-4 border-t border-border/50 pt-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl font-semibold ${scoreColor}`}>{result.consistency_score}</div>
              <div className="text-xs text-muted-foreground">{r.scoreLabel}</div>
            </div>
            <p className="flex-1 text-sm text-muted-foreground">{result.suggestion}</p>
          </div>

          {result.hits.length > 0 && (
            <ul className="space-y-2">
              {result.hits.map((h, i) => (
                <li key={i} className="rounded-xl border border-border/50 bg-background/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${VERDICT_STYLE[h.verdict].cls}`}>
                      {VERDICT_STYLE[h.verdict].label}
                    </span>
                    <span className="text-sm font-medium">{h.persona_title}</span>
                  </div>
                  {h.note && <p className="mt-1.5 text-xs text-muted-foreground">{h.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
