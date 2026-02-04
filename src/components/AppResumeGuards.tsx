'use client'

import { useEffect } from 'react'

export function AppResumeGuards() {
  useEffect(() => {
    const run = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState && document.visibilityState !== 'visible') return

      const hasOpenPortal = !!document.querySelector('[data-radix-portal] [data-state="open"]')
      if (hasOpenPortal) {
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            bubbles: true,
            cancelable: true,
          })
        )
        document.dispatchEvent(
          new KeyboardEvent('keyup', {
            key: 'Escape',
            code: 'Escape',
            bubbles: true,
            cancelable: true,
          })
        )
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }

      window.dispatchEvent(new Event('app:resume'))
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      run()
    }

    window.addEventListener('pageshow', run)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pageshow', run)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}
