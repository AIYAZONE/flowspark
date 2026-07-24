'use client'

import Link from 'next/link'
import type { SystemTurn } from '@/lib/system-conversation/types'
import { Button } from '@/components/ui/button'

function dispatchFocusCommandBar(prefill?: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('flowspark:focus-command-bar', { detail: { prefill } }))
}

export function SystemMessage(props: {
  turn: SystemTurn
  onConfirm?: (draftId: string) => void
  onFocusInput?: (prefill?: string) => void
}) {
  const action = props.turn.primaryAction
  const isSpecial =
    props.turn.state === 'responded.clarify' ||
    props.turn.state === 'responded.confirm' ||
    props.turn.state === 'degraded'
  const showReason = isSpecial && Boolean(props.turn.reason)
  const showNextStep = isSpecial && Boolean(props.turn.nextStep)
  const actionNode =
    action?.kind === 'link' ? (
      <Button asChild size="sm" className="h-8 rounded-full px-3">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    ) : action?.kind === 'confirm' ? (
      <Button
        type="button"
        size="sm"
        className="h-8 rounded-full px-3"
        onClick={() => props.onConfirm?.(action.draftId)}
        disabled={!props.onConfirm}
      >
        {action.label}
      </Button>
    ) : action?.kind === 'focusInput' ? (
      <Button
        type="button"
        size="sm"
        className="h-8 rounded-full px-3"
        onClick={() => (props.onFocusInput ? props.onFocusInput(action.prefill) : dispatchFocusCommandBar(action.prefill))}
      >
        {action.label}
      </Button>
    ) : null

  return (
    <div
      className={[
        'max-w-[44rem] rounded-[1.35rem] px-4 py-3.5 md:px-5',
        isSpecial
          ? 'border border-primary/12 bg-primary/[0.04] shadow-[0_10px_26px_-24px_rgba(15,23,42,0.28)]'
          : 'border border-border/22 bg-background/62 shadow-[0_10px_26px_-24px_rgba(15,23,42,0.18)]',
      ].join(' ')}
    >
      {isSpecial ? (
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-primary/12 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary/85">
            {props.turn.tag}
          </div>
          {actionNode ? <div className="shrink-0">{actionNode}</div> : null}
        </div>
      ) : null}
      <div className={isSpecial ? 'mt-3 space-y-3' : 'space-y-2.5'}>
        <div className="text-sm font-medium leading-6 tracking-tight text-foreground md:text-[15px]">
          {props.turn.judgement}
        </div>
        {!isSpecial && props.turn.nextStep ? (
          <div className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {props.turn.nextStep}
          </div>
        ) : null}
        {!isSpecial && actionNode ? <div className="pt-1">{actionNode}</div> : null}
        {showReason ? (
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/90">原因</div>
            <div className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{props.turn.reason}</div>
          </div>
        ) : null}
        {showNextStep ? (
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">下一步</div>
            <div className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{props.turn.nextStep}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
