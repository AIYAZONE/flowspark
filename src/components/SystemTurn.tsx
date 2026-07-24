'use client'

import type { SystemTurn as SystemTurnType } from '@/lib/system-conversation/types'
import { SystemUserMessage } from '@/components/SystemUserMessage'
import { SystemMessage } from '@/components/SystemMessage'

export function SystemTurn(props: {
  turn: SystemTurnType
  onConfirm?: (draftId: string) => void
  onFocusInput?: (prefill?: string) => void
}) {
  return (
    <div className="space-y-3">
      <SystemUserMessage text={props.turn.userText} />
      <SystemMessage turn={props.turn} onConfirm={props.onConfirm} onFocusInput={props.onFocusInput} />
    </div>
  )
}
