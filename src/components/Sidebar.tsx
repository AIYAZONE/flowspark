'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarCheck, LayoutDashboard, Loader2, LogOut, Sparkles, Target, User, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '@/components/BrandLogo'

interface SidebarProps {
  dict: {
    sidebar: {
      dashboard: string
      today: string
      goals: string
      potential: string
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
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)

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

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <div
      className={cn(
        'hidden h-full w-[94px] shrink-0 flex-col border-r border-border/60 bg-background/95 text-foreground backdrop-blur-xl md:flex'
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-border/50 px-1.5">
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl p-1 text-primary transition-transform duration-200 hover:scale-[1.02]"
        >
          <span className="inline-flex scale-[1.18] items-center justify-center">
            <BrandMark />
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-3">
        <nav className="flex flex-col items-center gap-2">
          {sidebarItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'group flex w-full max-w-[66px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-center transition-all duration-200',
                  isActive
                    ? 'bg-primary/8 text-primary ring-1 ring-primary/12'
                    : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-200',
                    isActive ? 'scale-105 text-primary' : 'text-muted-foreground group-hover:scale-105 group-hover:text-foreground'
                  )}
                  strokeWidth={isActive ? 2.1 : 1.85}
                />
                <span
                  className={cn(
                    'line-clamp-2 text-[10px] font-medium leading-3.5',
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

      <div className="border-t border-border/50 px-1 py-3">
        <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mx-auto flex h-[54px] w-full max-w-[66px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 text-muted-foreground hover:bg-muted/55 hover:text-foreground"
              disabled={isSigningOut}
              aria-label={dict.sidebar.signOut}
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 shrink-0" />
              )}
              <span className="text-[10px] font-medium leading-3.5">退出</span>
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent className="max-w-lg">
            <button
              type="button"
              aria-label={dict.common.cancel}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setSignOutOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <AlertDialogHeader>
              <AlertDialogTitle>{dict.common.signOutConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{dict.common.signOutConfirmDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSigningOut}>{dict.common.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isSigningOut}
              >
                {isSigningOut && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {dict.sidebar.signOut}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
