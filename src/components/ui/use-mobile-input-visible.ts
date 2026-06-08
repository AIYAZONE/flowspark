'use client'

import { RefObject, useEffect, useState } from 'react'

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

export function useMobileKeyboardInset(open: boolean) {
  const [keyboardInset, setKeyboardInset] = useState(0)

  useEffect(() => {
    if (!open || typeof window === 'undefined' || !window.visualViewport) {
      return
    }

    const vv = window.visualViewport
    const updateInset = () => {
      const inset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
      setKeyboardInset(inset)
    }

    updateInset()
    vv.addEventListener('resize', updateInset)
    vv.addEventListener('scroll', updateInset)

    return () => {
      vv.removeEventListener('resize', updateInset)
      vv.removeEventListener('scroll', updateInset)
    }
  }, [open])

  if (!open || typeof window === 'undefined' || !window.visualViewport) {
    return 0
  }

  return keyboardInset
}
