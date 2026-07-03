'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Bot, Lightbulb, Plus, Target } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type en from '@/i18n/en.json'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { AddActionDialog } from '@/components/AddActionDialog'
import { QuickCaptureDialog } from '@/components/QuickCaptureDialog'
import { AITodayPlanButton } from '@/components/AITodayPlanButton'
import { TABLET_AND_UP_CLASS } from '@/components/responsive-classes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clampPosition, snapToNearestSide, type FabPosition } from '@/components/desktop-quick-access-position'

type Dict = typeof en

const DESKTOP_QUICK_ACCESS_OPEN_KEY = 'desktop-quick-access-open-v1'
const DESKTOP_QUICK_ACCESS_EVENT = 'desktop-quick-access-open-change'
const DESKTOP_QUICK_ACCESS_FAB_POSITION_KEY = 'desktop-quick-access-fab-position-v1'
const EDGE_MARGIN = 12
const MENU_GAP = 12
const MENU_EDGE_MARGIN = 12
const DRAG_START_THRESHOLD = 8
const DEFAULT_RIGHT_INSET = 24
const DEFAULT_BOTTOM_INSET = 24
const BOTTOM_RESERVED_AREA = 24

function subscribeDesktopQuickAccess(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === DESKTOP_QUICK_ACCESS_OPEN_KEY) {
      onStoreChange()
    }
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(DESKTOP_QUICK_ACCESS_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(DESKTOP_QUICK_ACCESS_EVENT, onStoreChange)
  }
}

function getDesktopQuickAccessSnapshot() {
  return window.localStorage.getItem(DESKTOP_QUICK_ACCESS_OPEN_KEY) === '1'
}

function getDesktopQuickAccessServerSnapshot() {
  return false
}

function getViewportSize() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  }
}

export function DesktopQuickAccess({
  dict,
  activeGoals,
  tz,
  today,
}: {
  dict: Dict
  activeGoals: { id: string; title: string }[]
  tz: string
  today: string
}) {
  const open = useSyncExternalStore(
    subscribeDesktopQuickAccess,
    getDesktopQuickAccessSnapshot,
    getDesktopQuickAccessServerSnapshot
  )
  const pathname = usePathname()
  const showAddGoalEntry = pathname === '/goals' || pathname.startsWith('/goals/')
  const [fabPosition, setFabPosition] = useState<FabPosition | null>(null)
  const [dragging, setDragging] = useState(false)
  const [menuPlacement, setMenuPlacement] = useState<{ vertical: 'up' | 'down'; horizontal: 'start' | 'end' }>({
    vertical: 'up',
    horizontal: 'end',
  })
  const fabButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragStartRef = useRef<{ left: number; top: number; x: number; y: number }>({ left: 0, top: 0, x: 0, y: 0 })
  const pointerActiveRef = useRef(false)
  const ignoreClickRef = useRef(false)

  const setOpen = useCallback((nextOpen: boolean) => {
    window.localStorage.setItem(DESKTOP_QUICK_ACCESS_OPEN_KEY, nextOpen ? '1' : '0')
    window.dispatchEvent(new Event(DESKTOP_QUICK_ACCESS_EVENT))
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  const readAndClampFabPosition = useCallback(() => {
    const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
    const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
    const viewport = getViewportSize()
    const raw = window.localStorage.getItem(DESKTOP_QUICK_ACCESS_FAB_POSITION_KEY)
    if (!raw) {
      const next = clampPosition(
        {
          left: viewport.width - fabWidth - DEFAULT_RIGHT_INSET,
          top: viewport.height - fabHeight - DEFAULT_BOTTOM_INSET,
        },
        {
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
          fabWidth,
          fabHeight,
          edgeMargin: EDGE_MARGIN,
          bottomReservedArea: BOTTOM_RESERVED_AREA,
        }
      )
      setFabPosition(next)
      return
    }
    try {
      const parsed = JSON.parse(raw) as FabPosition
      const next = clampPosition(parsed, {
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        fabWidth,
        fabHeight,
        edgeMargin: EDGE_MARGIN,
        bottomReservedArea: BOTTOM_RESERVED_AREA,
      })
      setFabPosition(next)
    } catch {
      const next = clampPosition(
        {
          left: viewport.width - fabWidth - DEFAULT_RIGHT_INSET,
          top: viewport.height - fabHeight - DEFAULT_BOTTOM_INSET,
        },
        {
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
          fabWidth,
          fabHeight,
          edgeMargin: EDGE_MARGIN,
          bottomReservedArea: BOTTOM_RESERVED_AREA,
        }
      )
      setFabPosition(next)
    }
  }, [])

  const persistFabPosition = useCallback((position: FabPosition) => {
    window.localStorage.setItem(DESKTOP_QUICK_ACCESS_FAB_POSITION_KEY, JSON.stringify(position))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    readAndClampFabPosition()
  }, [readAndClampFabPosition])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!fabPosition) return
    const onResize = () => {
      const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
      const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
      const viewport = getViewportSize()
      setFabPosition((prev) =>
        prev
          ? clampPosition(prev, {
              viewportWidth: viewport.width,
              viewportHeight: viewport.height,
              fabWidth,
              fabHeight,
              edgeMargin: EDGE_MARGIN,
              bottomReservedArea: BOTTOM_RESERVED_AREA,
            })
          : prev
      )
    }
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
    }
  }, [fabPosition])

  useEffect(() => {
    if (!open) return

    const updateMenuPlacement = () => {
      const buttonRect = fabButtonRef.current?.getBoundingClientRect()
      const menuRect = menuRef.current?.getBoundingClientRect()
      if (!buttonRect || !menuRect) return

      const viewport = getViewportSize()
      const requiredHeight = menuRect.height + MENU_GAP + MENU_EDGE_MARGIN
      const canOpenUp = buttonRect.top >= requiredHeight
      const canOpenDown = viewport.height - buttonRect.bottom >= requiredHeight
      const vertical: 'up' | 'down' = !canOpenUp && canOpenDown ? 'down' : 'up'

      const canAlignEnd = buttonRect.right >= menuRect.width + MENU_EDGE_MARGIN
      const canAlignStart = viewport.width - buttonRect.left >= menuRect.width + MENU_EDGE_MARGIN
      const horizontal: 'start' | 'end' = !canAlignEnd && canAlignStart ? 'start' : 'end'

      setMenuPlacement({ vertical, horizontal })
    }

    const frameId = window.requestAnimationFrame(updateMenuPlacement)
    window.addEventListener('resize', updateMenuPlacement)
    window.visualViewport?.addEventListener('resize', updateMenuPlacement)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', updateMenuPlacement)
      window.visualViewport?.removeEventListener('resize', updateMenuPlacement)
    }
  }, [open, fabPosition])

  const wrapperStyle = useMemo(() => {
    if (fabPosition) {
      return { left: fabPosition.left, top: fabPosition.top }
    }
    return { right: DEFAULT_RIGHT_INSET, bottom: DEFAULT_BOTTOM_INSET }
  }, [fabPosition])

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    pointerActiveRef.current = true
    ignoreClickRef.current = false
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    const viewport = getViewportSize()
    const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
    const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
    const base = fabPosition
      ? fabPosition
      : clampPosition(
          {
            left: viewport.width - fabWidth - DEFAULT_RIGHT_INSET,
            top: viewport.height - fabHeight - DEFAULT_BOTTOM_INSET,
          },
          {
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            fabWidth,
            fabHeight,
            edgeMargin: EDGE_MARGIN,
            bottomReservedArea: BOTTOM_RESERVED_AREA,
          }
        )
    dragStartRef.current = { left: base.left, top: base.top, x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!pointerActiveRef.current) return
    const movedDistance = Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y)
    if (!dragging && movedDistance < DRAG_START_THRESHOLD) return

    if (!dragging) {
      ignoreClickRef.current = true
      setDragging(true)
      setOpen(false)
    }

    e.preventDefault()
    const viewport = getViewportSize()
    const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
    const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
    const next = clampPosition(
      {
        left: dragStartRef.current.left + (e.clientX - dragStartRef.current.x),
        top: dragStartRef.current.top + (e.clientY - dragStartRef.current.y),
      },
      {
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        fabWidth,
        fabHeight,
        edgeMargin: EDGE_MARGIN,
        bottomReservedArea: BOTTOM_RESERVED_AREA,
      }
    )
    setFabPosition(next)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    pointerActiveRef.current = false
    if (!dragging) return

    setDragging(false)
    const viewport = getViewportSize()
    const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
    const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
    setFabPosition((prev) => {
      if (!prev) return prev
      const snapped = snapToNearestSide(prev, { viewportWidth: viewport.width, fabWidth, edgeMargin: EDGE_MARGIN })
      const clamped = clampPosition(snapped, {
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        fabWidth,
        fabHeight,
        edgeMargin: EDGE_MARGIN,
        bottomReservedArea: BOTTOM_RESERVED_AREA,
      })
      persistFabPosition(clamped)
      return clamped
    })
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    pointerActiveRef.current = false
    ignoreClickRef.current = false
    setDragging(false)
  }

  function handleFabClick() {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false
      return
    }
    setOpen(!open)
  }

  const panelClassName = cn(
    'absolute z-10 w-[320px] rounded-3xl border border-border/60 bg-background/92 p-4 shadow-2xl backdrop-blur transition-[opacity,transform] duration-200',
    menuPlacement.vertical === 'up' ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]',
    menuPlacement.horizontal === 'end' ? 'right-0' : 'left-0',
    open ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
    !open && menuPlacement.vertical === 'up' && 'translate-y-2',
    !open && menuPlacement.vertical === 'down' && '-translate-y-2'
  )

  return (
    <>
      {open ? <div className={`fixed inset-0 z-30 ${TABLET_AND_UP_CLASS}`} onClick={() => setOpen(false)} /> : null}
      <div className={`fixed z-40 ${TABLET_AND_UP_CLASS}`} style={wrapperStyle}>
        <div className="relative">
          <div ref={menuRef} className={panelClassName} aria-hidden={!open}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{dict.quickCapture.fabLabel}</div>
                <div className="text-xs text-muted-foreground">Quick shortcuts</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary">
                  AI + Quick Actions
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setOpen(false)}
                  disabled={!open}
                >
                  <Plus className="h-4 w-4 rotate-45" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              {showAddGoalEntry ? (
                <AddGoalDialog
                  dict={dict}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start gap-2 rounded-2xl"
                      onClick={() => setOpen(false)}
                      disabled={!open}
                    >
                      <Target className="h-4 w-4" />
                      {dict.goals.newGoal}
                    </Button>
                  }
                />
              ) : null}

              <AddActionDialog
                activeGoals={activeGoals}
                dict={dict}
                tz={tz}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 rounded-2xl"
                    onClick={() => setOpen(false)}
                    disabled={!open}
                  >
                    <Plus className="h-4 w-4" />
                    {dict.quickCapture.addAction}
                  </Button>
                }
              />

              <QuickCaptureDialog
                dict={dict}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 rounded-2xl"
                    onClick={() => setOpen(false)}
                    disabled={!open}
                  >
                    <Lightbulb className="h-4 w-4" />
                    {dict.quickCapture.addIdea}
                  </Button>
                }
              />

              <AITodayPlanButton
                dict={dict}
                goals={activeGoals}
                defaultDate={today}
                source="today"
                trigger={
                  <Button
                    type="button"
                    className="w-full justify-start gap-2 rounded-2xl"
                    onClick={() => setOpen(false)}
                    disabled={!open}
                  >
                    <Bot className="h-4 w-4" />
                    {dict.dashboard.planning.aiPlanBtn}
                  </Button>
                }
              />
            </div>
          </div>

          <Button
            ref={fabButtonRef}
            type="button"
            size="icon"
            className={cn('h-14 w-14 rounded-full shadow-lg will-change-transform', dragging && 'transition-none scale-105 shadow-xl')}
            aria-label={dict.quickCapture.fabLabel}
            onClick={handleFabClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <Plus className={cn('h-6 w-6 transition-transform', open ? 'rotate-45' : 'rotate-0', dragging && 'scale-110')} />
          </Button>
        </div>
      </div>
    </>
  )
}
