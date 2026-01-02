'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, CalendarCheck, User, LogOut, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'

interface MobileSidebarProps {
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

export function MobileSidebar({ dict }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden -ml-2">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0 flex flex-col">
        <SheetTitle className="sr-only">{dict.sidebar.brand}</SheetTitle>
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary"
            onClick={() => setOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="0.5" y="0.5" width="35" height="35" rx="11.5" fill="rgba(5,148,103,0.1)" stroke="rgba(5,148,103,0.2)"
                strokeWidth="1" />
              <svg x="8" y="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059467" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m14.31 8 5.74 9.94"></path>
                <path d="M9.69 8h11.48"></path>
                <path d="m7.38 12 5.74-9.94"></path>
                <path d="M9.69 16 3.95 6.06"></path>
                <path d="M14.31 16H2.83"></path>
                <path d="m16.62 12-5.74 9.94"></path>
              </svg>
            </svg>
            <span>{dict.sidebar.brand}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-2 text-sm font-medium">
            {sidebarItems.map((item, index) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 transition-all",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {dict.sidebar.signOut}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
