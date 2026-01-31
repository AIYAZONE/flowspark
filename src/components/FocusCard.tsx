'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface FlowDict {
  title: string
  progress: string
  nextAction: string
  enterFlow: string
  allDone: string
  badgeAllDone: string
}

interface FocusCardProps {
  dict: FlowDict
  totalActions: number
  completedActions: number
  nextActionTitle?: string
}

export function FocusCard({
  dict,
  totalActions,
  completedActions,
  nextActionTitle
}: FocusCardProps) {
  const isAllDone = completedActions === totalActions && totalActions > 0
  const progressPercent = totalActions > 0 ? (completedActions / totalActions) * 100 : 0

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          <div className="space-y-4 flex-1">
            <div>
              <h3 className="text-lg font-medium text-muted-foreground mb-1">
                {dict.title}
              </h3>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold tracking-tight">
                  {completedActions} <span className="text-muted-foreground/50">/ {totalActions}</span>
                </div>
                {isAllDone && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {dict.badgeAllDone}
                  </span>
                )}
              </div>
            </div>

            <div className="relative pt-2">
              <div className="flex items-center gap-2 mb-2">
                {isAllDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-primary animate-pulse" />
                )}
                <span className="font-medium text-lg truncate">
                  {isAllDone
                    ? dict.allDone
                    : dict.nextAction.replace('{action}', nextActionTitle || '...')}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex-shrink-0">
            <Link href="/today">
              <Button size="lg" className="w-full rounded-full shadow-lg shadow-primary/20 h-12 px-8 text-base">
                {dict.enterFlow} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
