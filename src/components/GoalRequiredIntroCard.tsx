'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GoalRequiredIntroCardProps {
  title: string
  description: string
  points?: string[]
  icon?: ReactNode
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}

export function GoalRequiredIntroCard({
  title,
  description,
  points,
  icon,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: GoalRequiredIntroCardProps) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border bg-background/70 shadow-sm">
          <div className="text-primary">{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold leading-none tracking-tight">{title}</div>
          <div className="mt-2 text-sm text-muted-foreground">{description}</div>
          {!!points?.length && (
            <div className="mt-4 space-y-2">
              {points.slice(0, 3).map((p) => (
                <div key={p} className="flex items-start gap-2 text-sm text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1 leading-snug">{p}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Button className="w-full" onClick={onPrimary}>
          {primaryLabel}
        </Button>
        <Button variant="link" className="mt-2 h-auto w-full px-0 py-2" onClick={onSecondary}>
          {secondaryLabel}
        </Button>
      </div>
    </div>
  )
}
