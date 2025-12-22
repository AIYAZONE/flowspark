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
    <div className="flex h-screen w-64 flex-col border-r bg-gray-50/40">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Target className="h-6 w-6" />
          <span>{dict.sidebar.brand}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {sidebarItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                pathname.startsWith(item.href)
                  ? "bg-gray-100 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          {dict.sidebar.signOut}
        </Button>
      </div>
    </div>
  )
}
