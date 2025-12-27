'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AvatarUploader } from '@/components/AvatarUploader'
import { Pencil, Mail, Globe } from 'lucide-react'
import { DEFAULT_AVATAR_URL } from '@/lib/constants'

interface Dict {
  profile: {
    title: string
    email: string
    name: string
    timezone: string
    updateProfile: string
    avatar: string
  }
  common: {
    success: string
    error: string
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
  updateAction,
}: {
  dict: Dict
  userEmail: string
  userId: string
  initialName?: string | null
  initialTimezone?: string | null
  initialAvatarUrl?: string | null
  currentLocale: string
  updateAction: (formData: FormData) => Promise<{ ok?: boolean } | void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName || '')
  const [timezone, setTimezone] = useState(initialTimezone || 'UTC')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || '')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const router = useRouter()

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
      setSelectedFile(null)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed'
      setToast({ type: 'error', message: `${dict.common.error}: ${message}` })
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {toast && (
          <div className={`text-sm p-3 rounded-md border ${toast.type === 'success' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
            {toast.message}
          </div>
        )}
        {!editing && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-16 w-16 rounded-full ring-2 ring-border object-cover"
                  onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_URL }}
                />
              ) : (
                <div className="h-16 w-16 rounded-full ring-2 ring-border bg-muted" />
              )}
              <div className="space-y-1">
                <div className="text-lg font-semibold">{name || '-'}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{userEmail}</span>
                  <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{timezone || 'UTC'}</span>
                </div>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => setEditing(true)} className="gap-1">
              <Pencil className="h-4 w-4" />
              编辑
            </Button>
          </div>
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
            <div className="flex gap-2">
              <Button type="submit">{dict.profile.updateProfile}</Button>
              <Button type="button" variant="outline" onClick={() => { setEditing(false); setSelectedFile(null); setName(initialName || ''); setTimezone(initialTimezone || 'UTC') }}>取消</Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
