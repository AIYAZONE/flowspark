'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Trophy, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { RewardResult, RewardRarity } from '@/lib/rewards'
import type en from '@/i18n/en.json'

type Dict = typeof en

function getAccent(rarity: RewardRarity) {
  if (rarity === 'epic') return { ring: 'ring-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' }
  if (rarity === 'rare') return { ring: 'ring-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }
  return { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' }
}

function getIcon(rarity: RewardRarity) {
  if (rarity === 'epic') return Trophy
  if (rarity === 'rare') return Star
  return Sparkles
}

export function RewardLootBoxDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reward: RewardResult | null
  dict: Dict
}) {
  const locale = String(props.dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const rarityLabel = useMemo(() => {
    const r = props.reward?.rarity
    if (!r) return ''
    if (locale === 'zh') {
      if (r === 'epic') return '史诗'
      if (r === 'rare') return '稀有'
      return '普通'
    }
    if (r === 'epic') return 'Epic'
    if (r === 'rare') return 'Rare'
    return 'Common'
  }, [props.reward?.rarity, locale])

  const accent = getAccent(props.reward?.rarity || 'common')
  const rarity = props.reward?.rarity || 'common'

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {locale === 'zh' ? '解锁奖励！' : 'Reward Unlocked!'}
          </DialogTitle>
        </DialogHeader>

        {props.reward ? (
          <div className="space-y-4">
            <div className={`relative overflow-hidden rounded-xl border ${accent.bg}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                className="p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full ${accent.bg} ring-1 ${accent.ring} flex items-center justify-center`}>
                      {rarity === 'epic' ? (
                        <Trophy className={`h-6 w-6 ${accent.text}`} />
                      ) : rarity === 'rare' ? (
                        <Star className={`h-6 w-6 ${accent.text}`} />
                      ) : (
                        <Sparkles className={`h-6 w-6 ${accent.text}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {rarityLabel}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {locale === 'zh' ? '盲盒掉落' : 'Loot box drop'}
                      </div>
                    </div>
                  </div>
                  <motion.div
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm font-semibold"
                  >
                    +{props.reward.bonusXP} XP
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mt-4 text-sm text-muted-foreground"
                >
                  {locale === 'zh'
                    ? '继续保持，下一次可能更惊喜。'
                    : 'Keep going—next one might be even better.'}
                </motion.div>
              </motion.div>

              <motion.div
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              </motion.div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => props.onOpenChange(false)}>
                {locale === 'zh' ? '收下' : 'Claim'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
