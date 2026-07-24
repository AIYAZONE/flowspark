'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { CommandDraft, CommandLocale } from '@/lib/command-bar/types'
import {
  getSystemMemoryPreferenceProfile,
  type SystemMemoryPreference,
} from '@/lib/system-memory/preferences'
import { mapCommandDraftToSystemDraftResponse } from '@/lib/system-conversation/command-draft-mapper'
import { useSystemConversation } from '@/lib/system-conversation/store'
import type { SystemTurn } from '@/lib/system-conversation/types'
import { cn } from '@/lib/utils'

const LS_LAST_INPUT = 'commandbar:last_input:v1'
const LS_FOLLOWUP = 'commandbar:followup:v1'

function sourcePageFromPathname(pathname: string): SystemTurn['sourcePage'] {
  if (pathname.startsWith('/today')) return 'today'
  if (pathname.startsWith('/profile')) return 'profile'
  return 'system'
}

function buildFallbackDraftResponse(params: {
  locale: CommandLocale
  raw: string
  preferShortReply: boolean
  preferFocusMode: boolean
}) {
  const { locale, raw, preferShortReply, preferFocusMode } = params
  const judgement = locale === 'zh'
    ? preferShortReply
      ? '系统暂时没有接住这句话。'
      : '系统这次没能稳定接住你的意思，所以我先不做危险写入。'
    : preferShortReply
      ? 'The system did not catch that yet.'
      : 'The system could not reliably catch the intent, so it will not write anything risky yet.'
  const reason = locale === 'zh'
    ? preferShortReply
      ? '可能是表达还不够具体。'
      : '这句话里的目标还不够稳定，系统无法安全判断你要推进的对象。'
    : preferShortReply
      ? 'The intent is still a bit underspecified.'
      : 'The target is still not specific enough for the system to decide safely.'
  const nextStep = locale === 'zh'
    ? preferFocusMode
      ? '你可以直接再说一次，或先打开今日主线。'
      : '你可以换一种说法再发一次，我会继续理解。'
    : preferFocusMode
      ? 'Try saying it again, or open today first.'
      : 'Try phrasing it another way and I will keep parsing it.'

  return {
    status: 'error' as const,
    judgement,
    reason,
    nextStep,
    prefill: raw,
  }
}

export function GlobalCommandBar(props: {
  locale: CommandLocale
  today: string
  mode?: 'global' | 'home'
}) {
  const { locale, mode = 'global' } = props
  const pathname = usePathname()
  const isSystemHome = pathname === '/system'
  const isHomeMode = mode === 'home'
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const [preferenceProfile, setPreferenceProfile] = useState(() => ({
    preferShortReply: true,
    preferSingleClarifyQuestion: true,
    preferFocusMode: true,
  }))
  const inputRef = useRef<HTMLInputElement | null>(null)

  const { appendSubmittingTurn, replaceLastTurnWithResponse } = useSystemConversation()

  useEffect(() => {
    function onFocusCommandBar(evt: Event) {
      const e = evt as CustomEvent<{ prefill?: unknown }>
      const prefill = typeof e.detail?.prefill === 'string' ? e.detail.prefill : undefined
      if (prefill !== undefined) setText(prefill)
      requestAnimationFrame(() => {
        const el = inputRef.current
        if (!el) return
        el.focus()
        if (prefill !== undefined) {
          const len = prefill.length
          el.setSelectionRange(len, len)
        }
      })
    }

    window.addEventListener('flowspark:focus-command-bar', onFocusCommandBar)
    return () => window.removeEventListener('flowspark:focus-command-bar', onFocusCommandBar)
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function loadPreferences() {
      try {
        const res = await fetch(`/api/system-memory/preferences?locale=${locale}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as { preferences?: SystemMemoryPreference[] }
        if (cancelled || !Array.isArray(data.preferences)) return
        setPreferenceProfile(getSystemMemoryPreferenceProfile(data.preferences))
      } catch {
        // Keep defaults when preference memory is unavailable.
      }
    }

    void loadPreferences()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [locale])

  const sourcePage = useMemo(() => sourcePageFromPathname(pathname), [pathname])

  async function requestDraft(raw: string) {
    try {
      const res = await fetch('/api/command/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ text: raw, locale }),
      })
      if (!res.ok) throw new Error('draft_failed')
      const next = (await res.json()) as CommandDraft
      const draftResponse = mapCommandDraftToSystemDraftResponse(next)
      replaceLastTurnWithResponse(draftResponse)

      window.localStorage.setItem(LS_LAST_INPUT, next.firstIntentText)
      if (next.followupText) window.localStorage.setItem(LS_FOLLOWUP, next.followupText)
    } catch {
      replaceLastTurnWithResponse(
        buildFallbackDraftResponse({
          locale,
          raw,
          preferShortReply: preferenceProfile.preferShortReply,
          preferFocusMode: preferenceProfile.preferFocusMode,
        })
      )
    }
  }

  function onSubmit() {
    const raw = text.trim()
    if (!raw) return

    const storedFollowup = window.localStorage.getItem(LS_FOLLOWUP)
    if (storedFollowup && (raw === storedFollowup || raw.includes(storedFollowup))) {
      window.localStorage.removeItem(LS_FOLLOWUP)
    }

    appendSubmittingTurn({ userText: raw, sourcePage })
    setText('')
    startTransition(() => {
      void requestDraft(raw)
    })
  }

  const bottomOffsetClass =
    'bottom-[calc(env(safe-area-inset-bottom)+6.25rem)] md:bottom-3'
  const shellClassName = isHomeMode
    ? 'rounded-[2rem] border border-primary/18 bg-linear-to-br from-primary/12 via-background to-background p-4 shadow-sm md:p-5'
    : 'pointer-events-none fixed inset-x-0 z-40 px-3 md:left-[108px] xl:left-[118px] 2xl:left-[126px] [@media(min-width:1920px)]:left-[134px] [@media(min-width:2560px)]:left-[142px]'
  const barWrapClassName = isHomeMode ? '' : bottomOffsetClass
  const barClassName = cn(
    'pointer-events-auto mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-border/60 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-xl',
    isHomeMode
      ? 'bg-background/92'
      : 'bg-background/78'
  )
  const inputPlaceholder =
    locale === 'zh' ? '对系统说：你现在想推进什么？' : 'Tell the system what you want to move forward…'
  const cueTitle = locale === 'zh' ? '告诉系统' : 'Tell the system'
  const cueBody = locale === 'zh'
    ? '默认先执行系统安排；如果你要改，就直接说。'
    : 'Default to the system plan. If you want to change it, say it directly.'

  if (mode === 'global' && isSystemHome) {
    return null
  }

  return (
    <>
      <div className={cn(shellClassName, barWrapClassName)}>
        {isHomeMode ? (
          <div className="mx-auto mb-3 max-w-2xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
              {cueTitle}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{cueBody}</div>
          </div>
        ) : null}

        <div className={barClassName}>
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={inputPlaceholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSubmit()
              }
            }}
            className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <Button type="button" onClick={onSubmit} disabled={pending}>
            {pending ? <LoadingSpinner /> : locale === 'zh' ? '发送' : 'Send'}
          </Button>
        </div>
      </div>
    </>
  )
}
