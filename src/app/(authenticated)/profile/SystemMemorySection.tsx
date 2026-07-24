'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  getSystemMemoryPreferenceProfile,
  type SystemMemoryLocale,
  type SystemMemoryPreference,
  type SystemMemoryPreferenceKey,
} from '@/lib/system-memory/preferences'

type Props = {
  initialPreferences: SystemMemoryPreference[]
  locale: SystemMemoryLocale
}

export function SystemMemorySection({ initialPreferences, locale }: Props) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const profile = useMemo(() => getSystemMemoryPreferenceProfile(preferences), [preferences])

  async function togglePreference(key: SystemMemoryPreferenceKey, enabled: boolean) {
    setPendingKey(key)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/system-memory/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      })
      if (!res.ok) throw new Error('operation_failed')

      setPreferences((current) =>
        current.map((item) => (item.key === key ? { ...item, enabled } : item))
      )
    } catch {
      setErrorMessage(locale === 'zh' ? '系统记忆更新失败，请稍后再试。' : 'Failed to update system memory.')
    } finally {
      setPendingKey(null)
    }
  }

  async function deletePreference(key: SystemMemoryPreferenceKey) {
    setPendingKey(key)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/system-memory/preferences', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) throw new Error('operation_failed')

      setPreferences((current) => current.filter((item) => item.key !== key))
    } catch {
      setErrorMessage(locale === 'zh' ? '系统记忆删除失败，请稍后再试。' : 'Failed to delete system memory.')
    } finally {
      setPendingKey(null)
    }
  }

  const summary = locale === 'zh'
    ? [
        profile.preferShortReply ? '短回复已开启' : '短回复已关闭',
        profile.preferSingleClarifyQuestion ? '单问题澄清已开启' : '单问题澄清已关闭',
        profile.preferFocusMode ? '专注模式优先已开启' : '专注模式优先已关闭',
      ].join(' · ')
    : [
        profile.preferShortReply ? 'Short replies on' : 'Short replies off',
        profile.preferSingleClarifyQuestion ? 'Single clarify on' : 'Single clarify off',
        profile.preferFocusMode ? 'Focus-first on' : 'Focus-first off',
      ].join(' · ')

  return (
    <div className="space-y-4">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {locale === 'zh' ? '系统记忆' : 'System Memory'}
      </div>
      <div className="rounded-3xl border border-primary/12 bg-linear-to-br from-primary/5 via-background to-background p-5 shadow-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="text-lg font-semibold tracking-tight">
              {locale === 'zh' ? '这些是系统已经稳定记住的使用偏好' : 'These are the stable usage preferences the system remembers'}
            </div>
            <div className="text-sm leading-6 text-muted-foreground">
              {locale === 'zh'
                ? '只记录你明确表达过，或已经稳定重复的规则。你可以随时开关或删除。'
                : 'Only explicit or stable repeated rules are stored here. You can toggle or remove them at any time.'}
            </div>
            <div className="text-xs text-primary/80">{summary}</div>
          </div>
          {pendingKey ? <LoadingSpinner size={16} className="shrink-0" /> : null}
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {preferences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-5 text-sm text-muted-foreground">
              {locale === 'zh' ? '当前没有系统记忆条目。' : 'No system memory items yet.'}
            </div>
          ) : (
            preferences.map((item) => {
              const isPending = pendingKey === item.key
              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-border/60 bg-background/80 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{item.title}</div>
                        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {item.enabled
                            ? locale === 'zh'
                              ? '已开启'
                              : 'On'
                            : locale === 'zh'
                              ? '已关闭'
                              : 'Off'}
                        </span>
                      </div>
                      <div className="text-sm leading-6 text-muted-foreground">{item.description}</div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={item.enabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => togglePreference(item.key, !item.enabled)}
                        disabled={isPending}
                      >
                        {item.enabled
                          ? locale === 'zh'
                            ? '关闭'
                            : 'Turn off'
                          : locale === 'zh'
                            ? '开启'
                            : 'Turn on'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreference(item.key)}
                        disabled={isPending}
                      >
                        {locale === 'zh' ? '删除' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
