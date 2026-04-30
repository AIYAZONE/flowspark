'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, CalendarCheck, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavBarProps {
  dict: {
    sidebar: {
      dashboard: string
      today: string
      goals: string
      potential: string
      profile: string
    }
  }
}

export function MobileNavBar({ dict }: MobileNavBarProps) {
  const pathname = usePathname()
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    const onResume = () => setEpoch((v) => v + 1)
    window.addEventListener('app:resume', onResume)
    return () => window.removeEventListener('app:resume', onResume)
  }, [])

  const isDebugNav = () => {
    try {
      return new URLSearchParams(window.location.search).has('debugNav')
    } catch {
      return false
    }
  }

  const navItems = [
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
      title: dict.sidebar.potential,
      href: '/potential',
      icon: Sparkles,
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
      className="md:hidden shrink-0 bg-background/80 backdrop-blur-lg border-t border-border/40 pb-safe-area-inset-bottom"
    >
      <nav
        className="flex items-center justify-around h-16 px-2"
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
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (!isDebugNav()) return
                console.log('[debugNav] click', { href: item.href })
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isActive ? "scale-110 stroke-[2.5px]" : "stroke-[1.5px]"
                )}
              />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
