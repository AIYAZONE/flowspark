'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, ClipboardCheck, LayoutDashboard, Lightbulb, MessageSquare, Target, User, Brain, Megaphone } from 'lucide-react'

import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/BrandLogo'

interface SidebarProps {
  dict: {
    sidebar: {
      dashboard: string
      chat: string
      today: string
      goals: string
      review: string
      notifications: string
      inbox: string
      profile: string
      persona: string
      brandStudio: string
      groups: {
        core: string
        identity: string
      }
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

type Density = 'comfortable' | 'compact' | 'mini' | 'icon'

// 基于视口高度的初始档位估计；layout 校正后可能进一步降到更小档，确保不裁切。
const H_COMFORT = 780
const H_COMPACT = 640
const H_MINI = 520
const HYS = 24 // 滞回带宽：升档需更高阈值

function nextDensityByViewport(prev: Density, h: number): Density {
  switch (prev) {
    case 'comfortable':
      if (h < H_COMFORT - HYS) return h < H_COMPACT - HYS ? (h < H_MINI - HYS ? 'icon' : 'mini') : 'compact'
      return 'comfortable'
    case 'compact':
      if (h >= H_COMFORT + HYS) return 'comfortable'
      if (h < H_COMPACT - HYS) return h < H_MINI - HYS ? 'icon' : 'mini'
      return 'compact'
    case 'mini':
      if (h >= H_COMPACT + HYS) return 'compact'
      if (h < H_MINI - HYS) return 'icon'
      return 'mini'
    case 'icon':
      if (h >= H_MINI + HYS) return 'mini'
      return 'icon'
  }
}

const ORDER: Density[] = ['comfortable', 'compact', 'mini', 'icon']
function downgrade(d: Density): Density {
  const i = ORDER.indexOf(d)
  return i < ORDER.length - 1 ? ORDER[i + 1] : d
}

export function Sidebar({ dict }: SidebarProps) {
  const pathname = usePathname()
  const [notificationUnread, setNotificationUnread] = useState<number>(0)
  const [density, setDensity] = useState<Density>('comfortable')
  const navRef = useRef<HTMLElement>(null)
  const midRef = useRef<HTMLDivElement>(null)

  const activeItemClass =
    'bg-linear-to-b from-primary/12 via-primary/8 to-primary/5 text-primary ring-1 ring-primary/16 shadow-sm shadow-primary/10'

  const idleItemClass =
    'text-muted-foreground hover:bg-muted/45 hover:text-foreground hover:ring-1 hover:ring-border/40'

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

  // 视口驱动初始档位（粗选），不测中部避免反馈循环。
  useEffect(() => {
    function apply() {
      setDensity((prev) => nextDensityByViewport(prev, window.innerHeight))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  // 实测校正：apply 档位后若 nav 渲染高度 > 中部可用 → 单向降到下一档。
  // 不回升，避免反馈循环。视觉保证零裁切。
  useLayoutEffect(() => {
    const nav = navRef.current
    const mid = midRef.current
    if (!nav || !mid) return
    const midH = mid.clientHeight
    const navH = nav.scrollHeight
    if (navH > midH) {
      setDensity((prev) => downgrade(prev))
    }
    // 仅依赖 density；midRef/navRef 稳定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density])

  const sidebarItems = [
    { title: dict.sidebar.chat, href: '/chat', icon: MessageSquare },
    { title: dict.sidebar.dashboard, href: '/system', icon: LayoutDashboard },
    { title: dict.sidebar.today, href: '/today', icon: CalendarCheck },
    { title: dict.sidebar.goals, href: '/goals', icon: Target },
    { title: dict.sidebar.review, href: '/review', icon: ClipboardCheck },
    { title: dict.sidebar.inbox, href: '/inbox', icon: Lightbulb },
    { title: dict.sidebar.persona, href: '/persona', icon: Brain },
    { title: dict.sidebar.brandStudio, href: '/brand-studio', icon: Megaphone },
  ]

  // 导航图标尺寸按档位收敛
  const iconSizeCls =
    density === 'comfortable'
      ? 'h-5 w-5 xl:h-[22px] xl:w-[22px] 2xl:h-6 2xl:w-6'
      : density === 'compact'
        ? 'h-[18px] w-[18px] xl:h-5 xl:w-5'
        : 'h-4 w-4 xl:h-[18px] xl:w-[18px]'

  return (
    <div
      className={cn(
        'hidden h-full shrink-0 flex-col md:flex md:w-[108px] xl:w-[118px] 2xl:w-[126px] [@media(min-width:1920px)]:w-[134px] [@media(min-width:2560px)]:w-[142px]',
        'bg-linear-to-b from-primary/18 via-violet-500/10 to-sky-500/12 p-px'
      )}
    >
      <div className="flex h-full w-full flex-col border-r border-white/8 bg-background/75 text-foreground backdrop-blur-xl">
        {/* 头部品牌 */}
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-b border-white/8 px-2 py-3 xl:py-4 2xl:py-5">
          <Link
            href="/"
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/3 p-2 text-primary backdrop-blur-sm transition-transform duration-200 hover:scale-[1.02] xl:p-2.5"
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

        {/* 中部：分组标题 + 7 项导航。data-density 驱动 CSS 精确控制 padding/gap/字号。*/}
        <div
          ref={midRef}
          data-density={density}
          className="sidebar-middle flex min-h-0 flex-1 flex-col items-stretch overflow-hidden px-2 xl:px-2.5 2xl:px-3"
        >
          <div className="sidebar-group-label relative mb-2 flex shrink-0 items-center justify-center text-[8px] font-medium uppercase tracking-[0.28em] text-muted-foreground/55 before:mr-2 before:h-px before:flex-1 before:bg-border/50 after:ml-2 after:h-px after:flex-1 after:bg-border/50 xl:text-[9px]">
            {dict.sidebar.groups.core}
          </div>
          <nav ref={navRef} className="sidebar-nav flex min-h-0 w-full flex-col items-stretch overflow-hidden">
            {sidebarItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  title={item.title}
                  className={cn(
                    'group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 text-center transition-all duration-200 xl:gap-2 xl:px-2 2xl:gap-2.5 2xl:px-2.5',
                    isActive ? activeItemClass : idleItemClass
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={cn(
                      'shrink-0 transition-all duration-200',
                      iconSizeCls,
                      isActive
                        ? 'scale-105 text-primary'
                        : 'text-muted-foreground group-hover:scale-105 group-hover:text-foreground'
                    )}
                    strokeWidth={isActive ? 2.1 : 1.85}
                  />
                  <span
                    className={cn(
                      'sidebar-label line-clamp-2 font-medium',
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

        {/* 底部：自我组 */}
        <div
          data-density={density}
          className="sidebar-foot shrink-0 border-t border-white/8 px-2 xl:px-2.5 2xl:px-3"
        >
          <div className="sidebar-group-label relative mb-2 flex items-center justify-center text-[8px] font-medium uppercase tracking-[0.28em] text-muted-foreground/55 before:mr-2 before:h-px before:flex-1 before:bg-border/50 after:ml-2 after:h-px after:flex-1 after:bg-border/50 xl:text-[9px]">
            {dict.sidebar.groups.identity}
          </div>
          {(() => {
            const isActive = pathname.startsWith('/profile')
            const showUnreadDot = notificationUnread > 0
            return (
              <Link
                href="/profile"
                prefetch={false}
                title={dict.sidebar.profile}
                className={cn(
                  'group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 text-center transition-all duration-200 xl:gap-2 xl:px-2 2xl:gap-2.5 2xl:px-2.5',
                  isActive ? activeItemClass : idleItemClass
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="relative">
                  <User
                    className={cn(
                      'shrink-0 transition-all duration-200',
                      iconSizeCls,
                      isActive
                        ? 'scale-105 text-primary'
                        : 'text-muted-foreground group-hover:scale-105 group-hover:text-foreground'
                    )}
                    strokeWidth={isActive ? 2.1 : 1.85}
                  />
                  {showUnreadDot ? (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    'sidebar-label line-clamp-2 font-medium',
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
    </div>
  )
}