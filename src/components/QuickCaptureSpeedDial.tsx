'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Lightbulb, Plus, Sparkles, Target } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type en from '@/i18n/en.json'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AddGoalDialog } from '@/components/AddGoalDialog'
import { AddActionDialog } from '@/components/AddActionDialog'
import { AddGoalEntryDialog } from '@/components/AddGoalEntryDialog'
import { QuickCaptureDialog } from '@/components/QuickCaptureDialog'
import { MOBILE_ONLY_CLASS } from '@/components/responsive-classes'

type Dict = typeof en
const FAB_POSITION_KEY = 'quick-capture-fab-position-v2'
const DRAG_MARGIN = 8
const DRAG_START_THRESHOLD = 8
const DEFAULT_RIGHT_INSET = 10
const DEFAULT_BOTTOM_INSET = 114
const BOTTOM_RESERVED_AREA = 120
const MENU_GAP = 12
const MENU_EDGE_MARGIN = 12

type FabPosition = { left: number; top: number }
type MenuPlacement = { vertical: 'up' | 'down'; horizontal: 'start' | 'end' }

function getViewportSize() {
	return {
		width: window.visualViewport?.width ?? window.innerWidth,
		height: window.visualViewport?.height ?? window.innerHeight
	}
}

function clampPosition(position: FabPosition, width: number, height: number): FabPosition {
	const { width: viewportWidth, height: viewportHeight } = getViewportSize()
	const maxLeft = Math.max(DRAG_MARGIN, viewportWidth - width - DRAG_MARGIN)
	const maxTop = Math.max(DRAG_MARGIN, viewportHeight - height - BOTTOM_RESERVED_AREA)
	return {
		left: Math.min(Math.max(position.left, DRAG_MARGIN), maxLeft),
		top: Math.min(Math.max(position.top, DRAG_MARGIN), maxTop)
	}
}

function getDefaultPosition(width: number, height: number): FabPosition {
	const right = DEFAULT_RIGHT_INSET + Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--fab-safe-right') || '0', 10)
	const bottom = DEFAULT_BOTTOM_INSET
	return clampPosition(
		{
			left: getViewportSize().width - width - right,
			top: getViewportSize().height - height - bottom
		},
		width,
		height
	)
}

export function QuickCaptureSpeedDial({
	dict,
	activeGoals,
	tz
}: {
	dict: Dict
	activeGoals: { id: string; title: string }[]
	tz: string
}) {
	const [open, setOpen] = useState(false)
	const [canDragFab, setCanDragFab] = useState(false)
	const [dragging, setDragging] = useState(false)
	const [fabPosition, setFabPosition] = useState<FabPosition | null>(null)
	const [menuPlacement, setMenuPlacement] = useState<MenuPlacement>({ vertical: 'up', horizontal: 'end' })
	const pathname = usePathname()
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const fabButtonRef = useRef<HTMLButtonElement | null>(null)
	const menuRef = useRef<HTMLDivElement | null>(null)
	const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const dragStartRef = useRef<{ left: number; top: number; x: number; y: number }>({ left: 0, top: 0, x: 0, y: 0 })
	const pointerActiveRef = useRef(false)
	const draggedRef = useRef(false)

	useEffect(() => {
		if (!open) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [open])

	useEffect(() => {
		if (typeof window === 'undefined') return
		// Allow dragging on touch devices and small mobile viewport (for desktop responsive debugging too).
		const media = window.matchMedia('(hover: none) and (pointer: coarse), (max-width: 767px)')
		const sync = () => setCanDragFab(media.matches)
		sync()
		if (typeof media.addEventListener === 'function') {
			media.addEventListener('change', sync)
			return () => media.removeEventListener('change', sync)
		}
		media.addListener(sync)
		return () => media.removeListener(sync)
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (!canDragFab) return

		const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
		const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
		const raw = window.localStorage.getItem(FAB_POSITION_KEY)
		if (!raw) {
			window.setTimeout(() => setFabPosition(getDefaultPosition(fabWidth, fabHeight)), 0)
			return
		}
		try {
			const parsed = JSON.parse(raw) as FabPosition
			window.setTimeout(() => setFabPosition(clampPosition(parsed, fabWidth, fabHeight)), 0)
		} catch {
			window.setTimeout(() => setFabPosition(getDefaultPosition(fabWidth, fabHeight)), 0)
		}
	}, [canDragFab])

	useEffect(() => {
		if (typeof window === 'undefined') return
		if (!canDragFab || !fabPosition) return
		const onResize = () => {
			const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
			const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
			setFabPosition((prev) => (prev ? clampPosition(prev, fabWidth, fabHeight) : prev))
		}
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [canDragFab, fabPosition])

	useEffect(() => {
		if (!open) return

		const updateMenuPlacement = () => {
			const buttonRect = fabButtonRef.current?.getBoundingClientRect()
			const menuRect = menuRef.current?.getBoundingClientRect()
			if (!buttonRect || !menuRect) return

			const { width: viewportWidth, height: viewportHeight } = getViewportSize()
			const requiredHeight = menuRect.height + MENU_GAP + MENU_EDGE_MARGIN
			const canOpenUp = buttonRect.top >= requiredHeight
			const canOpenDown = viewportHeight - buttonRect.bottom >= requiredHeight
			const vertical: MenuPlacement['vertical'] = !canOpenUp && canOpenDown ? 'down' : 'up'

			const canAlignEnd = buttonRect.right >= menuRect.width + MENU_EDGE_MARGIN
			const canAlignStart = viewportWidth - buttonRect.left >= menuRect.width + MENU_EDGE_MARGIN
			const horizontal: MenuPlacement['horizontal'] = !canAlignEnd && canAlignStart ? 'start' : 'end'

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

	function persistFabPosition(position: FabPosition | null) {
		if (!position || typeof window === 'undefined') return
		window.localStorage.setItem(FAB_POSITION_KEY, JSON.stringify(position))
	}

	function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
		if (!canDragFab) return
		pointerActiveRef.current = true
		draggedRef.current = false
		pointerStartRef.current = { x: e.clientX, y: e.clientY }
		const currentRect = wrapperRef.current?.getBoundingClientRect()
		dragStartRef.current = {
			left: currentRect?.left ?? fabPosition?.left ?? 0,
			top: currentRect?.top ?? fabPosition?.top ?? 0,
			x: e.clientX,
			y: e.clientY
		}
		e.currentTarget.setPointerCapture(e.pointerId)
	}

	function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
		if (!canDragFab || !pointerActiveRef.current) return
		const movedDistance = Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y)
		if (!dragging && movedDistance < DRAG_START_THRESHOLD) {
			return
		}
		if (!dragging) {
			draggedRef.current = true
			if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
				navigator.vibrate(8)
			}
			setDragging(true)
			setOpen(false)
		}
		e.preventDefault()
		const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
		const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
		const nextLeft = dragStartRef.current.left + (e.clientX - dragStartRef.current.x)
		const nextTop = dragStartRef.current.top + (e.clientY - dragStartRef.current.y)
		setFabPosition(clampPosition({ left: nextLeft, top: nextTop }, fabWidth, fabHeight))
	}

	function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
		if (canDragFab && e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId)
		}
		pointerActiveRef.current = false
		if (dragging || draggedRef.current) {
			draggedRef.current = false
			setDragging(false)
			persistFabPosition(fabPosition)
			return
		}
		setOpen((v) => !v)
	}

	function handlePointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
		if (canDragFab && e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId)
		}
		pointerActiveRef.current = false
		draggedRef.current = false
		setDragging(false)
	}

	const wrapperClassName = cn(
		'fixed z-50',
		MOBILE_ONLY_CLASS,
		canDragFab && fabPosition ? '' : 'right-[10px] bottom-[calc(7.25rem+env(safe-area-inset-bottom))]'
	)
	const menuClassName = cn(
		'absolute z-10 flex flex-col gap-3 transition-all duration-200',
		menuPlacement.vertical === 'up'
			? 'bottom-[calc(100%+12px)]'
			: 'top-[calc(100%+12px)]',
		menuPlacement.horizontal === 'end' ? 'right-0 items-end' : 'left-0 items-start',
		open ? 'pointer-events-auto opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 scale-95',
		!open && menuPlacement.vertical === 'up' && 'translate-y-2',
		!open && menuPlacement.vertical === 'down' && '-translate-y-2'
	)
	const showAddGoalEntry = pathname === '/goals' || pathname.startsWith('/goals/')
	const goalIdFromPath = useMemo(() => {
		const match = pathname.match(/^\/goals\/([^/]+)$/)
		if (!match) return null
		const id = match[1]
		if (!id || id === 'new' || id === 'entries') return null
		return id
	}, [pathname])

	return (
		<>
			{open ? <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /> : null}
			<div ref={wrapperRef} className={wrapperClassName} style={canDragFab && fabPosition ? { left: fabPosition.left, top: fabPosition.top } : undefined}>
				<div ref={menuRef} className={menuClassName}>
					{showAddGoalEntry ? (
						<AddGoalDialog
							dict={dict}
							trigger={
								<Button
									type="button"
									variant="secondary"
									onClick={() => setOpen(false)}
									className={cn(
										'shadow-lg gap-2 transition-all whitespace-nowrap',
										open ? 'opacity-100 translate-y-0' : 'opacity-0'
									)}
								>
									<Target className="h-4 w-4" />
									{dict.goals.newGoal}
								</Button>
							}
						/>
					) : null}
					<AddActionDialog
						goalId={goalIdFromPath || undefined}
						activeGoals={activeGoals}
						dict={dict}
						tz={tz}
						trigger={
							<Button
								type="button"
								variant="secondary"
								onClick={() => setOpen(false)}
								className={cn(
									'shadow-lg gap-2 transition-all whitespace-nowrap',
									open ? 'opacity-100 translate-y-0' : 'opacity-0'
								)}
							>
								<Plus className="h-4 w-4" />
								{dict.quickCapture.addAction}
							</Button>
						}
					/>
					{goalIdFromPath ? (
						<AddGoalEntryDialog
							goalId={goalIdFromPath}
							kind="journey"
							dict={dict}
							trigger={
								<Button
									type="button"
									variant="secondary"
									onClick={() => setOpen(false)}
									className={cn(
										'shadow-lg gap-2 transition-all whitespace-nowrap',
										open ? 'opacity-100 translate-y-0' : 'opacity-0'
									)}
								>
									<Sparkles className="h-4 w-4" />
									{dict.goals.detail.addJourney}
								</Button>
							}
						/>
					) : null}
					<QuickCaptureDialog
						dict={dict}
						trigger={
							<Button
								type="button"
								variant="secondary"
								onClick={() => setOpen(false)}
								className={cn(
									'shadow-lg gap-2 transition-all whitespace-nowrap',
									open ? 'opacity-100 translate-y-0' : 'opacity-0'
								)}
							>
								<Lightbulb className="h-4 w-4" />
								{dict.quickCapture.addIdea}
							</Button>
						}
					/>
				</div>

				<Button
					ref={fabButtonRef}
					type="button"
					size="icon"
					className={cn(
						'h-14 w-14 rounded-full shadow-lg will-change-transform',
						canDragFab && 'touch-none select-none',
						dragging && 'transition-none scale-105 shadow-xl'
					)}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerCancel={handlePointerCancel}
					aria-label={dict.quickCapture.fabLabel}
				>
					<Plus className={cn('h-6 w-6 transition-transform', open ? 'rotate-45' : 'rotate-0', dragging && 'scale-110')} />
				</Button>
			</div>
		</>
	)
}
