'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Configuration
const TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 hours
const CHECK_INTERVAL_MS = 60 * 1000 // Check every 1 minute
const THROTTLE_MS = 30 * 1000 // Only update activity timestamp every 30 seconds
const STORAGE_KEY = 'last_activity_timestamp'

export function AutoLogout() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Clear local storage
      localStorage.removeItem(STORAGE_KEY)
      // Redirect to login with reason
      router.push('/login?error=session_expired')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [router, supabase])

  useEffect(() => {
    // Initialize timestamp if missing
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    }

    // Throttled activity updater
    let lastUpdate = Date.now()
    const updateActivity = () => {
      const now = Date.now()
      if (now - lastUpdate > THROTTLE_MS) {
        localStorage.setItem(STORAGE_KEY, now.toString())
        lastUpdate = now
      }
    }

    // Check for timeout
    const checkTimeout = () => {
      const lastActivity = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
      const now = Date.now()
      
      if (now - lastActivity > TIMEOUT_MS) {
        handleLogout()
      }
    }

    // Set up event listeners
    const events = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Set up periodic check
    const intervalId = setInterval(checkTimeout, CHECK_INTERVAL_MS)

    // Initial check
    checkTimeout()

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
      clearInterval(intervalId)
    }
  }, [handleLogout])

  return null
}
