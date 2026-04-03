'use client'

import { useEffect, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import type en from '@/i18n/en.json'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AddActionDialog } from '@/components/AddActionDialog'
import { QuickCaptureDialog } from '@/components/QuickCaptureDialog'

type Dict = typeof en

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

	useEffect(() => {
		if (!open) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [open])

	return (
		<>
			{open ? <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /> : null}
			<div className="fixed right-6 bottom-24 md:bottom-6 z-50">
				<div className="flex flex-col items-end gap-3 mb-3">
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
					type="button"
					size="icon"
					className="h-14 w-14 rounded-full shadow-lg"
					onClick={() => setOpen((v) => !v)}
					aria-label={dict.quickCapture.fabLabel}
				>
					<Plus className={cn('h-6 w-6 transition-transform', open ? 'rotate-45' : 'rotate-0')} />
				</Button>
			</div>
		</>
	)
}
