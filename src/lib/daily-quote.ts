export type QuoteLocale = 'zh' | 'en'
export type QuoteTag = 'action' | 'gentle' | 'clear'

export type DailyQuote = {
  id: string
  locale: QuoteLocale
  text: string
  tag: QuoteTag
}

export const QUOTE_TIME_ZONE = 'Asia/Shanghai'
export const DAILY_QUOTE_CANDIDATE_COUNT = 5

const TAG_ROTATION: QuoteTag[] = ['action', 'gentle', 'clear']

const QUOTES: DailyQuote[] = [
  { id: 'zh-action-001', locale: 'zh', tag: 'action', text: '先把第一步做完，剩下的路会自己出现。' },
  { id: 'zh-action-002', locale: 'zh', tag: 'action', text: '把目标拆小，给今天一个能完成的胜利。' },
  { id: 'zh-action-003', locale: 'zh', tag: 'action', text: '真正的开始，不需要完美的准备。' },
  { id: 'zh-action-004', locale: 'zh', tag: 'action', text: '今天的 20 分钟，比明天的 2 小时更可靠。' },
  { id: 'zh-action-005', locale: 'zh', tag: 'action', text: '别等动力，先行动；动力会跟着你走。' },
  { id: 'zh-action-006', locale: 'zh', tag: 'action', text: '做一件小事，让自己站到正确的一边。' },
  { id: 'zh-action-007', locale: 'zh', tag: 'action', text: '每一次回到正轨，都是自我掌控的证据。' },
  { id: 'zh-action-008', locale: 'zh', tag: 'action', text: '把“想做”改成“现在做 5 分钟”。' },
  { id: 'zh-action-009', locale: 'zh', tag: 'action', text: '把难事变简单：先做最不讨厌的那一小段。' },
  { id: 'zh-action-010', locale: 'zh', tag: 'action', text: '进度慢没关系，停下来才会归零。' },
  { id: 'zh-action-011', locale: 'zh', tag: 'action', text: '你不需要冲刺，你需要稳定地推进。' },
  { id: 'zh-action-012', locale: 'zh', tag: 'action', text: '把精力花在可控的下一步上。' },
  { id: 'zh-action-013', locale: 'zh', tag: 'action', text: '今天的执行，是给未来的自己发工资。' },
  { id: 'zh-action-014', locale: 'zh', tag: 'action', text: '先完成，再优化；先落地，再精致。' },
  { id: 'zh-action-015', locale: 'zh', tag: 'action', text: '别追求“状态”，追求“动作”。' },
  { id: 'zh-action-016', locale: 'zh', tag: 'action', text: '当你开始做，焦虑就会开始下降。' },
  { id: 'zh-action-017', locale: 'zh', tag: 'action', text: '一口吃不成胖子，但每天都能咬一口。' },
  { id: 'zh-action-018', locale: 'zh', tag: 'action', text: '把结果交给时间，把行动交给今天。' },
  { id: 'zh-action-019', locale: 'zh', tag: 'action', text: '让今天更简单：只做最关键的一件事。' },
  { id: 'zh-action-020', locale: 'zh', tag: 'action', text: '持续不是“每天很猛”，而是“经常不掉线”。' },

  { id: 'zh-gentle-001', locale: 'zh', tag: 'gentle', text: '你已经在路上了，不必急着证明什么。' },
  { id: 'zh-gentle-002', locale: 'zh', tag: 'gentle', text: '允许波动，但别放弃方向。' },
  { id: 'zh-gentle-003', locale: 'zh', tag: 'gentle', text: '慢一点也没关系，重要的是你没有停。' },
  { id: 'zh-gentle-004', locale: 'zh', tag: 'gentle', text: '今天做不到满分，也可以做一点点。' },
  { id: 'zh-gentle-005', locale: 'zh', tag: 'gentle', text: '别和昨天较劲，把今天照顾好。' },
  { id: 'zh-gentle-006', locale: 'zh', tag: 'gentle', text: '你可以累，但别否定自己。' },
  { id: 'zh-gentle-007', locale: 'zh', tag: 'gentle', text: '能量不足时，先把难度调低。' },
  { id: 'zh-gentle-008', locale: 'zh', tag: 'gentle', text: '不舒服的时候，更需要温柔的计划。' },
  { id: 'zh-gentle-009', locale: 'zh', tag: 'gentle', text: '今天的你，值得被鼓励一次。' },
  { id: 'zh-gentle-010', locale: 'zh', tag: 'gentle', text: '你不需要一直强大，你只需要继续。' },
  { id: 'zh-gentle-011', locale: 'zh', tag: 'gentle', text: '别把一段低谷，当成永久的结论。' },
  { id: 'zh-gentle-012', locale: 'zh', tag: 'gentle', text: '允许自己慢慢来，人生不是限时答卷。' },
  { id: 'zh-gentle-013', locale: 'zh', tag: 'gentle', text: '把注意力放回呼吸和当下。' },
  { id: 'zh-gentle-014', locale: 'zh', tag: 'gentle', text: '你在变好，只是过程还没来得及被看见。' },
  { id: 'zh-gentle-015', locale: 'zh', tag: 'gentle', text: '每一次选择自律，都是在善待未来的自己。' },
  { id: 'zh-gentle-016', locale: 'zh', tag: 'gentle', text: '今天先把自己放回可用的状态。' },
  { id: 'zh-gentle-017', locale: 'zh', tag: 'gentle', text: '给自己留一点余地，才走得长。' },
  { id: 'zh-gentle-018', locale: 'zh', tag: 'gentle', text: '你不必赶上谁，只要不丢掉自己。' },
  { id: 'zh-gentle-019', locale: 'zh', tag: 'gentle', text: '把最重要的事，放在最平静的时刻做。' },
  { id: 'zh-gentle-020', locale: 'zh', tag: 'gentle', text: '温柔不是放纵，而是更聪明的坚持。' },

  { id: 'zh-clear-001', locale: 'zh', tag: 'clear', text: '你不是没时间，你是在给不重要的事让路。' },
  { id: 'zh-clear-002', locale: 'zh', tag: 'clear', text: '拖延不是问题，逃避才是。' },
  { id: 'zh-clear-003', locale: 'zh', tag: 'clear', text: '别用思考替代行动。' },
  { id: 'zh-clear-004', locale: 'zh', tag: 'clear', text: '你要的是结果，就别只做“准备”。' },
  { id: 'zh-clear-005', locale: 'zh', tag: 'clear', text: '选择困难？先删掉一个选项。' },
  { id: 'zh-clear-006', locale: 'zh', tag: 'clear', text: '不开始的“完美”，就是 0 分。' },
  { id: 'zh-clear-007', locale: 'zh', tag: 'clear', text: '别把“忙”当成进步。' },
  { id: 'zh-clear-008', locale: 'zh', tag: 'clear', text: '今天的借口，会变成明天的遗憾。' },
  { id: 'zh-clear-009', locale: 'zh', tag: 'clear', text: '你不需要更多工具，你需要一次真正的专注。' },
  { id: 'zh-clear-010', locale: 'zh', tag: 'clear', text: '想法很贵，落地才值钱。' },
  { id: 'zh-clear-011', locale: 'zh', tag: 'clear', text: '你可以怕，但你不能一直不动。' },
  { id: 'zh-clear-012', locale: 'zh', tag: 'clear', text: '最难的不是开始，是持续选择重要的事。' },
  { id: 'zh-clear-013', locale: 'zh', tag: 'clear', text: '你缺的不是计划，是对计划的执行。' },
  { id: 'zh-clear-014', locale: 'zh', tag: 'clear', text: '如果一件事不重要，就不要给它“很多次”。' },
  { id: 'zh-clear-015', locale: 'zh', tag: 'clear', text: '别等情绪变好，先把事情变少。' },
  { id: 'zh-clear-016', locale: 'zh', tag: 'clear', text: '你要的改变，不会在“以后”发生。' },
  { id: 'zh-clear-017', locale: 'zh', tag: 'clear', text: '别把“慢”解释成“安全”。' },
  { id: 'zh-clear-018', locale: 'zh', tag: 'clear', text: '让进度说话，比让自己解释更有用。' },
  { id: 'zh-clear-019', locale: 'zh', tag: 'clear', text: '你今天不做，明天也不会更想做。' },
  { id: 'zh-clear-020', locale: 'zh', tag: 'clear', text: '不需要燃起来，先把该做的做完。' },

  { id: 'en-action-001', locale: 'en', tag: 'action', text: 'Finish the first step. The path shows up after.' },
  { id: 'en-action-002', locale: 'en', tag: 'action', text: 'Shrink the goal until today can win.' },
  { id: 'en-action-003', locale: 'en', tag: 'action', text: 'A real start doesn’t require perfect readiness.' },
  { id: 'en-action-004', locale: 'en', tag: 'action', text: 'Twenty minutes today beats two hours “tomorrow”.' },
  { id: 'en-action-005', locale: 'en', tag: 'action', text: 'Don’t wait for motivation. Move first.' },
  { id: 'en-action-006', locale: 'en', tag: 'action', text: 'Do one small thing that puts you back in control.' },
  { id: 'en-action-007', locale: 'en', tag: 'action', text: 'Every return to the plan is proof of discipline.' },
  { id: 'en-action-008', locale: 'en', tag: 'action', text: 'Replace “I should” with “five minutes now”.' },
  { id: 'en-action-009', locale: 'en', tag: 'action', text: 'Make it easier: start with the least painful slice.' },
  { id: 'en-action-010', locale: 'en', tag: 'action', text: 'Slow progress is fine. Stopping is zero.' },
  { id: 'en-action-011', locale: 'en', tag: 'action', text: 'You don’t need a sprint. You need steady push.' },
  { id: 'en-action-012', locale: 'en', tag: 'action', text: 'Spend energy on the next controllable move.' },
  { id: 'en-action-013', locale: 'en', tag: 'action', text: 'Execution today pays your future self.' },
  { id: 'en-action-014', locale: 'en', tag: 'action', text: 'Ship first. Refine second.' },
  { id: 'en-action-015', locale: 'en', tag: 'action', text: 'Chase actions, not moods.' },
  { id: 'en-action-016', locale: 'en', tag: 'action', text: 'Start doing. Anxiety starts dropping.' },
  { id: 'en-action-017', locale: 'en', tag: 'action', text: 'You can’t do it all today, but you can do a bite.' },
  { id: 'en-action-018', locale: 'en', tag: 'action', text: 'Give outcomes to time. Give actions to today.' },
  { id: 'en-action-019', locale: 'en', tag: 'action', text: 'Make today simple: one thing that matters most.' },
  { id: 'en-action-020', locale: 'en', tag: 'action', text: 'Consistency is staying online, not being intense.' },

  { id: 'en-gentle-001', locale: 'en', tag: 'gentle', text: 'You’re already on the way. No need to prove anything.' },
  { id: 'en-gentle-002', locale: 'en', tag: 'gentle', text: 'Allow the dip. Don’t abandon the direction.' },
  { id: 'en-gentle-003', locale: 'en', tag: 'gentle', text: 'Slow is okay. Stopped is not.' },
  { id: 'en-gentle-004', locale: 'en', tag: 'gentle', text: 'It doesn’t have to be perfect to be progress.' },
  { id: 'en-gentle-005', locale: 'en', tag: 'gentle', text: 'Don’t fight yesterday. Take care of today.' },
  { id: 'en-gentle-006', locale: 'en', tag: 'gentle', text: 'You can be tired without doubting yourself.' },
  { id: 'en-gentle-007', locale: 'en', tag: 'gentle', text: 'When energy is low, lower the difficulty.' },
  { id: 'en-gentle-008', locale: 'en', tag: 'gentle', text: 'Hard days need kinder plans.' },
  { id: 'en-gentle-009', locale: 'en', tag: 'gentle', text: 'Today deserves one honest encouragement.' },
  { id: 'en-gentle-010', locale: 'en', tag: 'gentle', text: 'You don’t need to be strong all the time. Just continue.' },
  { id: 'en-gentle-011', locale: 'en', tag: 'gentle', text: 'A low point isn’t a permanent verdict.' },
  { id: 'en-gentle-012', locale: 'en', tag: 'gentle', text: 'You can take your time. Life isn’t a timed test.' },
  { id: 'en-gentle-013', locale: 'en', tag: 'gentle', text: 'Bring attention back to breath and now.' },
  { id: 'en-gentle-014', locale: 'en', tag: 'gentle', text: 'You’re improving, even if it’s not visible yet.' },
  { id: 'en-gentle-015', locale: 'en', tag: 'gentle', text: 'Discipline is a form of kindness to your future self.' },
  { id: 'en-gentle-016', locale: 'en', tag: 'gentle', text: 'Reset to a usable state first.' },
  { id: 'en-gentle-017', locale: 'en', tag: 'gentle', text: 'Leave some margin. That’s how you last.' },
  { id: 'en-gentle-018', locale: 'en', tag: 'gentle', text: 'You don’t have to catch anyone. Don’t lose yourself.' },
  { id: 'en-gentle-019', locale: 'en', tag: 'gentle', text: 'Do the important thing in the calmest moment.' },
  { id: 'en-gentle-020', locale: 'en', tag: 'gentle', text: 'Gentle isn’t indulgent. It’s sustainable.' },

  { id: 'en-clear-001', locale: 'en', tag: 'clear', text: 'It’s not lack of time. It’s misallocated attention.' },
  { id: 'en-clear-002', locale: 'en', tag: 'clear', text: 'Procrastination isn’t the issue. Avoidance is.' },
  { id: 'en-clear-003', locale: 'en', tag: 'clear', text: 'Don’t replace action with thinking.' },
  { id: 'en-clear-004', locale: 'en', tag: 'clear', text: 'If you want results, stop living in preparation.' },
  { id: 'en-clear-005', locale: 'en', tag: 'clear', text: 'Can’t choose? Remove one option.' },
  { id: 'en-clear-006', locale: 'en', tag: 'clear', text: 'Perfect plans that never start are zeros.' },
  { id: 'en-clear-007', locale: 'en', tag: 'clear', text: 'Being busy isn’t the same as moving forward.' },
  { id: 'en-clear-008', locale: 'en', tag: 'clear', text: 'Today’s excuse becomes tomorrow’s regret.' },
  { id: 'en-clear-009', locale: 'en', tag: 'clear', text: 'You don’t need more tools. You need one deep focus.' },
  { id: 'en-clear-010', locale: 'en', tag: 'clear', text: 'Ideas are expensive. Shipping makes them valuable.' },
  { id: 'en-clear-011', locale: 'en', tag: 'clear', text: 'You can be scared, but you can’t stay still.' },
  { id: 'en-clear-012', locale: 'en', tag: 'clear', text: 'The hard part is choosing the important thing daily.' },
  { id: 'en-clear-013', locale: 'en', tag: 'clear', text: 'You don’t lack plans. You lack execution.' },
  { id: 'en-clear-014', locale: 'en', tag: 'clear', text: 'If it’s not important, don’t give it “many times”.' },
  { id: 'en-clear-015', locale: 'en', tag: 'clear', text: 'Don’t wait to feel better. Make the load smaller.' },
  { id: 'en-clear-016', locale: 'en', tag: 'clear', text: 'Change doesn’t happen in “later”.' },
  { id: 'en-clear-017', locale: 'en', tag: 'clear', text: 'Don’t confuse “slow” with “safe”.' },
  { id: 'en-clear-018', locale: 'en', tag: 'clear', text: 'Let progress speak. Explanations are expensive.' },
  { id: 'en-clear-019', locale: 'en', tag: 'clear', text: 'If you don’t do it today, tomorrow won’t want it more.' },
  { id: 'en-clear-020', locale: 'en', tag: 'clear', text: 'No need to be fired up. Just finish the next thing.' },
]

export function getQuoteDateInTZ(timeZone = QUOTE_TIME_ZONE): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(new Date())
}

function toEpochDay(dateISO: string): number {
  const [yRaw, mRaw, dRaw] = dateISO.split('-')
  const y = Number(yRaw)
  const m = Number(mRaw)
  const d = Number(dRaw)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return 0
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

function hash32(input: number): number {
  return (Math.imul(input, 1103515245) + 12345) >>> 0
}

function getTagForDate(dateISO: string): QuoteTag {
  const dayIndex = toEpochDay(dateISO)
  return TAG_ROTATION[((dayIndex % TAG_ROTATION.length) + TAG_ROTATION.length) % TAG_ROTATION.length]
}

function getQuotePool(locale: QuoteLocale, tag: QuoteTag): DailyQuote[] {
  const candidates = QUOTES.filter((q) => q.locale === locale && q.tag === tag)
  if (candidates.length > 0) return candidates
  return QUOTES.filter((q) => q.locale === 'en' && q.tag === tag)
}

export function getDailyQuoteCandidates(params: {
  locale: QuoteLocale
  dateISO: string
  count?: number
}): DailyQuote[] {
  const dayIndex = toEpochDay(params.dateISO)
  const tag = getTagForDate(params.dateISO)
  const pool = getQuotePool(params.locale, tag)
  if (pool.length === 0) {
    return [{
      id: 'fallback',
      locale: params.locale,
      tag,
      text: params.locale === 'zh' ? '今天也值得认真对待。' : 'Today is worth taking seriously.',
    }]
  }

  const count = Math.max(1, Math.min(params.count ?? DAILY_QUOTE_CANDIDATE_COUNT, pool.length))
  const picked: DailyQuote[] = []
  const usedIds = new Set<string>()
  let salt = 0

  while (picked.length < count && salt < pool.length * 4) {
    const idx = hash32(dayIndex + salt * 101) % pool.length
    const quote = pool[idx]
    salt += 1
    if (!quote || usedIds.has(quote.id)) continue
    picked.push(quote)
    usedIds.add(quote.id)
  }

  return picked
}

export function getDailyQuoteByIndex(params: {
  locale: QuoteLocale
  dateISO: string
  index: number
  count?: number
}): DailyQuote {
  const quotes = getDailyQuoteCandidates(params)
  const safeIndex = ((params.index % quotes.length) + quotes.length) % quotes.length
  return quotes[safeIndex]!
}

export function getDailyQuote(params: { locale: QuoteLocale; dateISO: string }): DailyQuote {
  const dayIndex = toEpochDay(params.dateISO)
  const quotes = getDailyQuoteCandidates({
    locale: params.locale,
    dateISO: params.dateISO,
    count: DAILY_QUOTE_CANDIDATE_COUNT,
  })
  const first = quotes[0]
  if (first) return first
  const tag = getTagForDate(params.dateISO)
  return { id: 'fallback', locale: params.locale, tag, text: params.locale === 'zh' ? '今天也值得认真对待。' : 'Today is worth taking seriously.' }
}
