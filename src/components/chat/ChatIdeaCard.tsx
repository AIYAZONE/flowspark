'use client'

import { Check, Loader2, Lightbulb } from 'lucide-react'
import type { ChatIdeaDraft, ChatIdeaState, ChatCopy } from '@/lib/chat/types'

type Props = {
  idea: ChatIdeaDraft
  ideaState: ChatIdeaState
  copy: ChatCopy
  onConfirm: () => void
}

export function ChatIdeaCard({ idea, ideaState, copy, onConfirm }: Props) {
  return (
    <div className="relative mt-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-amber-600">
          <Lightbulb className="mr-1 inline h-3 w-3" />
          {copy.ideaCardTitle}
        </span>
      </div>
      <div className="mt-2 text-[15px] font-medium text-foreground">{idea.title}</div>
      {idea.angle && (
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
          <span className="text-muted-foreground/60">{copy.ideaAngleLabel}：</span>
          {idea.angle}
        </p>
      )}
      {idea.hook && (
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
          <span className="text-muted-foreground/60">{copy.ideaHookLabel}：</span>
          {idea.hook}
        </p>
      )}
      {idea.notes && (
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
          <span className="text-muted-foreground/60">{copy.ideaNotesLabel}：</span>
          {idea.notes}
        </p>
      )}
      <div className="mt-3">
        {ideaState === 'idle' && (
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.985]"
          >
            {copy.ideaConfirm}
          </button>
        )}
        {ideaState === 'confirming' && (
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/40 px-4 text-[13px] font-medium text-primary-foreground/80"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {copy.ideaConfirming}
          </button>
        )}
        {ideaState === 'done' && (
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-[13px] font-medium text-primary">
            <Check className="h-3.5 w-3.5" />
            {copy.ideaDone}
          </div>
        )}
        {ideaState === 'error' && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-destructive">{copy.ideaError}</span>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-8 items-center rounded-full border border-destructive/30 px-3 text-[12px] text-destructive transition hover:bg-destructive/10 active:scale-[0.985]"
            >
              {copy.retry}
            </button>
          </div>
        )}
        {ideaState === 'duplicate' && (
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-[13px] font-medium text-primary">
            <Check className="h-3.5 w-3.5" />
            {copy.ideaDuplicate}
          </div>
        )}
      </div>
    </div>
  )
}
