'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, CalendarCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavBarProps {
  dict: {
    sidebar: {
      dashboard: string
      today: string
      goals: string
      profile: string
    }
  }
}

export function MobileNavBar({ dict }: MobileNavBarProps) {
  const pathname = usePathname()

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
      title: dict.sidebar.profile,
      href: '/profile',
      icon: User,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/40 pb-safe-area-inset-bottom">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
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
