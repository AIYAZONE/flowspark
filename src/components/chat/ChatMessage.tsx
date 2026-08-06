'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatCopy, ChatTurn } from '@/lib/chat/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { ChatActionCard } from './ChatActionCard'
import { ChatCompleteCard } from './ChatCompleteCard'
import { ChatReferenceCard } from './ChatReferenceCard'
import { ChatAssetsCard } from './ChatAssetsCard'
import { ChatFeedbackControl } from './ChatFeedbackControl'

type Props = {
  turn: ChatTurn
  copy: ChatCopy
  onApplyAction: (id: string) => void
  onCompleteAction: (id: string) => void
  onDismissCompletion: (id: string) => void
  onCompleteReferenced: (turnId: string, actionId: string) => void
  onSubmitFeedback: (
    turnId: string,
    rating: 'up' | 'down',
    reason?: import('@/lib/chat/types').ChatFeedbackReason | null,
    excerpt?: string | null,
    reasonText?: string | null
  ) => void
  onCancelFeedback: (turnId: string) => void
}

export function ChatMessage({
  turn,
  copy,
  onApplyAction,
  onCompleteAction,
  onDismissCompletion,
  onCompleteReferenced,
  onSubmitFeedback,
  onCancelFeedback
}: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(t)
  }, [copied])

  const copyText = useMemo(() => {
    const lines: string[] = []
    if (turn.text && turn.text.trim()) lines.push(turn.text)
    if (turn.action) {
      if (turn.action.title) lines.push(`${copy.actionCardTitle}：${turn.action.title}`)
      if (turn.action.reason) lines.push(turn.action.reason)
    }
    if (turn.completion) {
      lines.push(`${copy.completeCardTitle}：${turn.completion.title}`)
      if (turn.completion.reason) lines.push(turn.completion.reason)
    }
    if (turn.referencedActions && turn.referencedActions.length > 0) {
      lines.push(copy.refTitle + '：')
      for (const action of turn.referencedActions) {
        lines.push(`- ${action.title}`)
      }
    }
    return lines.join('\n').trim()
  }, [turn, copy])

  const handleCopy = async () => {
    if (!copyText) return
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (turn.role === 'user') {
    return (
      <div className="group relative flex flex-col items-end">
        <div className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60">你</div>
        <div className="relative max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tr-sm border border-primary/30 bg-primary px-4 py-2.5 text-[15px] leading-6 text-primary-foreground">
          {turn.text}
        </div>
        <div className="mt-1 mr-1 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copy.copyMessage}
                className="invisible inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/70 opacity-0 transition duration-150 hover:bg-muted/60 hover:text-foreground focus-visible:opacity-100 focus-visible:visible group-hover:visible group-hover:opacity-100"
              >
                {copied ? <Check className="h-4 w-4" strokeWidth={2.4} /> : <Copy className="h-4 w-4" strokeWidth={2} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="text-[12px]">
              {copied ? copy.copiedMessage : copy.copyMessage}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  }

  const isError = turn.status === 'error'
  const isStreaming = turn.status === 'streaming'

  return (
    <div className="group relative space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" />
          {isError ? copy.degradedLabel : copy.statusLabel}
        </span>
      </div>

      {turn.text ? (
        <div className="chat-markdown space-y-5 text-[16px] text-foreground prose prose-sm max-w-none
          prose-headings:font-semibold
          prose-headings:!mt-0 prose-headings:!mb-0
          prose-p:!mt-0 prose-p:!mb-0 prose-p:leading-[1.9]
          prose-strong:text-foreground prose-strong:font-semibold
          prose-ul:!mt-0 prose-ul:!mb-0 prose-ul:space-y-2 prose-ul:pl-6
          prose-ol:!mt-0 prose-ol:!mb-0 prose-ol:space-y-2 prose-ol:pl-6
          prose-li:!mt-0 prose-li:!mb-0 prose-li:leading-[1.9] prose-li:marker:text-muted-foreground
          prose-blockquote:!mt-0 prose-blockquote:!mb-0 prose-blockquote:leading-[1.9] prose-blockquote:border-muted prose-blockquote:text-muted-foreground
          prose-h1:text-[1.15rem] prose-h2:text-[1.08rem] prose-h3:text-[1rem]
          prose-code:text-[13.5px] prose-code:rounded-md prose-code:bg-muted/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none
          prose-pre:!mt-0 prose-pre:!mb-0 prose-pre:leading-[1.7] prose-pre:border prose-pre:border-border prose-pre:bg-muted/40
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          [&>h1]:mt-5 [&>h1]:mb-2 [&>h1+*]:!mt-0
          [&>h2]:mt-4 [&>h2]:mb-1.5 [&>h2+*]:!mt-0
          [&>h3]:mt-3 [&>h3]:mb-1 [&>h3+*]:!mt-0
          [&>h1:first-child]:mt-0 [&>h2:first-child]:mt-0 [&>h3:first-child]:mt-0
          [&>blockquote]:!my-4 [&>pre]:!my-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.text}</ReactMarkdown>
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
        <p className="text-[14px] leading-6 text-muted-foreground">{copy.degradedText}</p>
      )}

      {turn.action && (
        <ChatActionCard
          action={turn.action}
          actionState={turn.actionState ?? 'idle'}
          copy={copy}
          onConfirm={() => onApplyAction(turn.id)}
        />
      )}

      {turn.assets && turn.assets.length > 0 && (
        <ChatAssetsCard assets={turn.assets} copy={copy} />
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

      {turn.status === 'done' && turn.text && (
        <div className="flex items-center gap-1 pt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copy.copyMessage}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/75 transition duration-150 hover:bg-muted/60 hover:text-foreground focus-visible:opacity-100"
              >
                {copied ? (
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                ) : (
                  <Copy className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="text-[12px]">
              {copied ? copy.copiedMessage : copy.copyMessage}
            </TooltipContent>
          </Tooltip>

          <ChatFeedbackControl
            turn={turn}
            copy={copy}
            excerpt={turn.text.slice(0, 280)}
            onSubmitFeedback={onSubmitFeedback}
            onCancelFeedback={onCancelFeedback}
          />
        </div>
      )}
    </div>
  )
}
