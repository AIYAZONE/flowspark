'use client'

import type en from '@/i18n/en.json'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, Loader2, Trash2 } from 'lucide-react'

import type { SystemNotificationRow } from '@/lib/notifications'
import { formatSystemNotificationCopy } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { deleteAllNotifications, deleteNotification, markAllNotificationsRead, markNotificationRead } from '@/app/(authenticated)/notifications/actions'
import { ProfileSubPageHeader } from '@/components/profile/ProfileSubPageHeader'
import { ConfirmDeleteNotificationDialog } from '@/components/ConfirmDeleteNotificationDialog'

type Dict = typeof en

export function NotificationsCenterClient(props: {
  dict: Dict
  tz: string
  initialNotifications: SystemNotificationRow[]
  initialUnread: number
}) {
  const { dict, tz, initialNotifications, initialUnread } = props
  const router = useRouter()
  const [items, setItems] = useState<SystemNotificationRow[]>(initialNotifications)
  const [unread, setUnread] = useState(initialUnread)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isMarkingAll, startMarkAll] = useTransition()
  const locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const isZh = locale === 'zh'
  const errors = dict.common.errors as unknown as Record<string, string>

  const formatted = useMemo(() => (
    items.map((item) => ({
      item,
      copy: formatSystemNotificationCopy(item, { locale }),
      createdText: new Intl.DateTimeFormat(dict.common.locale, {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(item.created_at)),
    }))
  ), [dict.common.locale, items, locale, tz])

  function applyRead(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item)))
    setUnread((prev) => Math.max(0, prev - 1))
  }

  async function handleMarkRead(id: string) {
    setErrorText(null)
    try {
      const formData = new FormData()
      formData.set('id', id)
      await markNotificationRead(formData)
      applyRead(id)
      router.refresh()
    } catch (err) {
      const key = err instanceof Error ? err.message : 'operation_failed'
      setErrorText(errors[key] || dict.common.errors.operation_failed)
    }
  }

  function handleMarkAll() {
    setErrorText(null)
    startMarkAll(() => {
      void (async () => {
        try {
          await markAllNotificationsRead()
          setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })))
          setUnread(0)
          router.refresh()
        } catch (err) {
          const key = err instanceof Error ? err.message : 'operation_failed'
          setErrorText(errors[key] || dict.common.errors.operation_failed)
        }
      })()
    })
  }

  function applyDelete(id: string) {
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id)
      if (removed && !removed.read_at) setUnread((u) => Math.max(0, u - 1))
      return prev.filter((item) => item.id !== id)
    })
  }

  async function handleDelete(id: string) {
    setErrorText(null)
    const snapshot = items
    applyDelete(id)
    try {
      const formData = new FormData()
      formData.set('id', id)
      await deleteNotification(formData)
      router.refresh()
    } catch (err) {
      setItems(snapshot)
      const key = err instanceof Error ? err.message : 'operation_failed'
      setErrorText(errors[key] || dict.common.errors.operation_failed)
    }
  }

  async function handleDeleteAll() {
    setErrorText(null)
    const snapshot = items
    setItems([])
    setUnread(0)
    try {
      await deleteAllNotifications()
      router.refresh()
    } catch (err) {
      setItems(snapshot)
      setUnread(initialUnread)
      const key = err instanceof Error ? err.message : 'operation_failed'
      setErrorText(errors[key] || dict.common.errors.operation_failed)
    }
  }

  return (
    <div className="space-y-4">
      <ProfileSubPageHeader
        title={isZh ? '系统通知' : 'Notifications'}
        description={unread > 0 ? (isZh ? `未读 ${unread} 条` : `${unread} unread`) : (isZh ? '没有未读通知' : 'All caught up')}
        backHref="/profile"
        backLabel={dict.common.back}
        breadcrumbs={[{ label: dict.profile.title, href: '/profile' }]}
        icon={<Bell className="h-4 w-4" />}
        rightSlot={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={handleMarkAll}
              disabled={isMarkingAll || unread === 0}
            >
              {isMarkingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              <span className="ml-2">{isZh ? '全部已读' : 'Mark all read'}</span>
            </Button>
            <ConfirmDeleteNotificationDialog
              dict={dict}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  disabled={items.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="ml-2">{isZh ? '清空全部' : 'Clear all'}</span>
                </Button>
              }
              title={isZh ? '清空全部通知' : 'Clear all notifications'}
              description={isZh ? '确定要清空全部通知吗？此操作不可撤销。' : 'Clear all notifications? This cannot be undone.'}
              onConfirm={handleDeleteAll}
            />
          </div>
        }
      />

      {errorText ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorText}
        </div>
      ) : null}

      <div className="space-y-2">
        {formatted.map(({ item, copy, createdText }) => {
          const isUnread = !item.read_at
          return (
            <div
              key={item.id}
              className={cn(
                'rounded-xl border bg-card/60 p-4 transition-colors',
                isUnread ? 'border-primary/20 hover:bg-primary/5' : 'border-border/60 hover:bg-muted/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    if (!isUnread) return
                    void handleMarkRead(item.id)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('text-sm font-medium', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
                      {copy.title}
                    </div>
                    {isUnread ? <span className="h-2 w-2 rounded-full bg-primary" /> : <Check className="h-3.5 w-3.5 text-muted-foreground/70" />}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{copy.body}</div>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-[10px] text-muted-foreground/70">{createdText}</span>
                  <ConfirmDeleteNotificationDialog
                    dict={dict}
                    trigger={
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={isZh ? '删除通知' : 'Delete notification'}
                        title={isZh ? '删除' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    }
                    title={isZh ? '删除通知' : 'Delete notification'}
                    description={isZh ? '确定要删除这条通知吗？此操作不可撤销。' : 'Delete this notification? This cannot be undone.'}
                    onConfirm={() => handleDelete(item.id)}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/30 p-8 text-center text-sm text-muted-foreground">
            {isZh ? '暂无系统通知' : 'No notifications yet'}
          </div>
        ) : null}
      </div>
    </div>
  )
}
