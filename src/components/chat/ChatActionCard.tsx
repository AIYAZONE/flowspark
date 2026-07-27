'use client'

import { Check, Loader2 } from 'lucide-react'
import type { ChatActionDraft, ChatActionState, ChatCopy } from '@/lib/chat/types'

type Props = {
  action: ChatActionDraft
  actionState: ChatActionState
  copy: ChatCopy
  onConfirm: () => void
}

export function ChatActionCard({ action, actionState, copy, onConfirm }: Props) {
  const kindLabel = action.kind === 'goal' ? copy.actionKindGoal : copy.actionKindAction

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-muted/40 p-3.5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-primary">
          {kindLabel}
        </span>
        <span className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground/70">{copy.actionCardTitle}</span>
      </div>
      <div className="mt-2 text-[15px] font-medium text-foreground">{action.title}</div>
      {action.reason && (
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
          <span className="text-muted-foreground/60">{copy.actionReasonLabel}：</span>
          {action.reason}
        </p>
      )}
      <div className="mt-3">
        {actionState === 'idle' && (
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.985]"
          >
            {copy.actionConfirm}
          </button>
        )}
        {actionState === 'confirming' && (
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/40 px-4 text-[13px] font-medium text-primary-foreground/80"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {copy.actionConfirming}
          </button>
        )}
        {actionState === 'done' && (
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-[13px] font-medium text-primary">
            <Check className="h-3.5 w-3.5" />
            {copy.actionDone}
          </div>
        )}
        {actionState === 'error' && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-destructive">{copy.actionError}</span>
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
