'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type ModalActionFooterProps = React.HTMLAttributes<HTMLDivElement> & {
  insetBottom?: string
}

export function ModalActionFooter({
  className,
  children,
  style,
  insetBottom,
  ...props
}: ModalActionFooterProps) {
  return (
    <div
      className={cn(
        'border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:px-6 md:py-4',
        className
      )}
      style={{
        paddingBottom: insetBottom,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
