'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Star, ChevronRight, Sparkles } from 'lucide-react'
import { getLevelTitleKey } from '@/lib/gamification'
import { LevelSystemDialog } from './LevelSystemDialog'

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
  const locale = String(dict.common?.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const lastLogIsBonus = Boolean(lastLog?.source?.includes('bonus'))
  const surpriseHint = lastLogIsBonus
    ? (
      locale === 'zh'
        ? '刚刚触发了一次惊喜奖励，继续完成核心行动会更容易遇到高价值掉落。'
        : 'A surprise reward just dropped. Completing more core actions improves your odds of better drops.'
    )
    : (
      locale === 'zh'
        ? '完成行动后会随机掉落奖励，核心行动更容易触发高价值惊喜。'
        : 'Completed actions can trigger surprise drops. Core actions are more likely to unlock better rewards.'
    )

  const getSourceName = (source: string) => {
    if (source.includes('core')) return dict.today.types.core
    if (source.includes('maintenance')) return dict.today.types.maintenance
    if (source.includes('streak')) return dict.dashboard.stats.streak.replace('{days}', '')
    if (source.includes('bonus')) return dict.dashboard.stats.rules.bonus
    return source
  }

  return (
    <>
      <Card
        className={`overflow-hidden border-yellow-500/20 bg-linear-to-br from-yellow-500/5 to-transparent flex flex-col justify-between cursor-pointer transition-all hover:border-yellow-500/40 active:scale-[0.99] group ${className}`}
        onClick={() => setShowLevelSystem(true)}
      >
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
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
            <Trophy className="h-3 w-3" />
            <span className="font-medium">{dict.dashboard.stats.rules.title}</span>
          </div>
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

          <div className="mt-3 rounded-lg border border-yellow-500/15 bg-yellow-500/8 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <span>{surpriseHint}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            {lastLog ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {dict.dashboard.stats.recentXP
                  .replace('{amount}', lastLog.amount.toString())
                  .replace('{source}', getSourceName(lastLog.source))}
              </div>
            ) : <div />}

            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
          </div>
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
