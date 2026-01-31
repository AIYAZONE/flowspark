'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Star, Info } from 'lucide-react'
import { getLevelTitleKey } from '@/lib/gamification'
import { LevelSystemDialog } from './LevelSystemDialog'
import { Button } from '@/components/ui/button'

interface LevelCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  level: number
  currentXP: number
  nextLevelXP: number
  lastLog?: { amount: number; source: string } | null
  className?: string
}

export function LevelCard({ dict, level, currentXP, nextLevelXP, lastLog, className }: LevelCardProps) {
  const [showLevelSystem, setShowLevelSystem] = useState(false)
  const progress = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100))
  const titleKey = getLevelTitleKey(level)
  const levelTitle = dict.dashboard.stats.titles?.[titleKey] || titleKey

  const getSourceName = (source: string) => {
    if (source.includes('core')) return dict.today.types.core
    if (source.includes('maintenance')) return dict.today.types.maintenance
    if (source.includes('streak')) return dict.dashboard.stats.streak.replace('{days}', '')
    return source
  }

  return (
    <>
      <Card className={`overflow-hidden border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent flex flex-col justify-between ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {dict.dashboard.stats.level}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">Lv.{level}</span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium border border-yellow-500/20">
                {levelTitle}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
            onClick={() => setShowLevelSystem(true)}
          >
            <Trophy className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {currentXP} <span className="text-sm font-normal text-muted-foreground">/ {nextLevelXP} XP</span>
            </div>
          </div>

          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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

      <LevelSystemDialog
        dict={dict}
        open={showLevelSystem}
        onOpenChange={setShowLevelSystem}
        currentLevel={level}
      />
    </>
  )
}
