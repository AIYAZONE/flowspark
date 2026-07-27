'use client'

import * as React from 'react'
import { ChatProvider, useChat, type ChatSource } from '@/lib/chat/store'
import type { ChatCopy } from '@/lib/chat/types'
import { ChatComposer } from './ChatComposer'
import { ChatConversation } from './ChatConversation'

export function ChatSurface({
  copy,
  source,
  prefill
}: {
  copy: ChatCopy
  source: ChatSource
  prefill?: string
}) {
  return (
    <ChatProvider source={source}>
      <ChatInner copy={copy} prefill={prefill} />
    </ChatProvider>
  )
}

function ChatInner({ copy, prefill }: { copy: ChatCopy; prefill?: string }) {
  const { turns, isStreaming, send, applyAction, completeAction, dismissCompletion, source } = useChat()
  const [value, setValue] = React.useState(prefill || '')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [turns])

  const sourceHint =
    source === 'today' ? copy.sourceToday : source === 'profile' ? copy.sourceProfile : copy.sourceSystem

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] min-h-0 flex-col 2xl:max-w-[1760px]">
      <div className="relative mx-auto flex h-full w-full max-w-5xl min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative mb-2 flex items-center gap-2 px-4 pt-4 text-xs text-muted-foreground sm:px-6">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/70">
            {copy.eyebrow}
          </div>
          <span className="text-muted-foreground/50">/</span>
          <p className="truncate leading-5">{sourceHint}</p>
        </div>

        <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
          <ChatConversation
            copy={copy}
            turns={turns}
            onApplyAction={applyAction}
            onCompleteAction={completeAction}
            onDismissCompletion={dismissCompletion}
            onPickChip={(text) => setValue(text)}
          />
        </div>

        <div className="relative shrink-0 border-t border-border px-4 pb-4 pt-4 sm:px-6">
          <ChatComposer
            value={value}
            onChange={setValue}
            onSend={send}
            placeholder={copy.placeholder}
            disabled={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}
