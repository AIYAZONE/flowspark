'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LEVEL_TITLES } from '@/lib/gamification'
import { Trophy, Star, Zap, CheckCircle2, Shield } from 'lucide-react'

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
  const isZh = String(dict.common?.locale || '').toLowerCase().startsWith('zh')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[92dvh] overflow-hidden p-0 sm:max-h-[85vh]">
        <div className="flex max-h-[92dvh] flex-col sm:max-h-[85vh]">
          <DialogHeader className="border-b border-border/60 px-6 pb-4 pt-6 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {rules.title}
            </DialogTitle>
            <DialogDescription>
              {rules.desc}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <div className="space-y-6">
          {/* XP Rules */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{rules.xpRulesTitle || 'XP Rules'}</h4>
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

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {rules.continuityRulesTitle || (isZh ? '连续性规则' : 'Continuity Rules')}
            </h4>
            <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-orange-500/10 p-1.5 text-orange-600">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {isZh ? '护盾用于补昨天，不消耗 XP' : 'Shields recover yesterday without spending XP'}
                  </div>
                  <div className="mt-1 leading-6">
                    {isZh
                      ? '连续性优先靠当天真实完成来保持；如果昨天漏掉 1 天且你有护盾，可以补回昨天。'
                      : 'Continuity is primarily kept by real completion today. If only yesterday was missed and you have a shield, you can recover that day.'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="leading-6">
                  {isZh
                    ? '首次达到 3 天连续可获得 1 个护盾；之后达到 7 天、14 天等门槛且当前没有护盾时，会再次补充。'
                    : 'Earn your first shield at 3 days. After that, shields refill at 7-day intervals only when no shield is currently held.'}
                </div>
              </div>
            </div>
          </div>

          {/* Level Progression */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {rules.progressionPathTitle || (isZh ? '升级路径' : 'Progression Path')}
            </h4>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
