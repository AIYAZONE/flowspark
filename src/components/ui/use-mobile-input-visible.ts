'use client'

import { RefObject, useEffect } from 'react'

export function useMobileInputVisible(
  open: boolean,
  inputRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!open) return
    const node = inputRef.current
    if (!node) return

    const timer = window.setTimeout(() => {
      node.focus()
      if (window.matchMedia('(max-width: 767px)').matches) {
        node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
      }
    }, 30)

    return () => window.clearTimeout(timer)
  }, [open, inputRef])
}
