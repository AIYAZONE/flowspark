'use client'

import type { ChatCopy, ChatTurn, ChatFeedbackReason } from '@/lib/chat/types'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatMessage } from './ChatMessage'

type Props = {
  copy: ChatCopy
  turns: ChatTurn[]
  onApplyAction: (id: string) => void
  onCompleteAction: (id: string) => void
  onDismissCompletion: (id: string) => void
  onCompleteReferenced: (turnId: string, actionId: string) => void
  onSubmitFeedback: (turnId: string, rating: 'up' | 'down', reason?: ChatFeedbackReason | null, excerpt?: string | null, reasonText?: string | null) => void
  onCancelFeedback: (turnId: string) => void
  onPickChip: (text: string) => void
}

export function ChatConversation({
  copy,
  turns,
  onApplyAction,
  onCompleteAction,
  onDismissCompletion,
  onCompleteReferenced,
  onSubmitFeedback,
  onCancelFeedback,
  onPickChip
}: Props) {
  if (turns.length === 0) {
    return <ChatEmptyState copy={copy} onPick={onPickChip} />
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {turns.map((turn) => (
        <ChatMessage
          key={turn.id}
          turn={turn}
          copy={copy}
          onApplyAction={onApplyAction}
          onCompleteAction={onCompleteAction}
          onDismissCompletion={onDismissCompletion}
          onCompleteReferenced={onCompleteReferenced}
          onSubmitFeedback={onSubmitFeedback}
          onCancelFeedback={onCancelFeedback}
        />
      ))}
    </div>
  )
}
