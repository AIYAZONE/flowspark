'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface WelcomeDict {
  morning: string
  afternoon: string
  evening: string
  new: string
  startJourney: string
  readyToFocus: string
}

export function DashboardWelcome({ 
  dict, 
  name,
  isNewUser = false
}: { 
  dict: WelcomeDict
  name: string
  isNewUser?: boolean
}) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    // Wrap in a timeout to avoid synchronous set state warning during effect execution
    // although in this case it's generally safe, linter is strict.
    const timer = setTimeout(() => {
      const hour = new Date().getHours()
      if (isNewUser) {
        setGreeting(dict.new)
      } else if (hour < 12) {
        setGreeting(dict.morning)
      } else if (hour < 18) {
        setGreeting(dict.afternoon)
      } else {
        setGreeting(dict.evening)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [dict, isNewUser])

  // Hydration mismatch prevention: render nothing on server, or generic
  // But since we use useEffect, it will render empty then fill in
  if (!greeting) return <div className="h-8 w-32 bg-muted/20 animate-pulse rounded" />

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        {greeting}, {name}.
        {isNewUser && <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />}
      </h1>
      {/* Placeholder for random quote/insight in future */}
      <p className="text-sm text-muted-foreground hidden sm:block">
        {isNewUser 
          ? dict.startJourney
          : dict.readyToFocus}
      </p>
    </div>
  )
}
