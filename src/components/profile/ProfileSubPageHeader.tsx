import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function ProfileSubPageHeader(props: {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  icon?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href: string }>
  rightSlot?: React.ReactNode
}) {
  const backHref = props.backHref || '/profile'
  const backLabel = props.backLabel || '返回'
  const breadcrumbs = props.breadcrumbs || []

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/70 backdrop-blur-xl sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none">
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="group flex items-center gap-2 rounded-full border border-border/40 bg-background/50 pl-2 pr-4 text-muted-foreground backdrop-blur-xl transition-colors hover:bg-primary/10 hover:text-primary active:bg-primary/10 active:text-primary"
        >
          <Link href={backHref} aria-label={backLabel}>
            <span className="rounded-full bg-background/80 p-1 transition-colors group-hover:bg-background">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{backLabel}</span>
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-foreground">{props.title}</div>
        </div>

        {props.rightSlot ? <div className="shrink-0">{props.rightSlot}</div> : <div className="w-10" />}
      </div>

      <div className="hidden sm:flex sm:flex-col sm:gap-3">
        {breadcrumbs.length > 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => (
              <span key={`${crumb.href}-${idx}`} className="inline-flex items-center gap-2">
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
                {idx < breadcrumbs.length - 1 ? (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                ) : null}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              {props.icon ? (
                <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary')}>
                  {props.icon}
                </span>
              ) : null}
              <h1 className="text-3xl font-bold tracking-tight">{props.title}</h1>
            </div>
            {props.description ? (
              <div className="text-sm text-muted-foreground">{props.description}</div>
            ) : null}
          </div>
          {props.rightSlot ? <div className="shrink-0">{props.rightSlot}</div> : null}
        </div>
      </div>
    </div>
  )
}
