export type ChatRole = 'user' | 'assistant'
export type ChatTurnStatus = 'streaming' | 'done' | 'error'
export type ChatActionState = 'idle' | 'confirming' | 'done' | 'error'
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

export type ChatTurn = {
  id: string
  role: ChatRole
  text: string
  status: ChatTurnStatus
  action?: ChatActionDraft | null
  actionState?: ChatActionState
  completion?: ChatCompleteDraft | null
  completionState?: ChatCompleteState
  createdAt: string
}

export type ChatStreamEvent =
  | { type: 'text'; value: string }
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
  actionCardTitle: string
  actionKindGoal: string
  actionKindAction: string
  actionReasonLabel: string
  actionConfirm: string
  actionConfirming: string
  actionDone: string
  actionError: string
  actionNoGoal: string
  completeCardTitle: string
  completeConfirm: string
  completeConfirming: string
  completeDone: string
  completeError: string
  completeCancel: string
}
