import { cn } from '@/lib/utils'

const variantStyles = {
  error: 'border-destructive/25 bg-destructive/5',
  success: 'border-emerald-500/25 bg-emerald-500/5',
  info: 'border-primary/15 bg-primary/5',
} as const

export function AuthInlineNotice({
  variant,
  title,
  children,
  className,
}: {
  variant: keyof typeof variantStyles
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-3 text-sm shadow-sm shadow-black/5 backdrop-blur-xl',
        variantStyles[variant],
        className
      )}
    >
      {title ? <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</div> : null}
      <div className={cn(title ? 'mt-1.5 text-foreground/90' : 'text-foreground/90')}>{children}</div>
    </div>
  )
}

