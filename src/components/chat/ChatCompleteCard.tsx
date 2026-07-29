'use client'

import { Check, Loader2, X } from 'lucide-react'
import type { ChatCompleteDraft, ChatCompleteState, ChatCopy } from '@/lib/chat/types'

type Props = {
  completion: ChatCompleteDraft
  completionState: ChatCompleteState
  copy: ChatCopy
  onConfirm: () => void
  onDismiss: () => void
}

export function ChatCompleteCard({ completion, completionState, copy, onConfirm, onDismiss }: Props) {
  return (
    <div className="relative mt-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-primary">
          {copy.completeCardTitle}
        </span>
      </div>
      <div className="mt-2 text-[15px] font-medium text-foreground">{completion.title}</div>
      {completion.reason && (
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
          <span className="text-muted-foreground/60">{copy.actionReasonLabel}：</span>
          {completion.reason}
        </p>
      )}
      <div className="mt-3">
        {completionState === 'idle' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.985]"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {copy.completeConfirm}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[13px] text-muted-foreground transition hover:bg-muted active:scale-[0.985]"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              {copy.completeCancel}
            </button>
          </div>
        )}
        {completionState === 'confirming' && (
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/40 px-4 text-[13px] font-medium text-primary-foreground/80"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {copy.completeConfirming}
          </button>
        )}
        {completionState === 'done' && (
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-[13px] font-medium text-primary">
            <Check className="h-3.5 w-3.5" />
            {copy.completeDone}
          </div>
        )}
        {completionState === 'error' && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-destructive">{copy.completeError}</span>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-8 items-center rounded-full border border-destructive/30 px-3 text-[12px] text-destructive transition hover:bg-destructive/10 active:scale-[0.985]"
            >
              {copy.retry}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
