'use client'

import { type ReactNode } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RichTextToolbar(props: { left: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2',
        props.className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{props.left}</div>
      {props.right ? <div className="ml-auto flex items-center gap-2">{props.right}</div> : null}
    </div>
  )
}

export function RichTextToolbarButton({ className, ...props }: ButtonProps) {
  const { onPointerDown, onMouseDown, ...rest } = props
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 px-2.5', className)}
      onPointerDown={(event) => {
        event.preventDefault()
        onPointerDown?.(event)
      }}
      onMouseDown={(event) => {
        event.preventDefault()
        onMouseDown?.(event)
      }}
      {...rest}
    />
  )
}
