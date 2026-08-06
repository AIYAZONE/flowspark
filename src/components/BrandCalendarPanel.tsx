'use client'

import { useState } from 'react'
import type { Dictionary } from '@/i18n/types'
import type {
  ContentCalendarEntry,
  ContentIdea,
} from '@/lib/contentBrand'
import {
  saveCalendarEntry,
  removeCalendarEntry,
} from '@/app/(authenticated)/brand-studio/actions'

const CAL_STATUS: ContentCalendarEntry['status'][] = [
  'planned',
  'published',
  'skipped',
]
const CAL_STATUS_LABEL: Record<
  ContentCalendarEntry['status'],
  keyof Dictionary['contentCalendar']
> = {
  planned: 'statusPlanned',
  published: 'statusPublished',
  skipped: 'statusSkipped',
}

export function BrandCalendarPanel({
  r,
  initialCalendar,
  ideas,
}: {
  r: Dictionary['contentCalendar']
  initialCalendar: ContentCalendarEntry[]
  ideas: ContentIdea[]
}) {
  const [entries, setEntries] = useState<ContentCalendarEntry[]>(initialCalendar)
  const [editing, setEditing] = useState<ContentCalendarEntry | null>(null)
  const [form, setForm] = useState({
    planned_date: '',
    idea_id: '',
    status: 'planned' as ContentCalendarEntry['status'],
    note: '',
  })
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm({ planned_date: '', idea_id: '', status: 'planned', note: '' })
  }

  function openEdit(e: ContentCalendarEntry) {
    setEditing(e)
    setForm({
      planned_date: e.planned_date,
      idea_id: e.idea_id ?? '',
      status: e.status,
      note: e.note ?? '',
    })
  }

  async function handleSave() {
    if (!form.planned_date || saving) return
    setSaving(true)
    const res = await saveCalendarEntry({
      id: editing?.id,
      planned_date: form.planned_date,
      idea_id: form.idea_id || null,
      status: form.status,
      note: form.note.trim() || null,
    })
    setSaving(false)
    if (res.ok) {
      setEntries(await fetchCalendar())
      openNew()
    }
  }

  async function handleDelete(id: string) {
    const res = await removeCalendarEntry(id)
    if (res.ok) setEntries(await fetchCalendar())
  }

  const ideaTitle = (id: string | null) =>
    ideas.find((i) => i.id === id)?.title ?? r.ideaNone

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{r.title}</h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {r.addEntry}
        </button>
      </div>

      <ul className="space-y-2">
        {entries.length === 0 && (
          <li className="text-sm text-muted-foreground">{r.empty}</li>
        )}
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {e.planned_date} · {ideaTitle(e.idea_id)}
              </p>
              {e.note && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.note}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {r[CAL_STATUS_LABEL[e.status]]}
              </span>
              <button
                type="button"
                onClick={() => openEdit(e)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {r.edit}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                className="text-sm text-destructive hover:underline"
              >
                {r.delete}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-border/50 pt-4">
        <p className="text-sm font-medium text-foreground">{r.addEntry}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground">{r.dateLabel}</label>
          <input
            type="date"
            value={form.planned_date}
            onChange={(e) => setForm({ ...form, planned_date: e.target.value })}
            className="rounded-lg border border-border/50 bg-background/60 p-2 text-sm"
          />
          <label className="text-sm text-muted-foreground">{r.ideaLabel}</label>
          <select
            value={form.idea_id}
            onChange={(e) => setForm({ ...form, idea_id: e.target.value })}
            className="rounded-lg border border-border/50 bg-background/60 p-2 text-sm"
          >
            <option value="">{r.ideaNone}</option>
            {ideas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
          <label className="text-sm text-muted-foreground">{r.status}</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as ContentCalendarEntry['status'] })
            }
            className="rounded-lg border border-border/50 bg-background/60 p-2 text-sm"
          >
            {CAL_STATUS.map((s) => (
              <option key={s} value={s}>
                {r[CAL_STATUS_LABEL[s]]}
              </option>
            ))}
          </select>
        </div>
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder={r.notePlaceholder}
          className="w-full rounded-xl border border-border/50 bg-background/60 p-3 text-sm outline-none focus:border-primary/40"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.planned_date}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {r.save}
          </button>
          {editing && (
            <button
              type="button"
              onClick={openNew}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {r.cancel}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

async function fetchCalendar(): Promise<ContentCalendarEntry[]> {
  const res = await fetch('/api/brand-studio/calendar', { cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  return (json?.data ?? []) as ContentCalendarEntry[]
}
