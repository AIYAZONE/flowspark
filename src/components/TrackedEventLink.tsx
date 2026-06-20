'use client'

import type { MouseEvent, ReactNode } from 'react'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'

interface TrackedEventLinkProps {
  href: string
  eventName: string
  payload?: Record<string, string | number | boolean | null>
  className?: string
  children: ReactNode
}

export function TrackedEventLink(props: TrackedEventLinkProps) {
  const { href, eventName, payload, className, children } = props

  return (
    <a
      href={href}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault()
        logEvent(eventName, payload)
        sendAIFeedback(eventName, payload)
        window.setTimeout(() => {
          window.location.href = href
        }, 80)
      }}
    >
      {children}
    </a>
  )
}
