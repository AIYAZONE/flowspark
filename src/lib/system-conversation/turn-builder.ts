import type { SystemDraftResponse, SystemTurn } from './types.ts'

export function createSystemTurnId() {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function buildTurnFromDraftResponse({
  sourcePage,
  userText,
  draftResponse,
}: {
  sourcePage: SystemTurn['sourcePage']
  userText: string
  draftResponse: SystemDraftResponse
}): SystemTurn {
  const base = {
    id: createSystemTurnId(),
    createdAt: new Date().toISOString(),
    sourcePage,
    userText,
    traceId: undefined,
  } satisfies Pick<SystemTurn, 'id' | 'createdAt' | 'sourcePage' | 'userText' | 'traceId'>

  if (draftResponse.status === 'executable') {
    return {
      ...base,
      state: 'responded.execute',
      tag: '系统判断',
      judgement: draftResponse.judgement,
      reason: draftResponse.reason,
      nextStep: draftResponse.nextStep,
      primaryAction: draftResponse.primaryAction,
    }
  }

  if (draftResponse.status === 'need_confirmation') {
    return {
      ...base,
      state: 'responded.confirm',
      tag: '需要确认',
      judgement: draftResponse.judgement,
      reason: draftResponse.reason,
      nextStep: draftResponse.nextStep,
      primaryAction: { kind: 'confirm', draftId: draftResponse.draftId, label: '确认写入' },
    }
  }

  if (draftResponse.status === 'need_more_info') {
    return {
      ...base,
      state: 'responded.clarify',
      tag: '需要澄清',
      judgement: draftResponse.judgement,
      reason: draftResponse.reason,
      nextStep: draftResponse.question,
      primaryAction: {
        kind: 'focusInput',
        label: draftResponse.actionLabel || '继续补充',
        prefill: draftResponse.prefill,
      },
    }
  }

  return {
    ...base,
    state: 'degraded',
    tag: '降级理解',
    judgement: draftResponse.judgement,
    reason: draftResponse.reason,
    nextStep: draftResponse.nextStep,
    primaryAction: {
      kind: 'focusInput',
      label: draftResponse.actionLabel || '按这个继续',
      prefill: draftResponse.prefill,
    },
  }
}
