'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LEVEL_TITLES } from '@/lib/gamification'
import { Trophy, Star, Zap, CheckCircle2 } from 'lucide-react'

interface LevelSystemDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLevel: number
}

export function LevelSystemDialog({ dict, open, onOpenChange, currentLevel }: LevelSystemDialogProps) {
  const titles = dict.dashboard.stats.titles
  const rules = dict.dashboard.stats.rules

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {rules.title}
          </DialogTitle>
          <DialogDescription>
            {rules.desc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* XP Rules */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">XP Rules</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{rules.core}</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">+50 XP</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{rules.maintenance}</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">+10 XP</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-orange-500/10 text-orange-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{rules.streak}</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">+100 XP</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-purple-500/10 text-purple-600">
                    <Star className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{rules.bonus}</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">+20 XP</span>
              </div>
            </div>
          </div>

          {/* Level Progression */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Progression Path</h4>
            <div className="space-y-2">
              {LEVEL_TITLES.map((title) => {
                const isActive = currentLevel >= title.min && currentLevel <= title.max
                const isPassed = currentLevel > title.max
                
                return (
                  <div 
                    key={title.key} 
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-yellow-500/10 border border-yellow-500/30' 
                        : isPassed 
                          ? 'opacity-50' 
                          : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-yellow-500 animate-pulse' : isPassed ? 'bg-yellow-500' : 'bg-muted'}`} />
                      <span className={`text-sm ${isActive ? 'font-bold text-yellow-700 dark:text-yellow-400' : ''}`}>
                        {titles[title.key] || title.key}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Lv. {title.min} - {title.max > 100 ? '∞' : title.max}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}