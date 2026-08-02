/**
 * 驻点检测器：
 * 检测路径中的停滞信号（action 长时间无进展），输出可 rescue 的 action。
 */

export type StaleAction = {
  id: string
  title: string
  goal_id: string
  goal_title: string
  days_since_last_progress: number
  reason_tag: 'no_time' | 'stalled' | 'unclear_next' | 'anxiety'
}

export type StaleSignal = {
  /** 是否可救援（至少有 1 个驻点 action） */
  rescueEligible: boolean
  /** 主力路径上的驻点 action（最多 3 个） */
  staleActions: StaleAction[]
}

/**
 * 从 actions 列表中检测驻点 signal。
 *
 * - 7 天以上无进展 → 认为进入驻点
 * - 14 天以上 → reason_tag 升级为 "anxiety"
 * - 取前 3 个驻点 action 返回
 *
 * @param today ISO date string (e.g. "2026-08-02")
 */
export function detectStaleActions(
  actions: Array<{
    id: string
    title: string
    completed?: boolean | null
    goal_id?: string | null
    goal_title?: string | null
    updated_at?: string | null
    created_at?: string | null
  }>,
  today: string
): StaleSignal {
  const todayTime = new Date(`${today}T00:00:00.000Z`).getTime()

  const stale = actions
    .filter((a) => !a.completed && a.goal_id)
    .map((a) => {
      const lastDate = a.updated_at || a.created_at
      if (!lastDate) return null
      const lastTime = new Date(lastDate).getTime()
      const days = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24))
      if (days < 7) return null

      let reason_tag: StaleAction['reason_tag'] = 'stalled'
      if (days >= 21) reason_tag = 'anxiety'
      else if (days >= 14) reason_tag = 'no_time'

      return {
        id: a.id,
        title: a.title,
        goal_id: a.goal_id || '',
        goal_title: a.goal_title || '',
        days_since_last_progress: days,
        reason_tag,
      } as StaleAction
    })
    .filter((a): a is StaleAction => a !== null)
    .sort((a, b) => b.days_since_last_progress - a.days_since_last_progress)
    .slice(0, 3)

  return {
    rescueEligible: stale.length > 0,
    staleActions: stale,
  }
}
