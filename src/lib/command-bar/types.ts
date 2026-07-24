export type CommandLocale = 'zh' | 'en'

export type CommandIntentKind =
  | 'set_today_core'
  | 'push_next_step'
  | 'create_action_request'
  | 'ask_capabilities'
  | 'general_guidance'
  | 'complete_action'
  | 'review_current_tasks'
  | 'review_main_path'
  | 'unknown'

export type ParsedUserCommand = {
  rawText: string
  firstIntentText: string
  followupText: string | null
  kind: CommandIntentKind
  mentionsCore: boolean
  isMultiIntent: boolean
}

export type DraftGoalCandidate = {
  id: string
  title: string
  reason: 'main_path' | 'recent_active' | 'text_match'
}

export type CommandDraftStatus = 'execute_now' | 'need_confirmation' | 'not_ready'

export type CommandPrimaryAction =
  | {
      type: 'commit'
      label: string
      href: null
    }
  | {
      type: 'navigate'
      label: string
      href: string
    }
  | {
      type: 'confirm'
      label: string
      href: null
    }

export type CommandTopOpenAction = {
  id: string
  title: string
  goalTitle: string | null
  isCore: boolean
}

export type CommandDraft = {
  rawText: string
  firstIntentText: string
  followupText: string | null
  kind: CommandIntentKind
  status: CommandDraftStatus
  needsGoalConfirmation: boolean
  goalCandidates: DraftGoalCandidate[]
  suggestedActionTitle: string | null
  suggestedGoalId: string | null
  naturalReply: string
  nextStepLabel: string
  primaryAction: CommandPrimaryAction | null
  changes: Array<{
    label: string
    value: string
    status: 'draft' | 'executed'
  }>
}
