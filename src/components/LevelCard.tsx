'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Star } from 'lucide-react'

interface LevelCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  level: number
  currentXP: number
  nextLevelXP: number
  lastLog?: { amount: number; source: string } | null
}

export function LevelCard({ dict, level, currentXP, nextLevelXP, lastLog }: LevelCardProps) {
  const progress = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100))
  
  const getSourceName = (source: string) => {
    if (source.includes('core')) return dict.today.types.core
    if (source.includes('maintenance')) return dict.today.types.maintenance
    if (source.includes('streak')) return dict.dashboard.stats.streak.replace('{days}', '')
    return source
  }

  return (
    <Card className="overflow-hidden border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {dict.dashboard.stats.level.replace('{level}', level.toString())}
        </CardTitle>
        <Trophy className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {currentXP} <span className="text-sm font-normal text-muted-foreground">/ {nextLevelXP} XP</span>
        </div>
        <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        {lastLog && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {dict.dashboard.stats.recentXP
              .replace('{amount}', lastLog.amount.toString())
              .replace('{source}', getSourceName(lastLog.source))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
