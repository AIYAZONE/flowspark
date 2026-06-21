'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, LayoutDashboard, Lightbulb, Target, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/BrandLogo'

interface SidebarProps {
  dict: {
    sidebar: {
      dashboard: string
      today: string
      goals: string
      notifications: string
      inbox: string
      profile: string
      brand: string
      signOut: string
    }
    common: {
      cancel: string
      signOutConfirmTitle: string
      signOutConfirmDesc: string
    }
  }
}

export function Sidebar({ dict }: SidebarProps) {
  const pathname = usePathname()
  const [notificationUnread, setNotificationUnread] = useState<number>(0)

  useEffect(() => {
    let mounted = true

    function isRecord(value: unknown): value is Record<string, unknown> {
      return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    }

    async function refreshCounts() {
      try {
        const res = await fetch('/api/notifications/counts', { cache: 'no-store' })
        const data = (await res.json()) as unknown
        if (!mounted) return
        if (!res.ok) {
          setNotificationUnread(0)
          return
        }
        if (isRecord(data) && typeof data.unread === 'number') {
          setNotificationUnread(Math.max(0, Math.trunc(data.unread)))
        }
      } catch {
        if (!mounted) return
        setNotificationUnread(0)
      }
    }

    void refreshCounts()
    const onResume = () => void refreshCounts()
    window.addEventListener('app:resume', onResume)
    const interval = window.setInterval(() => void refreshCounts(), 60_000)

    return () => {
      mounted = false
      window.removeEventListener('app:resume', onResume)
      window.clearInterval(interval)
    }
  }, [])

  const sidebarItems = [
    {
      title: dict.sidebar.dashboard,
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: dict.sidebar.today,
      href: '/today',
      icon: CalendarCheck,
    },
    {
      title: dict.sidebar.goals,
      href: '/goals',
      icon: Target,
    },
    {
      title: dict.sidebar.inbox,
      href: '/inbox',
      icon: Lightbulb,
    },
  ]

  return (
    <div
      className={cn(
        'hidden h-full shrink-0 flex-col border-r border-border/60 bg-background/95 text-foreground backdrop-blur-xl md:flex md:w-[94px] xl:w-[102px] 2xl:w-[112px] [@media(min-width:1920px)]:w-[120px] [@media(min-width:2560px)]:w-[128px]'
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-border/50 px-1.5 xl:h-[68px] xl:px-2 2xl:h-[72px] [@media(min-width:1920px)]:h-[76px] [@media(min-width:2560px)]:h-20">
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl p-1 text-primary transition-transform duration-200 hover:scale-[1.02] xl:p-1.5"
        >
          <span className="inline-flex scale-[1.18] items-center justify-center xl:scale-[1.22] 2xl:scale-[1.26] [@media(min-width:1920px)]:scale-[1.3] [@media(min-width:2560px)]:scale-[1.34]">
            <BrandMark />
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-3 xl:px-1.5 xl:py-3.5 2xl:px-2 2xl:py-4 [@media(min-width:1920px)]:px-2.5">
        <nav className="flex flex-col items-center gap-2 xl:gap-2.5 2xl:gap-3">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'group flex w-full max-w-[66px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-center transition-all duration-200 xl:max-w-[72px] xl:gap-2 xl:rounded-xl xl:px-1.5 xl:py-2.5 2xl:max-w-[78px] 2xl:gap-2.5 2xl:px-2 2xl:py-3 [@media(min-width:1920px)]:max-w-[84px] [@media(min-width:1920px)]:py-3.5 [@media(min-width:2560px)]:max-w-[88px]',
                  isActive
                    ? 'bg-primary/8 text-primary ring-1 ring-primary/12'
                    : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-200 xl:h-[22px] xl:w-[22px] 2xl:h-6 2xl:w-6 [@media(min-width:1920px)]:h-[26px] [@media(min-width:1920px)]:w-[26px] [@media(min-width:2560px)]:h-7 [@media(min-width:2560px)]:w-7',
                    isActive ? 'scale-105 text-primary' : 'text-muted-foreground group-hover:scale-105 group-hover:text-foreground'
                  )}
                  strokeWidth={isActive ? 2.1 : 1.85}
                />
                <span
                  className={cn(
                    'line-clamp-2 text-[10px] font-medium leading-3.5 xl:text-[11px] xl:leading-4 2xl:text-[11.5px] 2xl:leading-[1.05rem] [@media(min-width:1920px)]:text-xs [@media(min-width:1920px)]:leading-[1.1rem]',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {item.title}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border/50 px-1 py-3 xl:px-1.5 xl:py-3.5 2xl:px-2 2xl:py-4 [@media(min-width:1920px)]:px-2.5">
        {(() => {
          const isActive = pathname.startsWith('/profile')
          const showUnreadDot = notificationUnread > 0
          return (
            <Link
              href="/profile"
              prefetch={false}
              className={cn(
                'group mx-auto flex h-[54px] w-full max-w-[66px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 text-center transition-all duration-200 xl:h-[60px] xl:max-w-[72px] xl:gap-2 xl:rounded-xl xl:px-1.5 2xl:h-[66px] 2xl:max-w-[78px] 2xl:gap-2.5 2xl:px-2 [@media(min-width:1920px)]:h-[72px] [@media(min-width:1920px)]:max-w-[84px] [@media(min-width:2560px)]:h-[76px] [@media(min-width:2560px)]:max-w-[88px]',
                isActive
                  ? 'bg-primary/8 text-primary ring-1 ring-primary/12'
                  : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative">
                <User
                  className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-200 xl:h-[22px] xl:w-[22px] 2xl:h-6 2xl:w-6 [@media(min-width:1920px)]:h-[26px] [@media(min-width:1920px)]:w-[26px] [@media(min-width:2560px)]:h-7 [@media(min-width:2560px)]:w-7',
                    isActive ? 'scale-105 text-primary' : 'text-muted-foreground group-hover:scale-105 group-hover:text-foreground'
                  )}
                  strokeWidth={isActive ? 2.1 : 1.85}
                />
                {showUnreadDot ? (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                ) : null}
              </span>
              <span
                className={cn(
                  'line-clamp-2 text-[10px] font-medium leading-3.5 xl:text-[11px] xl:leading-4 2xl:text-[11.5px] 2xl:leading-[1.05rem] [@media(min-width:1920px)]:text-xs [@media(min-width:1920px)]:leading-[1.1rem]',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {dict.sidebar.profile}
              </span>
            </Link>
          )
        })()}
      </div>
    </div>
  )
}
