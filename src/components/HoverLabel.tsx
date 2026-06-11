'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const HoverLabel = forwardRef<
	HTMLDivElement,
	{
		label: string
		children: ReactNode
	} & HTMLAttributes<HTMLDivElement>
>(({ label, children, className, ...props }, ref) => {
	return (
		<div ref={ref} className={cn('relative group/hoverlabel', className)} {...props}>
			{children}
			<div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/60 bg-background/95 px-2 py-1 text-[11px] text-foreground opacity-0 shadow-sm transition-opacity group-hover/hoverlabel:opacity-100">
				{label}
			</div>
		</div>
	)
})

HoverLabel.displayName = 'HoverLabel'
