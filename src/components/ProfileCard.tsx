'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AvatarUploader } from '@/components/AvatarUploader'
import { Pencil, Mail, Globe, CalendarDays } from 'lucide-react'

interface Dict {
  profile: {
    title: string
    email: string
    name: string
    timezone: string
    updateProfile: string
    avatar: string
    uploadOrChange: string
    uploadHint: string
    uploadErrorSize: string
    uploadErrorType: string
    dangerZone: string
    deleteAccount: string
    deleteAccountDesc: string
    confirmDeleteTitle: string
    confirmDeleteDesc: string
    deleteConfirmLabelPrefix: string
    deleteConfirmLabelSuffix: string
    deletePlaceholder: string
    deleting: string
    deleteError: string
    joined: string
    stats?: {
      lastSignIn: string
      unknown: string
    }
  }
  common: {
    success: string
    error: string
    edit: string
    cancel: string
  }
}

export function ProfileCard({
  dict,
  userEmail,
  userId,
  initialName,
  initialTimezone,
  initialAvatarUrl,
  currentLocale,
  createdAt,
  lastSignIn,
  updateAction,
}: {
  dict: Dict
  userEmail: string
  userId: string
  initialName?: string | null
  initialTimezone?: string | null
  initialAvatarUrl?: string | null
  currentLocale: string
  createdAt?: string | null
  lastSignIn?: string | null
  updateAction: (formData: FormData) => Promise<{ ok?: boolean } | void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName || '')
  const [timezone, setTimezone] = useState(initialTimezone || 'UTC')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || '')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return dict.profile.stats?.unknown ?? '未知'
    try {
      const locale = currentLocale === 'en' ? 'en-US' : 'zh-CN'
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dict.profile.stats?.unknown ?? '未知'
    }
  }

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    // 已在组件初始化时通过 useState 设置 avatarUrl，无需在 effect 中同步
  }, [initialAvatarUrl])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdating(true)
    const fd = new FormData()
    fd.set('name', name)
    fd.set('timezone', timezone)
    fd.set('locale', currentLocale)
    if (pendingAvatarUrl) {
      fd.set('avatar_url', pendingAvatarUrl)
    }
    try {
      const res = await updateAction(fd)
      setToast({ type: 'success', message: dict.common.success })
      setEditing(false)
      if (pendingAvatarUrl) {
        setAvatarUrl(pendingAvatarUrl)
      }
      setPendingAvatarUrl(null)
      setSelectedFile(null)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed'
      setToast({ type: 'error', message: `${dict.common.error}: ${message}` })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-8 pt-8">
        {toast && (
          <div className={`text-sm p-3 rounded-md border ${toast.type === 'success' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
            {toast.message}
          </div>
        )}
        {!editing && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-6">
                {avatarUrl ? (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt="avatar"
                    className="h-16 w-16 md:h-24 md:w-24 rounded-full ring-4 ring-background shadow-sm object-cover"
                    onError={() => { setAvatarUrl('') }}
                  />
                ) : (
                  <div className="inline-flex items-center justify-center h-16 w-16 md:h-24 md:w-24 rounded-full bg-primary/10 text-primary ring-4 ring-background shadow-sm text-2xl md:text-4xl font-bold">
                    {(userEmail?.[0] || '-').toUpperCase()}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-2xl md:text-3xl font-bold tracking-tight">{name || userEmail?.split('@')[0] || '-'}</div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    在线
                  </div>
                </div>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(true)} className="rounded-full">
                <Pencil className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            <div className="h-px bg-border/50" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {dict.profile.email}
                </span>
                <span className="font-medium truncate pl-6">{userEmail}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" /> {dict.profile.timezone}
                </span>
                <span className="font-medium truncate pl-6">{timezone || 'UTC'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> {dict.profile.joined}
                </span>
                <span className="font-medium truncate pl-6">{formatDate(createdAt)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> {dict.profile.stats?.lastSignIn ?? '最近登录'}
                </span>
                <span className="font-medium truncate pl-6">{formatDate(lastSignIn)}</span>
              </div>
            </div>
          </>
        )}
        {editing ? (
          <form onSubmit={onSubmit} className="grid gap-4 mt-2">
            <AvatarUploader
              userId={userId}
              currentUrl={avatarUrl || undefined}
              dict={dict}
              onChange={(file) => { setSelectedFile(file) }}
              onChangeUrl={(url) => setPendingAvatarUrl(url)}
            />
            <div className="grid gap-2">
              <Label htmlFor="name">{dict.profile.name}</Label>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">{dict.profile.timezone}</Label>
              <select
                id="timezone"
                name="timezone"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button type="button" variant="outline" onClick={() => { setEditing(false); setSelectedFile(null); setName(initialName || ''); setTimezone(initialTimezone || 'UTC') }} disabled={isUpdating}>{dict.common.cancel}</Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <LoadingSpinner size={16} className="mr-2" />}
                {dict.profile.updateProfile}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
