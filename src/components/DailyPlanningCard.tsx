'use client'

import { Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SetCoreActionSheet } from '@/components/SetCoreActionSheet'
import { AITodayPlanButton } from '@/components/AITodayPlanButton'

interface PlanningDict {
  title: string
  desc: string
  planBtn: string
  yesterdayReview: string
}

interface DailyPlanningCardProps {
  dict: PlanningDict
  activeGoalsCount: number
  yesterdayScore: number | null
  // Props for SetCoreActionSheet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goals: any[] 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictFull: any 
  defaultDate: string
  showAIPlan?: boolean
  ab1TodayPlanVariant?: 'A' | 'B' | null
  className?: string
}

export function DailyPlanningCard({
  dict,
  activeGoalsCount,
  yesterdayScore,
  goals,
  dictFull,
  defaultDate,
  showAIPlan = true,
  ab1TodayPlanVariant = null,
  className
}: DailyPlanningCardProps) {
  return (
    <div className={`relative ${className}`}>
      <Card className="h-full overflow-hidden border-dashed border-2 border-muted hover:border-primary/20 transition-colors">
        <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>

          <h3 className="text-2xl font-bold tracking-tight mb-2">
            {dict.title}
          </h3>

          <p className="text-muted-foreground max-w-md mb-8">
            {dict.desc.replace('{count}', activeGoalsCount.toString())}
          </p>

          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="w-full">
              <SetCoreActionSheet 
                goals={goals} 
                dict={dictFull} 
                defaultDate={defaultDate}
                trigger={
                  <Button size="lg" className="w-full rounded-full shadow-md">
                    {dict.planBtn} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                }
              />
            </div>

            {showAIPlan ? (
              <div className="w-full">
                <AITodayPlanButton
                  dict={dictFull}
                  goals={goals}
                  defaultDate={defaultDate}
                  ab1TodayPlanVariant={ab1TodayPlanVariant}
                  source="dashboard"
                  triggerVariant="outline"
                  triggerSize="lg"
                  triggerClassName="w-full rounded-full"
                />
              </div>
            ) : null}
            
            {yesterdayScore !== null && (
              <p className="text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                {dict.yesterdayReview.replace('{score}', yesterdayScore.toString())}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
