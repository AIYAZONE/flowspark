'use client'

import { useEffect } from 'react'
import { logEvent } from '@/lib/analytics'
import { sendAIFeedback } from '@/lib/aiFeedback'

interface RescueEntryTrackerProps {
  actionId?: string | null
  source?: 'today' | 'dashboard'
  entry?: 'streak_banner' | 'continuity_priority' | 'direct'
}

export function RescueEntryTracker(props: RescueEntryTrackerProps) {
  const { actionId = null, source = 'today', entry = 'direct' } = props

  useEffect(() => {
    if (typeof window === 'undefined') return

    const dedupeKey = `rescue-entry:${window.location.pathname}${window.location.search}`
    if (window.sessionStorage.getItem(dedupeKey) === '1') return
    window.sessionStorage.setItem(dedupeKey, '1')

    const payload = {
      source,
      scene: 'rescue',
      entry,
      target_action_id: actionId,
    }

    logEvent('ai_rescue_click', payload)
    sendAIFeedback('ai_rescue_click', payload)
  }, [actionId, entry, source])

  return null
}
