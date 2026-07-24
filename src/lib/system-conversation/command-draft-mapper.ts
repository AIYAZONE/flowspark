import type { CommandDraft } from '../command-bar/types.ts'
import type { SystemDraftResponse, SystemPrimaryAction } from './types.ts'

function buildReasonFromChanges(changes: CommandDraft['changes']) {
  return changes
    .map((c) => `${c.label}：${c.value}`)
    .filter(Boolean)
    .slice(0, 3)
    .join('；')
}

function mapPrimaryAction(params: {
  draft: CommandDraft
}): SystemPrimaryAction | null {
  const { draft } = params
  const action = draft.primaryAction
  if (!action) return null

  if (action.type === 'navigate' && action.href) {
    return { kind: 'link', label: action.label, href: action.href }
  }

  return { kind: 'focusInput', label: action.label, prefill: draft.firstIntentText }
}

export function mapCommandDraftToSystemDraftResponse(
  draft: CommandDraft,
): SystemDraftResponse {
  const judgement = draft.naturalReply
  const reason = buildReasonFromChanges(draft.changes)
  const nextStep = draft.nextStepLabel

  if (draft.status === 'execute_now') {
    return {
      status: 'executable',
      judgement,
      reason,
      nextStep,
      primaryAction:
        mapPrimaryAction({ draft }) ??
        ({ kind: 'focusInput', label: '继续', prefill: draft.firstIntentText } satisfies SystemPrimaryAction),
    }
  }

  if (draft.status === 'need_confirmation') {
    return {
      status: 'need_more_info',
      judgement,
      reason,
      nextStep,
      question: nextStep,
      prefill: draft.firstIntentText,
      actionLabel: draft.primaryAction?.label,
    }
  }

  return {
    status: 'not_ready',
    judgement,
    reason,
    nextStep,
    prefill: draft.firstIntentText,
    actionLabel: draft.primaryAction?.label,
  }
}
