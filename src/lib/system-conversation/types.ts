export type SystemTurnState =
  | 'submitting'
  | 'responded.execute'
  | 'responded.confirm'
  | 'responded.clarify'
  | 'done'
  | 'degraded'

export type SystemTurnTag = '系统判断' | '需要确认' | '需要澄清' | '已执行' | '降级理解'

export type SystemPrimaryAction =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'confirm'; label: string; draftId: string }
  | { kind: 'focusInput'; label: string; prefill?: string }

export type SystemDraftResponse =
  | {
      status: 'executable'
      judgement: string
      reason: string
      nextStep: string
      primaryAction: SystemPrimaryAction
    }
  | {
      status: 'need_confirmation'
      draftId: string
      judgement: string
      reason: string
      nextStep: string
    }
  | {
      status: 'need_more_info'
      question: string
      judgement: string
      reason: string
      nextStep: string
      prefill?: string
      actionLabel?: string
    }
  | {
      status: 'not_ready' | 'error'
      judgement: string
      reason: string
      nextStep: string
      prefill?: string
      actionLabel?: string
    }

export type SystemTurn = {
  id: string
  createdAt: string
  sourcePage: 'system' | 'today' | 'profile'
  userText: string
  state: SystemTurnState
  tag: SystemTurnTag
  judgement: string
  reason: string
  nextStep: string
  primaryAction: SystemPrimaryAction | null
  traceId?: string
}
