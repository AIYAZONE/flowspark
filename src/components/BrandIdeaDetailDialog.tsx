'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Dictionary } from '@/i18n/types'
import type { ContentIdea } from '@/lib/contentBrand'
import { saveContentIdea, removeContentIdea } from '@/app/(authenticated)/brand-studio/actions'

const STATUS_OPTIONS: ContentIdea['status'][] = [
  'idea',
  'approved',
  'produced',
  'published',
  'archived',
]

export function BrandIdeaDetailDialog({
  r,
  idea,
  onClose,
  onChanged,
  onDeleted,
}: {
  r: Dictionary['contentIdeas']
  idea: ContentIdea
  onClose: () => void
  onChanged: (next: ContentIdea) => void
  onDeleted: (id: string) => void
}) {
  const [status, setStatus] = useState<ContentIdea['status']>(idea.status)
  const [saving, setSaving] = useState(false)

  async function handleStatus(next: ContentIdea['status']) {
    setStatus(next)
    setSaving(true)
    const updated = await saveContentIdea({ id: idea.id, status: next })
    setSaving(false)
    if (updated) onChanged({ ...idea, status: next })
  }

  async function handleDelete() {
    if (!confirm(r.confirmDelete)) return
    const ok = await removeContentIdea(idea.id)
    if (ok.ok) onDeleted(idea.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/50 p-5">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{idea.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {idea.angle && <span className="rounded-md bg-muted px-2 py-0.5">{idea.angle}</span>}
              {idea.source && (
                <span className="rounded-md bg-muted px-2 py-0.5">{idea.source}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            {r.cancel}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="mb-3 mt-1 text-xl font-bold text-foreground">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-2 mt-4 text-lg font-semibold text-foreground">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-1 mt-3 text-base font-semibold text-foreground">{children}</h3>,
              p: ({ children }) => <p className="mb-2 leading-relaxed text-foreground/90">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 text-foreground/90">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 text-foreground/90">{children}</ol>,
              blockquote: ({ children }) => (
                <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="rounded bg-muted px-1 py-0.5 text-sm">{children}</code>
              ),
              table: ({ children }) => (
                <div className="my-3 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border/50 bg-muted px-2 py-1 text-left font-medium">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-border/50 px-2 py-1">{children}</td>
              ),
            }}
          >
            {idea.raw_markdown || idea.notes || ''}
          </ReactMarkdown>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/50 p-4">
          <select
            value={status}
            disabled={saving}
            onChange={(e) => handleStatus(e.target.value as ContentIdea['status'])}
            className="h-9 rounded-lg border border-border/60 bg-background px-2 text-sm text-foreground"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {r.statusLabels?.[s] ?? s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-9 items-center rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            {r.delete}
          </button>
        </div>
      </div>
    </div>
  )
}
