export type RewardRarity = 'common' | 'rare' | 'epic'

export type RewardResult = {
  rarity: RewardRarity
  bonusXP: number
}

type Weighted<T extends string> = { key: T; weight: number }

function pickWeighted<T extends string>(items: Array<Weighted<T>>): T {
  const total = items.reduce((acc, i) => acc + Math.max(0, i.weight), 0)
  if (total <= 0) return items[0].key
  let r = Math.random() * total
  for (const item of items) {
    const w = Math.max(0, item.weight)
    if (r < w) return item.key
    r -= w
  }
  return items[items.length - 1].key
}

export function rollCompletionReward(opts: { actionType: string | null | undefined }): RewardResult {
  const isCore = opts.actionType === 'core'
  const rarity = pickWeighted<RewardRarity>([
    { key: 'common', weight: isCore ? 72 : 80 },
    { key: 'rare', weight: isCore ? 23 : 18 },
    { key: 'epic', weight: isCore ? 5 : 2 }
  ])

  const bonusXP =
    rarity === 'epic' ? (isCore ? 80 : 40)
      : rarity === 'rare' ? (isCore ? 40 : 20)
        : (isCore ? 20 : 10)

  return { rarity, bonusXP }
}

