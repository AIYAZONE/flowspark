'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatCopy, ChatFeedbackReason, ChatTurn } from '@/lib/chat/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogFormContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const REASONS: ChatFeedbackReason[] = [
  'too_verbose',
  'not_relevant',
  'inaccurate',
  'want_specific'
]

function reasonLabel(reason: ChatFeedbackReason, copy: ChatCopy): string {
  switch (reason) {
    case 'too_verbose':
      return copy.reasonTooVerbose
    case 'not_relevant':
      return copy.reasonNotRelevant
    case 'inaccurate':
      return copy.reasonInaccurate
    case 'want_specific':
      return copy.reasonWantSpecific
  }
}

type ChatFeedbackControlProps = {
  turn: ChatTurn
  copy: ChatCopy
  excerpt: string
  onSubmitFeedback: (
    turnId: string,
    rating: 'up' | 'down',
    reason?: ChatFeedbackReason | null,
    excerpt?: string | null,
    reasonText?: string | null
  ) => void
  onCancelFeedback: (turnId: string) => void
}

export function ChatFeedbackControl({
  turn,
  copy,
  excerpt,
  onSubmitFeedback,
  onCancelFeedback
}: ChatFeedbackControlProps) {
  const rating = turn.feedback?.rating ?? null
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ChatFeedbackReason | null>(
    turn.feedback?.reason ?? null
  )
  const [custom, setCustom] = useState(turn.feedback?.reasonText ?? '')

  const handleUp = () => {
    if (rating === 'up') onCancelFeedback(turn.id)
    else onSubmitFeedback(turn.id, 'up', null, excerpt)
  }

  const handleDownClick = () => {
    if (rating === 'down') {
      onCancelFeedback(turn.id)
      setOpen(false)
      return
    }
    setSelected(null)
    setCustom('')
    setOpen(true)
  }

  const handleSubmit = () => {
    const trimmed = custom.trim()
    const reason = selected
    const reasonText = reason ? null : trimmed ? trimmed.slice(0, 500) : null
    onSubmitFeedback(turn.id, 'down', reason, excerpt, reasonText)
    setOpen(false)
  }

  const tipLike = copy.feedbackLike
  const tipDislike = copy.feedbackDislike

  return (
    <div className="flex items-center gap-1">
      {rating !== 'down' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleUp}
              aria-pressed={rating === 'up'}
              aria-label={copy.feedbackLike}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                rating === 'up'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/45 hover:text-foreground'
              )}
            >
              <ThumbsUp
                className={cn('h-4 w-4', rating === 'up' && 'fill-primary')}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="text-[12px]">
            {tipLike}
          </TooltipContent>
        </Tooltip>
      )}

      {rating !== 'up' && (
        <Dialog open={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleDownClick}
                aria-pressed={rating === 'down'}
                aria-label={copy.feedbackDislike}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                  rating === 'down'
                    ? 'bg-red-500/10 text-red-500'
                    : 'text-muted-foreground hover:bg-muted/45 hover:text-foreground'
                )}
              >
                <ThumbsDown
                  className={cn('h-4 w-4', rating === 'down' && 'fill-red-500')}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="text-[12px]">
              {tipDislike}
            </TooltipContent>
          </Tooltip>

          <DialogFormContent>
            <DialogHeader>
              <DialogTitle>{copy.feedbackDislike}</DialogTitle>
              <DialogDescription>{copy.feedbackReasonPrompt}</DialogDescription>
            </DialogHeader>

            <p className="text-xs text-muted-foreground">{copy.feedbackReasonDetail}</p>

            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelected(r)
                    setCustom('')
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1 text-sm transition-colors',
                    selected === r
                      ? 'border-rose-400 bg-rose-50 text-rose-600'
                      : 'border-border/60 text-foreground hover:border-rose-300'
                  )}
                >
                  {reasonLabel(r, copy)}
                </button>
              ))}
            </div>

            <Textarea
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value)
                setSelected(null)
              }}
              placeholder={copy.feedbackCustomPlaceholder}
              rows={3}
              className="resize-none"
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {copy.feedbackCancel}
              </Button>
              <Button type="button" onClick={handleSubmit}>
                {copy.feedbackSubmit}
              </Button>
            </DialogFooter>
          </DialogFormContent>
        </Dialog>
      )}
    </div>
  )
}
