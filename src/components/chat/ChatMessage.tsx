'use client'

import { Sparkles } from 'lucide-react'
import type { ChatCopy, ChatTurn } from '@/lib/chat/types'
import { ChatActionCard } from './ChatActionCard'
import { ChatCompleteCard } from './ChatCompleteCard'
import { ChatReferenceCard } from './ChatReferenceCard'

type Props = {
  turn: ChatTurn
  copy: ChatCopy
  onApplyAction: (id: string) => void
  onCompleteAction: (id: string) => void
  onDismissCompletion: (id: string) => void
  onCompleteReferenced: (turnId: string, actionId: string) => void
}

export function ChatMessage({
  turn,
  copy,
  onApplyAction,
  onCompleteAction,
  onDismissCompletion,
  onCompleteReferenced
}: Props) {
  if (turn.role === 'user') {
    return (
      <div className="flex flex-col items-end">
        <div className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60">你</div>
        <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tr-sm border border-primary/30 bg-primary px-4 py-3 text-[15px] leading-7 text-primary-foreground">
          {turn.text}
        </div>
      </div>
    )
  }

  const isError = turn.status === 'error'
  const isStreaming = turn.status === 'streaming'

  return (
    <div className="relative rounded-2xl border border-border bg-muted/50 px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" />
          {isError ? copy.degradedLabel : copy.statusLabel}
        </span>
      </div>

      {turn.text ? (
        <div className="whitespace-pre-wrap text-[15px] leading-[1.85] text-foreground">
          {turn.text}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 py-1 text-[13px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/40 [animation-delay:300ms]" />
          <span className="ml-2">{copy.thinking}</span>
        </div>
      )}

      {isError && !turn.text && (
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{copy.degradedText}</p>
      )}

      {turn.action && (
        <ChatActionCard
          action={turn.action}
          actionState={turn.actionState ?? 'idle'}
          copy={copy}
          onConfirm={() => onApplyAction(turn.id)}
        />
      )}

      {turn.completion && turn.completionState !== 'done' && (
        <ChatCompleteCard
          completion={turn.completion}
          completionState={turn.completionState ?? 'idle'}
          copy={copy}
          onConfirm={() => onCompleteAction(turn.id)}
          onDismiss={() => onDismissCompletion(turn.id)}
        />
      )}

      {turn.referencedActions && turn.referencedActions.length > 0 && (
        <ChatReferenceCard
          actions={turn.referencedActions}
          copy={copy}
          onComplete={(actionId) => onCompleteReferenced(turn.id, actionId)}
        />
      )}
    </div>
  )
}
