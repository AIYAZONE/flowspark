'use client'

import { useRef, useState } from 'react'
import type { Dictionary } from '@/i18n/types'
import type { ParsedIdeaDraft } from '@/lib/parseTraeMarkdown'
import { parseTraeZip, TRAE_SOURCE } from '@/lib/parseTraeMarkdown'
import { importContentIdeas } from '@/app/(authenticated)/brand-studio/actions'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function BrandImportDialog({
  r,
  onClose,
  onImported,
}: {
  r: Dictionary['contentIdeas']
  onClose: () => void
  onImported: (count: number) => void
}) {
  const [drafts, setDrafts] = useState<ParsedIdeaDraft[]>([])
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setError(null)
    setDone(null)
    setDrafts([])
    try {
      const parsed = await parseTraeZip(file)
      setDrafts(parsed)
      if (parsed.length === 0) setError(r.importNone)
    } catch {
      setError(r.importNone)
    } finally {
      setParsing(false)
    }
  }

  async function handleConfirm() {
    setImporting(true)
    const res = await importContentIdeas(drafts)
    setImporting(false)
    if (res.ok) {
      setDone(res.imported)
      onImported(res.imported)
    } else {
      setError(r.empty)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {r.importDialogTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {r.cancel}
          </button>
        </div>

        <label className="block cursor-pointer rounded-xl border border-dashed border-border/60 bg-background/60 p-5 text-center text-sm text-muted-foreground hover:border-primary/40">
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFile}
          />
          {r.importPickZip}
          <span className="mt-1 block text-xs">{r.importPickZipHint}</span>
        </label>

        {parsing && <p className="text-sm text-muted-foreground">{r.importParsing}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {done !== null && (
          <p className="text-sm text-primary">
            {r.importDone.replace('{count}', String(done))}
          </p>
        )}

        {drafts.length > 0 && done === null && (
          <>
            <p className="text-sm text-muted-foreground">
              {r.importFound.replace('{count}', String(drafts.length))}
            </p>
            <ul className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-border/50 bg-background/60 p-2 text-sm">
              {drafts.map((d, i) => (
                <li key={i} className="flex items-center justify-between gap-2 px-1 py-1">
                  <span className="min-w-0 truncate text-foreground">{d.title}</span>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {d.angle ?? TRAE_SOURCE}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={importing}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? (
                <>
                  <LoadingSpinner size={16} className="text-primary-foreground" />
                  {r.importing}
                </>
              ) : (
                r.importConfirm.replace('{count}', String(drafts.length))
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
