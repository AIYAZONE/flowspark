'use client'

import { useEffect, useState } from 'react'
import { Calendar, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createUserCalendarFeed, refreshUserCalendarFeed, revokeUserCalendarFeed } from '@/app/(authenticated)/profile/actions'
import type en from '@/i18n/en.json'
import { format } from 'date-fns'

export function UserCalendarFeedCard({
  dict,
  initialToken,
  initialExpiresAt,
}: {
  dict: typeof en
  initialToken: string | null
  initialExpiresAt: string | null
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [token, setToken] = useState<string | null>(initialToken)
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !token) return
    let active = true
    void (async () => {
      setSyncing(true)
      try {
        const refreshed = await refreshUserCalendarFeed()
        if (!active) return
        setToken(refreshed.token)
        setExpiresAt(refreshed.expiresAt)
      } catch (error) {
        console.error(error)
      } finally {
        if (active) setSyncing(false)
      }
    })()
    return () => {
      active = false
    }
  }, [open, token])

  const calendarUrl =
    token && typeof window !== 'undefined'
      ? `${window.location.origin}/api/calendar/feeds/${token}`
      : ''

  async function handleCreate() {
    setLoading(true)
    try {
      const result = await createUserCalendarFeed()
      setToken(result.token)
      setExpiresAt(result.expiresAt)
      setCopied(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke() {
    setLoading(true)
    try {
      await revokeUserCalendarFeed()
      setToken(null)
      setExpiresAt(null)
      setCopied(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!calendarUrl) return
    try {
      await navigator.clipboard.writeText(calendarUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{dict.share.calendarSubscriptionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">{dict.share.calendarFeedHint}</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <Calendar className="h-4 w-4 mr-1" />
              {dict.share.subscribeCalendar}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dict.share.subscribeCalendar}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {syncing ? (
                <div className="text-xs text-muted-foreground">{dict.common.loading}</div>
              ) : null}
              {token && calendarUrl ? (
                <div className="space-y-2 rounded-md border border-border/50 bg-muted/20 p-3">
                  <div className="break-all text-xs text-foreground/80">{calendarUrl}</div>
                  <div className="text-xs text-muted-foreground">
                    {expiresAt ? `${dict.share.expiresLabel || 'Expires'}: ${format(new Date(expiresAt), 'yyyy-MM-dd')}` : ''}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center justify-end gap-2">
                {token ? (
                  <>
                    <Button type="button" variant="outline" onClick={handleCopy} disabled={loading}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? dict.share.copied : dict.share.copySubscribeLink}
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleRevoke} disabled={loading}>
                      {loading ? <LoadingSpinner size={14} className="mr-1 text-current" /> : null}
                      {dict.share.revokeCalendarFeed}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={handleCreate} disabled={loading}>
                    {loading ? <LoadingSpinner size={14} className="mr-1 text-current" /> : null}
                    {dict.share.subscribeCalendar}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

