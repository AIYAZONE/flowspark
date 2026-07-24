'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, CalendarCheck, User, Lightbulb, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOBILE_ONLY_CLASS } from '@/components/responsive-classes'

interface MobileNavBarProps {
  dict: {
    sidebar: {
      chat: string
      dashboard: string
      today: string
      goals: string
      inbox: string
      profile: string
    }
  }
}

export function MobileNavBar({ dict }: MobileNavBarProps) {
  const pathname = usePathname()
  const [epoch, setEpoch] = useState(0)
  const [notificationUnread, setNotificationUnread] = useState<number>(0)

  const activeItemClass =
    'bg-linear-to-b from-primary/12 via-primary/8 to-primary/5 text-primary ring-1 ring-primary/16'

  const idleItemClass =
    'text-muted-foreground hover:bg-muted/45 hover:text-foreground'

  useEffect(() => {
    const onResume = () => setEpoch((v) => v + 1)
    window.addEventListener('app:resume', onResume)
    return () => window.removeEventListener('app:resume', onResume)
  }, [])

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
    return () => {
      mounted = false
    }
  }, [epoch])

  const isDebugNav = () => {
    try {
      return new URLSearchParams(window.location.search).has('debugNav')
    } catch {
      return false
    }
  }

  const navItems = [
    {
      title: dict.sidebar.chat,
      href: '/chat',
      icon: MessageSquare,
    },
    {
      title: dict.sidebar.dashboard,
      href: '/system',
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
    {
      title: dict.sidebar.profile,
      href: '/profile',
      icon: User,
    },
  ]

  return (
    <div
      key={epoch}
      className={`${MOBILE_ONLY_CLASS} shrink-0 bg-transparent px-3 pb-safe-area-inset-bottom pt-2`}
    >
      <div className="mx-auto max-w-xl rounded-[1.85rem] bg-linear-to-br from-primary/18 via-violet-500/10 to-sky-500/12 p-px shadow-lg shadow-black/5">
        <nav
          className="flex h-[72px] items-center justify-around rounded-[1.82rem] border border-white/10 bg-background/78 px-2 backdrop-blur-xl"
          onPointerDownCapture={(e) => {
            if (!isDebugNav()) return
            const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
            console.log('[debugNav] pointerdown', {
              x: e.clientX,
              y: e.clientY,
              targetTag: el?.tagName,
              targetId: el?.id,
              targetClass: el?.className,
            })
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const showUnreadDot = item.href === '/profile' && notificationUnread > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (!isDebugNav()) return
                  console.log('[debugNav] click', { href: item.href })
                }}
                className={cn(
                  'mx-0.5 flex h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200',
                  isActive ? activeItemClass : idleItemClass
                )}
              >
                <span className="relative">
                  <item.icon
                    className={cn(
                      'h-6 w-6 transition-all duration-200',
                      isActive ? 'scale-110 stroke-[2.25px]' : 'stroke-[1.75px]'
                    )}
                  />
                  {showUnreadDot ? (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                  ) : null}
                </span>
                <span className="text-[10px] font-medium">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
