'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import type en from '@/i18n/en.json'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AddActionDialog } from '@/components/AddActionDialog'
import { QuickCaptureDialog } from '@/components/QuickCaptureDialog'

type Dict = typeof en
const FAB_POSITION_KEY = 'quick-capture-fab-position-v2'
const LONG_PRESS_MS = 320
const DRAG_MARGIN = 8
const DEFAULT_RIGHT_INSET = 10
const DEFAULT_BOTTOM_INSET = 114
const BOTTOM_RESERVED_AREA = 120

type FabPosition = { left: number; top: number }

function clampPosition(position: FabPosition, width: number, height: number): FabPosition {
	const maxLeft = Math.max(DRAG_MARGIN, window.innerWidth - width - DRAG_MARGIN)
	const maxTop = Math.max(DRAG_MARGIN, window.innerHeight - height - BOTTOM_RESERVED_AREA)
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
			left: window.innerWidth - width - right,
			top: window.innerHeight - height - bottom
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
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const fabButtonRef = useRef<HTMLButtonElement | null>(null)
	const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const dragStartRef = useRef<{ left: number; top: number; x: number; y: number }>({ left: 0, top: 0, x: 0, y: 0 })
	const longPressTimerRef = useRef<number | null>(null)
	const movedRef = useRef(false)

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

	function clearLongPressTimer() {
		if (longPressTimerRef.current) {
			window.clearTimeout(longPressTimerRef.current)
			longPressTimerRef.current = null
		}
	}

	function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
		if (!canDragFab) return
		movedRef.current = false
		pointerStartRef.current = { x: e.clientX, y: e.clientY }
		const currentRect = wrapperRef.current?.getBoundingClientRect()
		dragStartRef.current = {
			left: currentRect?.left ?? 0,
			top: currentRect?.top ?? 0,
			x: e.clientX,
			y: e.clientY
		}
		e.currentTarget.setPointerCapture(e.pointerId)
		clearLongPressTimer()
		longPressTimerRef.current = window.setTimeout(() => {
			setDragging(true)
			setOpen(false)
		}, LONG_PRESS_MS)
	}

	function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
		if (!canDragFab) return
		const movedDistance = Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y)
		if (!dragging && movedDistance > 16) {
			movedRef.current = true
			clearLongPressTimer()
		}
		if (!dragging) return

		const fabWidth = fabButtonRef.current?.offsetWidth ?? 56
		const fabHeight = fabButtonRef.current?.offsetHeight ?? 56
		const nextLeft = dragStartRef.current.left + (e.clientX - dragStartRef.current.x)
		const nextTop = dragStartRef.current.top + (e.clientY - dragStartRef.current.y)
		setFabPosition(clampPosition({ left: nextLeft, top: nextTop }, fabWidth, fabHeight))
	}

	function handlePointerEnd() {
		clearLongPressTimer()
		if (dragging) {
			setDragging(false)
			if (fabPosition && typeof window !== 'undefined') {
				window.localStorage.setItem(FAB_POSITION_KEY, JSON.stringify(fabPosition))
			}
			return
		}
		if (!movedRef.current) {
			setOpen((v) => !v)
		}
	}

	const wrapperClassName = cn(
		'fixed z-50 md:hidden',
		canDragFab && fabPosition ? '' : 'right-[10px] bottom-[calc(7.25rem+env(safe-area-inset-bottom))]'
	)

	return (
		<>
			{open ? <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /> : null}
			<div ref={wrapperRef} className={wrapperClassName} style={canDragFab && fabPosition ? { left: fabPosition.left, top: fabPosition.top } : undefined}>
				<div className={cn('flex flex-col items-end gap-3 transition-all', open ? 'mb-3 opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden pointer-events-none')}>
					<AddActionDialog
						activeGoals={activeGoals}
						dict={dict}
						tz={tz}
						trigger={
							<Button
								type="button"
								variant="secondary"
								className={cn(
									'shadow-lg gap-2 transition-all',
									open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
								)}
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
								variant="secondary"
								className={cn(
									'shadow-lg gap-2 transition-all',
									open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
								)}
							>
								<Sparkles className="h-4 w-4" />
								{dict.quickCapture.addIdea}
							</Button>
						}
					/>
				</div>

				<Button
					ref={fabButtonRef}
					type="button"
					size="icon"
					className="h-14 w-14 rounded-full shadow-lg"
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerEnd}
					onPointerCancel={handlePointerEnd}
					aria-label={dict.quickCapture.fabLabel}
				>
					<Plus className={cn('h-6 w-6 transition-transform', open ? 'rotate-45' : 'rotate-0', dragging && 'scale-110')} />
				</Button>
			</div>
		</>
	)
}
