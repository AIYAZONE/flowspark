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
        'hidden h-full shrink-0 flex-col border-r border-border/40 bg-linear-to-b from-background via-background/95 to-muted/20 text-foreground backdrop-blur-xl md:flex md:w-[108px] xl:w-[118px] 2xl:w-[126px] [@media(min-width:1920px)]:w-[134px] [@media(min-width:2560px)]:w-[142px]'
      )}
    >
      <div className="flex h-[92px] flex-col items-center justify-center gap-2 border-b border-border/40 px-2 xl:h-[104px] 2xl:h-[112px]">
        <Link
          href="/"
          className="flex items-center justify-center rounded-2xl border border-primary/15 bg-primary/6 p-2 text-primary transition-transform duration-200 hover:scale-[1.02] xl:p-2.5"
        >
          <span className="inline-flex scale-[1.05] items-center justify-center xl:scale-[1.12] 2xl:scale-[1.18]">
            <BrandMark />
          </span>
        </Link>
        <div className="text-center">
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-primary/80 xl:text-[10px]">
            Life OS
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground xl:text-[11px]">
            FlowSpark
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 xl:px-2.5 xl:py-4.5 2xl:px-3 [@media(min-width:1920px)]:px-3.5">
        <div className="mb-3 text-center text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground xl:text-[10px]">
          Core
        </div>
        <nav className="flex flex-col items-center gap-2.5 xl:gap-3 2xl:gap-3.5">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'group flex w-full max-w-[78px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-3 text-center transition-all duration-200 xl:max-w-[84px] xl:gap-2 xl:px-2 xl:py-3 2xl:max-w-[90px] 2xl:gap-2.5 2xl:px-2.5 2xl:py-3.5 [@media(min-width:1920px)]:max-w-[96px]',
                  isActive
                    ? 'bg-linear-to-b from-primary/12 to-primary/5 text-primary ring-1 ring-primary/15 shadow-sm shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground hover:ring-1 hover:ring-border/40'
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

      <div className="border-t border-border/40 px-2 py-4 xl:px-2.5 xl:py-4.5 2xl:px-3 [@media(min-width:1920px)]:px-3.5">
        <div className="mb-3 text-center text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground xl:text-[10px]">
          Identity
        </div>
        {(() => {
          const isActive = pathname.startsWith('/profile')
          const showUnreadDot = notificationUnread > 0
          return (
            <Link
              href="/profile"
              prefetch={false}
              className={cn(
                'group mx-auto flex h-[62px] w-full max-w-[78px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 text-center transition-all duration-200 xl:h-[68px] xl:max-w-[84px] xl:gap-2 xl:px-2 2xl:h-[74px] 2xl:max-w-[90px] 2xl:gap-2.5 2xl:px-2.5 [@media(min-width:1920px)]:h-[80px] [@media(min-width:1920px)]:max-w-[96px]',
                isActive
                  ? 'bg-linear-to-b from-primary/12 to-primary/5 text-primary ring-1 ring-primary/15 shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground hover:ring-1 hover:ring-border/40'
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
