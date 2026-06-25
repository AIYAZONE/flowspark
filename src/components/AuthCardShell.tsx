import { cn } from '@/lib/utils'

export function AuthCardShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative z-10 w-full max-w-sm rounded-3xl bg-linear-to-br from-primary/22 via-violet-500/10 to-sky-500/18 p-px shadow-[0_40px_120px_-76px_rgba(16,185,129,0.28)]',
        className
      )}
    >
      <div className="rounded-[1.45rem] border border-white/8 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  )
}

