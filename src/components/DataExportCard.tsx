'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Dict } from '@/lib/goalCategories'

export function DataExportCard({ dict }: { dict: Dict }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = dict.profile.dataExport

  async function handleExport() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/export', { method: 'GET' })
      if (!res.ok) {
        setError(t.failed)
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      a.href = url
      a.download = match?.[1] ?? 'flowspark-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError(t.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>{t.desc}</div>
          {error ? <div className="text-xs text-destructive">{error}</div> : null}
        </div>
        <Button
          onClick={handleExport}
          disabled={loading}
          variant="outline"
          className="rounded-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? t.exporting : t.cta}
        </Button>
      </CardContent>
    </Card>
  )
}
