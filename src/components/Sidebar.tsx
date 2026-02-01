'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, CalendarCheck, User, LogOut, ChevronLeft, ChevronRight, Aperture, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function SidebarFloatingTooltip({ label, top, left }: { label: string; top: number; left: number }) {
  const mounted = typeof document !== 'undefined'
  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed z-[100]" style={{ top, left }}>
      <div className="relative -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-100">
        {label}
        <div className="absolute left-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-border bg-popover" />
      </div>
    </div>,
    document.body
  )
}

import { BrandMark } from "@/components/BrandLogo"

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
  const supabase = useMemo(() => createClient(), [])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null)
  const [xp, setXp] = useState<number | null>(null)
  const [level, setLevel] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active || !user) return
      const { data, error } = await supabase
        .from('user_profiles')
        .select('xp, level')
        .eq('id', user.id)
        .single()
      if (!active || error) return
      setXp(typeof data?.xp === 'number' ? data.xp : 0)
      setLevel(typeof data?.level === 'number' ? data.level : 1)
    }

    load()
    return () => {
      active = false
    }
  }, [supabase])

  const showTooltip = (label: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    })
  }

  const hideTooltip = () => setTooltip(null)

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
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <div
      className={cn(
        "hidden md:flex h-full flex-col border-r border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute -right-3 top-1/2 z-50 h-8 w-8 -translate-y-1/2 rounded-full border-border/60 bg-background p-0 shadow-sm hover:bg-muted"
        onClick={() => {
          setTooltip(null)
          setIsCollapsed(v => !v)
        }}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <ChevronRight className="block h-4 w-4" /> : <ChevronLeft className="block h-4 w-4" />}
      </Button>

      <div className={cn(
        "flex h-16 items-center border-b border-border/40 px-4",
        isCollapsed ? "justify-center" : "px-6"
      )}>
        <Link
          href="/"
          className={cn(
            "flex items-center font-bold text-lg tracking-tight text-primary whitespace-nowrap",
            isCollapsed ? "justify-center" : "gap-2"
          )}
        >
          <BrandMark />
          {!isCollapsed && <span className="truncate max-w-40">{dict.sidebar.brand}</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4" onScroll={() => setTooltip(null)}>
        <nav className="grid items-start px-2 text-sm font-medium gap-1">
          {sidebarItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={index}
                href={item.href}
                prefetch={false}
                className={cn(
                  "group relative flex items-center rounded-md transition-all duration-200",
                  isCollapsed ? "mx-auto h-10 w-12 justify-center" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onMouseEnter={(e) => {
                  if (!isCollapsed) return
                  showTooltip(item.title, e.currentTarget)
                }}
                onMouseLeave={hideTooltip}
                onClick={hideTooltip}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={1.5}
                />
                {!isCollapsed && <span className="whitespace-nowrap">{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border/40 p-2 space-y-2">
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="group relative mx-auto h-10 w-12 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleSignOut}
            disabled={isSigningOut}
            onMouseEnter={(e) => showTooltip(dict.sidebar.signOut, e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 px-4 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
            <span className="whitespace-nowrap">{dict.sidebar.signOut}</span>
          </Button>
        )}
      </div>

      {isCollapsed && tooltip && (
        <SidebarFloatingTooltip label={tooltip.label} top={tooltip.top} left={tooltip.left} />
      )}
    </div>
  )
}
