'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export type ProfileTabKey = 'self' | 'incentives' | 'analytics' | 'settings'

function normalizeProfileTab(value: string | null | undefined): ProfileTabKey | null {
  if (!value) return null
  if (value === 'self') return 'self'
  if (value === 'incentives') return 'incentives'
  if (value === 'analytics') return 'analytics'
  if (value === 'settings') return 'settings'
  return null
}

export function ProfileTabs({
  initialTab,
  tabs,
}: {
  initialTab: ProfileTabKey
  tabs: Array<{
    key: ProfileTabKey
    label: string
    content: React.ReactNode
  }>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = useMemo(() => {
    return normalizeProfileTab(searchParams.get('tab')) || initialTab
  }, [initialTab, searchParams])

  function setTab(next: ProfileTabKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', next)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Profile tabs"
        className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-background/80 p-2 backdrop-blur-sm"
      >
        {tabs.map((tab) => {
          const selected = tab.key === activeTab
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setTab(tab.key)}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition',
                selected
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'border border-border/60 bg-background/85 text-muted-foreground hover:border-primary/35 hover:bg-primary/5 hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          hidden={tab.key !== activeTab}
          className={tab.key === activeTab ? 'block' : 'hidden'}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}

