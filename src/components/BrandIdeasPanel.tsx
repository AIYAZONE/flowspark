'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Dictionary } from '@/i18n/types'
import type {
  ContentIdea,
  ContentIdeaStatus,
} from '@/lib/contentBrand'
import {
  saveContentIdea,
  removeContentIdea,
} from '@/app/(authenticated)/brand-studio/actions'
import { BrandImportDialog } from '@/components/BrandImportDialog'
import { BrandIdeaDetailDialog } from '@/components/BrandIdeaDetailDialog'

// 卡片内摘要用：单行/多行 markdown 渲染后截断，与详情弹窗风格统一。
function MarkdownLine({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {text}
    </ReactMarkdown>
  )
}

const STATUS_OPTIONS: ContentIdeaStatus[] = [
  'idea',
  'approved',
  'produced',
  'published',
  'archived',
]

export function BrandIdeasPanel({
  r,
  initialIdeas,
}: {
  r: Dictionary['contentIdeas']
  initialIdeas: ContentIdea[]
}) {
  const [ideas, setIdeas] = useState<ContentIdea[]>(initialIdeas)
  const [editing, setEditing] = useState<ContentIdea | null>(null)
  const [form, setForm] = useState({
    title: '',
    angle: '',
    hook: '',
    notes: '',
    status: 'idea' as ContentIdeaStatus,
  })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [viewing, setViewing] = useState<ContentIdea | null>(null)

  function openNew() {
    setEditing(null)
    setForm({ title: '', angle: '', hook: '', notes: '', status: 'idea' })
  }

  function openEdit(idea: ContentIdea) {
    setEditing(idea)
    setForm({
      title: idea.title,
      angle: idea.angle ?? '',
      hook: idea.hook ?? '',
      notes: idea.notes ?? '',
      status: idea.status,
    })
  }

  async function handleSave() {
    if (!form.title.trim() || saving) return
    setSaving(true)
    const res = await saveContentIdea({
      id: editing?.id,
      title: form.title.trim(),
      angle: form.angle.trim() || null,
      hook: form.hook.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
      persona_check_score: editing?.persona_check_score ?? null,
    })
    setSaving(false)
    if (res.ok) {
      const refreshed = await fetchIdeas()
      setIdeas(refreshed)
      openNew()
    }
  }

  async function handleDelete(id: string) {
    const res = await removeContentIdea(id)
    if (res.ok) setIdeas(await fetchIdeas())
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{r.title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setImporting(true)}
            className="inline-flex h-9 items-center rounded-lg border border-border/60 px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            {r.import}
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {r.addIdea}
          </button>
        </div>
      </div>

      {importing && (
        <BrandImportDialog
          r={r}
          onClose={() => setImporting(false)}
          onImported={async () => {
            setIdeas(await fetchIdeas())
            setImporting(false)
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {ideas.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">{r.empty}</p>
        )}
        {ideas.map((idea) => (
          <article
            key={idea.id}
            onClick={() => setViewing(idea)}
            className="cursor-pointer rounded-xl border border-border/50 bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-medium text-foreground">{idea.title}</h3>
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {r.statusLabels[idea.status]}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {idea.angle && <span className="rounded bg-muted px-1.5 py-0.5">{idea.angle}</span>}
              {idea.source && (
                <span className="rounded bg-muted px-1.5 py-0.5">{idea.source}</span>
              )}
            </div>
            {idea.notes && (
              <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                <MarkdownLine text={idea.notes} />
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {r.personaScore}：{idea.persona_check_score ?? '—'}
              </span>
              <span className="text-xs text-primary">{r.viewDetail}</span>
            </div>
          </article>
        ))}

      {viewing && (
        <BrandIdeaDetailDialog
          r={r}
          idea={viewing}
          onClose={() => setViewing(null)}
          onChanged={(next) => {
            setIdeas((prev) => prev.map((i) => (i.id === next.id ? next : i)))
            setViewing(next)
          }}
          onDeleted={(id) => {
            setIdeas((prev) => prev.filter((i) => i.id !== id))
            setViewing(null)
          }}
        />
      )}
      </div>

      <div className="space-y-3 border-t border-border/50 pt-4">
        <p className="text-sm font-medium text-foreground">
          {editing ? r.editing : r.addIdea}
        </p>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={r.titlePlaceholder}
          className="w-full rounded-xl border border-border/50 bg-background/60 p-3 text-sm outline-none focus:border-primary/40"
        />
        <input
          value={form.angle}
          onChange={(e) => setForm({ ...form, angle: e.target.value })}
          placeholder={r.anglePlaceholder}
          className="w-full rounded-xl border border-border/50 bg-background/60 p-3 text-sm outline-none focus:border-primary/40"
        />
        <input
          value={form.hook}
          onChange={(e) => setForm({ ...form, hook: e.target.value })}
          placeholder={r.hookPlaceholder}
          className="w-full rounded-xl border border-border/50 bg-background/60 p-3 text-sm outline-none focus:border-primary/40"
        />
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder={r.notesPlaceholder}
          rows={3}
          className="w-full resize-y rounded-xl border border-border/50 bg-background/60 p-3 text-sm outline-none focus:border-primary/40"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground">{r.status}</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as ContentIdeaStatus })
            }
            className="rounded-lg border border-border/50 bg-background/60 p-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {r.statusLabels[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
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

async function fetchIdeas(): Promise<ContentIdea[]> {
  const res = await fetch('/api/brand-studio/ideas', { cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  return (json?.data ?? []) as ContentIdea[]
}
