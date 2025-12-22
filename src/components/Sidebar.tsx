'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, CalendarCheck, User, LogOut } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  dict: {
    sidebar: {
      dashboard: string
      today: string
      goals: string
      profile: string
      brand: string
      signOut: string
    }
  }
}

export function Sidebar({ dict }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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
      title: dict.sidebar.profile,
      href: '/profile',
      icon: User,
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="flex h-16 items-center border-b border-border/40 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
          <Target className="h-6 w-6" strokeWidth={2} />
          <span>{dict.sidebar.brand}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-3 text-sm font-medium gap-1">
          {sidebarItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={index}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon 
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                  strokeWidth={1.5} 
                />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t border-border/40 p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-muted" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          {dict.sidebar.signOut}
        </Button>
      </div>
    </div>
  )
}
