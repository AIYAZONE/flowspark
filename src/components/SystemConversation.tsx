'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useSystemConversation } from '@/lib/system-conversation/store'
import { SystemTurn } from '@/components/SystemTurn'

export function SystemConversation(props: {
  className?: string
  onConfirm?: (draftId: string) => void
  onFocusInput?: (prefill?: string) => void
  emptyState?: ReactNode
}) {
  const { turnsVisible } = useSystemConversation()
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [turnsVisible])

  return (
    <div
      className={[
        'mx-auto w-full max-w-3xl',
        props.className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {turnsVisible.length ? (
        <div className="space-y-8 px-1 pb-4 pt-2 md:px-2">
          {turnsVisible.map((turn) => (
            <SystemTurn key={turn.id} turn={turn} onConfirm={props.onConfirm} onFocusInput={props.onFocusInput} />
          ))}
          <div ref={endRef} />
        </div>
      ) : props.emptyState ? (
        <div className="flex min-h-96 items-center justify-center">{props.emptyState}</div>
      ) : null}
    </div>
  )
}
