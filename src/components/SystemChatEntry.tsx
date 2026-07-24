import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SystemChatEntry(props: {
  eyebrow: string
  title: string
  body: string
  ctaLabel: string
  href: string
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-primary/12 bg-linear-to-br from-primary/6 via-background to-background p-5 shadow-sm md:p-6',
        props.className
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
        {props.eyebrow}
      </div>
      <div className="mt-3 text-xl font-semibold tracking-tight">{props.title}</div>
      <div className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{props.body}</div>
      <div className="mt-5">
        <Button asChild className="rounded-full">
          <Link href={props.href}>{props.ctaLabel}</Link>
        </Button>
      </div>
    </section>
  )
}
