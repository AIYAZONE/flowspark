export type ChatRole = 'user' | 'assistant'
export type ChatTurnStatus = 'streaming' | 'done' | 'error'
export type ChatActionState = 'idle' | 'confirming' | 'done' | 'error' | 'duplicate'
export type ChatIdeaState = 'idle' | 'confirming' | 'done' | 'error' | 'duplicate'
export type ChatCompleteState = 'idle' | 'confirming' | 'done' | 'error'

export type ChatActionKind = 'goal' | 'action'

export type ChatActionDraft = {
  kind: ChatActionKind
  title: string
  goalHint?: string | null
  reason?: string | null
}

export type ChatIdeaKind = 'idea'

export type ChatIdeaDraft = {
  kind: ChatIdeaKind
  title: string
  angle?: string | null
  hook?: string | null
  notes?: string | null
}

// AI 自动沉淀的内容资产（不再需要用户确认/手动归类，直接入库）
export type ChatAssetKind =
  | 'idea'
  | 'script'
  | 'note'
  | 'data'
  | 'strategy'
  | 'tool'
  | 'other'

export type ChatAssetDraft = {
  id: string
  kind: ChatAssetKind
  title: string
  summary?: string | null
  folderId?: string | null
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
  idea?: ChatIdeaDraft | null
  ideaState?: ChatIdeaState
  assets?: ChatAssetDraft[] | null
  completion?: ChatCompleteDraft | null
  completionState?: ChatCompleteState
  referencedActions?: ChatReferencedAction[] | null
  feedback?: ChatTurnFeedback | null
  createdAt: string
}

export type ChatStreamEvent =
  | { type: 'text'; value: string }
  | { type: 'references'; actions: Array<{ id: string; title: string }> }
  | { type: 'action'; draft: ChatActionDraft }
  | { type: 'idea'; draft: ChatIdeaDraft }
  | { type: 'assets'; assets: ChatAssetDraft[] }
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
  actionConfirmGoal: string
  actionConfirming: string
  actionDone: string
  actionDoneGoal: string
  actionError: string
  actionDuplicate: string
  actionNoGoal: string
  ideaCardTitle: string
  ideaAngleLabel: string
  ideaHookLabel: string
  ideaNotesLabel: string
  ideaConfirm: string
  ideaConfirming: string
  ideaDone: string
  ideaError: string
  ideaDuplicate: string
  assetCardTitle: string
  assetAutoSaved: string
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
