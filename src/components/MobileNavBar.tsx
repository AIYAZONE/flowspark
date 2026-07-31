'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarCheck,
  ClipboardCheck,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  Target,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOBILE_ONLY_CLASS } from '@/components/responsive-classes'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface MobileNavBarProps {
  dict: {
    sidebar: {
      chat: string
      dashboard: string
      today: string
      goals: string
      review: string
      inbox: string
      profile: string
      more: string
    }
  }
}

// 常驻 4 个高频项（核心日循环：对话 → 今日 → 目标 → 灵感）；
// 其余入口（周回顾 / 面板 / 自我）收进「更多」抽屉。调整顺序或取舍改这里即可。
const PRIMARY_ITEMS = [
  { titleKey: 'chat' as const, href: '/chat', icon: MessageSquare },
  { titleKey: 'today' as const, href: '/today', icon: CalendarCheck },
  { titleKey: 'goals' as const, href: '/goals', icon: Target },
  { titleKey: 'inbox' as const, href: '/inbox', icon: Lightbulb },
]

const SECONDARY_ITEMS = [
  { titleKey: 'review' as const, href: '/review', icon: ClipboardCheck },
  { titleKey: 'dashboard' as const, href: '/system', icon: LayoutDashboard },
  { titleKey: 'profile' as const, href: '/profile', icon: User },
]

export function MobileNavBar({ dict }: MobileNavBarProps) {
  const pathname = usePathname()
  const [epoch, setEpoch] = useState(0)
  const [notificationUnread, setNotificationUnread] = useState<number>(0)
  const [moreOpen, setMoreOpen] = useState(false)

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

  const moreActive = SECONDARY_ITEMS.some((i) => pathname.startsWith(i.href))
  const showUnreadDot = notificationUnread > 0

  return (
    <div
      key={epoch}
      className={`${MOBILE_ONLY_CLASS} relative z-50 shrink-0 bg-transparent px-3 pb-safe-area-inset-bottom pt-2`}
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
          {PRIMARY_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
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
                <Icon
                  className={cn(
                    'h-6 w-6 transition-all duration-200',
                    isActive ? 'scale-110 stroke-[2.25px]' : 'stroke-[1.75px]'
                  )}
                />
                <span className="text-[10px] font-medium">{dict.sidebar[item.titleKey]}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label={dict.sidebar.more}
            aria-haspopup="dialog"
            className={cn(
              'mx-0.5 flex h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200',
              moreActive ? activeItemClass : idleItemClass
            )}
          >
            <span className="relative">
              <MoreHorizontal
                className={cn(
                  'h-6 w-6 transition-all duration-200',
                  moreActive ? 'scale-110 stroke-[2.25px]' : 'stroke-[1.75px]'
                )}
              />
              {showUnreadDot ? (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              ) : null}
            </span>
            <span className="text-[10px] font-medium">{dict.sidebar.more}</span>
          </button>
        </nav>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[1.85rem] border-t border-white/10 bg-linear-to-br from-primary/18 via-violet-500/10 to-sky-500/12 p-px"
        >
          <div className="flex max-h-[80dvh] min-h-0 flex-col rounded-t-[1.82rem] bg-background/82 backdrop-blur-xl">
            <div className="flex flex-col items-center pt-2">
              <span className="h-1.5 w-10 rounded-full bg-border/60" />
            </div>
            <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
              <SheetTitle className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {dict.sidebar.more}
              </SheetTitle>
              <nav className="grid gap-1.5">
                {SECONDARY_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  const showDot = item.href === '/profile' && showUnreadDot
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex items-center gap-3.5 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/45 hover:text-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-all duration-200',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                        strokeWidth={isActive ? 2.1 : 1.85}
                      />
                      <span className="flex-1">{dict.sidebar[item.titleKey]}</span>
                      {showDot ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                      ) : null}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
