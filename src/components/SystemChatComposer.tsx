'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

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

export function SystemChatComposer(props: {
  locale: CommandLocale
  sourcePage: SystemTurn['sourcePage']
  initialPrefill?: string | null
  className?: string
}) {
  const [text, setText] = useState(props.initialPrefill ?? '')
  const [pending, startTransition] = useTransition()
  const [preferenceProfile, setPreferenceProfile] = useState(() => ({
    preferShortReply: true,
    preferSingleClarifyQuestion: true,
    preferFocusMode: true,
  }))
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { appendSubmittingTurn, replaceLastTurnWithResponse, turnsVisible } = useSystemConversation()

  useEffect(() => {
    function onFocusCommandBar(evt: Event) {
      const event = evt as CustomEvent<{ prefill?: unknown }>
      const prefill = typeof event.detail?.prefill === 'string' ? event.detail.prefill : undefined
      if (prefill !== undefined) setText(prefill)
      requestAnimationFrame(() => {
        const input = inputRef.current
        if (!input) return
        input.focus()
        if (prefill !== undefined) {
          const len = prefill.length
          input.setSelectionRange(len, len)
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
        const res = await fetch(`/api/system-memory/preferences?locale=${props.locale}`, {
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
  }, [props.locale])

  async function requestDraft(raw: string) {
    try {
      const res = await fetch('/api/command/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          text: raw,
          locale: props.locale,
          sourcePage: props.sourcePage,
          recentTurns: turnsVisible.map((turn) => ({
            userText: turn.userText,
            assistantText: turn.judgement,
            state: turn.state,
            sourcePage: turn.sourcePage,
          })),
        }),
      })
      if (!res.ok) throw new Error('draft_failed')
      const next = (await res.json()) as CommandDraft
      replaceLastTurnWithResponse(mapCommandDraftToSystemDraftResponse(next))
    } catch {
      replaceLastTurnWithResponse(
        buildFallbackDraftResponse({
          locale: props.locale,
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
    appendSubmittingTurn({ userText: raw, sourcePage: props.sourcePage })
    setText('')
    startTransition(() => {
      void requestDraft(raw)
    })
  }

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-3xl rounded-[1.45rem] border border-border/45 bg-background/92 px-3 py-3 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.24)] backdrop-blur-xl md:px-4',
        props.className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/65">
          {props.locale === 'zh' ? '系统对话' : 'System Chat'}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {props.locale === 'zh' ? '直接说问题，我会先理解再判断。' : 'Ask naturally. I will interpret first.'}
        </div>
      </div>
      <div className="pointer-events-auto flex items-center gap-2 rounded-[1.15rem] border border-border/45 bg-background/96 px-3 py-2">
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={props.locale === 'zh' ? '对系统说：你现在想推进什么？' : 'Tell the system what you want to move forward…'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit()
            }
          }}
          className="h-11 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0 md:text-sm"
        />
        <Button type="button" onClick={onSubmit} disabled={pending} className="h-10 rounded-full px-4 shadow-none">
          {pending ? <LoadingSpinner /> : props.locale === 'zh' ? '发送' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
