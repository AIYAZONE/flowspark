export type ChatRole = 'user' | 'assistant'
export type ChatTurnStatus = 'streaming' | 'done' | 'error'
export type ChatActionState = 'idle' | 'confirming' | 'done' | 'error' | 'duplicate'
export type ChatCompleteState = 'idle' | 'confirming' | 'done' | 'error'

export type ChatActionKind = 'goal' | 'action'

export type ChatActionDraft = {
  kind: ChatActionKind
  title: string
  goalHint?: string | null
  reason?: string | null
}

export type ChatCompleteDraft = {
  actionId: string
  title: string
  reason?: string | null
}

export type ChatReferencedAction = { id: string; title: string; done?: boolean }

export type ChatFeedbackReason = 'too_verbose' | 'not_relevant' | 'inaccurate' | 'want_specific'
export type ChatTurnFeedback = {
  rating: 'up' | 'down'
  reason?: ChatFeedbackReason | null
  reasonText?: string | null
}

export type ChatTurn = {
  id: string
  role: ChatRole
  text: string
  status: ChatTurnStatus
  action?: ChatActionDraft | null
  actionState?: ChatActionState
  completion?: ChatCompleteDraft | null
  completionState?: ChatCompleteState
  referencedActions?: ChatReferencedAction[] | null
  feedback?: ChatTurnFeedback | null
  createdAt: string
}

export type ChatStreamEvent =
  | { type: 'text'; value: string }
  | { type: 'references'; actions: Array<{ id: string; title: string }> }
  | { type: 'done' }
  | { type: 'error'; message: string }

export type ChatHistoryEntry = {
  role: ChatRole
  text: string
}

export type ChatCopy = {
  eyebrow: string
  headerBody: string
  sourceToday: string
  sourceProfile: string
  sourceSystem: string
  emptyTitle: string
  emptyBody: string
  emptyChips: string[]
  placeholder: string
  send: string
  thinking: string
  statusLabel: string
  degradedLabel: string
  degradedText: string
  retry: string
  copyMessage: string
  copiedMessage: string
  actionCardTitle: string
  actionKindGoal: string
  actionKindAction: string
  actionReasonLabel: string
  actionConfirm: string
  actionConfirming: string
  actionDone: string
  actionError: string
  actionDuplicate: string
  actionNoGoal: string
  refTitle: string
  refGoToday: string
  refComplete: string
  refDone: string
  feedbackPrompt: string
  feedbackLike: string
  feedbackDislike: string
  feedbackReasonPrompt: string
  reasonTooVerbose: string
  reasonNotRelevant: string
  reasonInaccurate: string
  reasonWantSpecific: string
  feedbackReasonDetail: string
  feedbackCustomPlaceholder: string
  feedbackSubmit: string
  feedbackCancel: string
  feedbackThanks: string
  completeCardTitle: string
  completeConfirm: string
  completeConfirming: string
  completeDone: string
  completeError: string
  completeCancel: string
}
