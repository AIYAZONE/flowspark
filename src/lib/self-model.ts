import type { AIRecentRecommendationRow } from '@/lib/ai/analyticsStore'

type Locale = 'zh' | 'en'

type RecommendationSignalRow = Pick<
  AIRecentRecommendationRow,
  'option_selected' | 'adopted' | 'completed' | 'feedback_label'
>

export type SelfModelSignalSummary = {
  shortSelectionCount: number
  longSelectionCount: number
  adoptedRecentCount: number
  completedRecentCount: number
  topFeedbackLabel: string | null
}

export type SelfModelCard = {
  key: 'rhythm' | 'decision' | 'adaptation'
  label: string
  title: string
  body: string
  evidence: string
  todayEffect: string
}

export type TodayPersonalization = {
  eyebrow: string
  title: string
  body: string
}

function normalizeFeedbackLabel(label: string | null) {
  if (!label || label === 'dismiss' || label === 'close_result' || label === 'useful') return null
  if (label.startsWith('not_fit')) return 'not_fit'
  return label
}

export function summarizeRecommendationSignals(
  recent: RecommendationSignalRow[]
): SelfModelSignalSummary {
  const shortSelectionCount = recent.filter(
    item => item.option_selected === '5m' || item.option_selected === '10m'
  ).length
  const longSelectionCount = recent.filter(item => item.option_selected === '20m').length
  const adoptedRecentCount = recent.filter(item => item.adopted === true).length
  const completedRecentCount = recent.filter(item => item.completed === true).length
  const feedbackCounts = new Map<string, number>()

  for (const item of recent) {
    const label = normalizeFeedbackLabel(item.feedback_label)
    if (!label) continue
    feedbackCounts.set(label, (feedbackCounts.get(label) || 0) + 1)
  }

  let topFeedbackLabel: string | null = null
  for (const [key, count] of feedbackCounts.entries()) {
    if (!topFeedbackLabel || count > (feedbackCounts.get(topFeedbackLabel) || 0)) {
      topFeedbackLabel = key
    }
  }

  return {
    shortSelectionCount,
    longSelectionCount,
    adoptedRecentCount,
    completedRecentCount,
    topFeedbackLabel,
  }
}

export function buildSelfModelCards(params: {
  locale: Locale
  currentStreak: number
  completedToday: boolean
  signals: SelfModelSignalSummary
}): SelfModelCard[] {
  const { locale, currentStreak, completedToday, signals } = params
  const isZh = locale === 'zh'
  const {
    shortSelectionCount,
    longSelectionCount,
    adoptedRecentCount,
    completedRecentCount,
    topFeedbackLabel,
  } = signals

  const rhythmCard: SelfModelCard = currentStreak >= 30
    ? {
        key: 'rhythm',
        label: isZh ? '节奏阶段' : 'Rhythm phase',
        title: isZh
          ? '你正在深耕期，系统判断你适合稳定推进。'
          : 'You are in a deepening phase. The system sees you as someone who can sustain momentum.',
        body: isZh
          ? `你已经连续 ${currentStreak} 天行动，系统会更信任你的长期推进能力。`
          : `You are ${currentStreak} days into a streak, so the system can trust your long-range follow-through more.`,
        evidence: isZh
          ? `依据是你已经连续 ${currentStreak} 天行动，这说明你的节奏正在从建立期转向稳态期。`
          : `This is based on your ${currentStreak}-day streak, which suggests your rhythm is moving from setup to stability.`,
        todayEffect: isZh
          ? '这会让 Today 更敢给你明确主线，而不是只给模糊提醒。'
          : 'This lets Today assign a clearer main thread instead of only offering a vague reminder.',
      }
    : currentStreak >= 7
      ? {
          key: 'rhythm',
          label: isZh ? '节奏阶段' : 'Rhythm phase',
          title: isZh ? '你处在稳定建立节奏的阶段。' : 'You are in a steady rhythm-building phase.',
          body: isZh
            ? '系统会优先帮助你保住连续性，再逐步增加推进强度。'
            : 'The system should protect continuity first, then gradually increase intensity.',
          evidence: isZh
            ? `你当前连续 ${currentStreak} 天，说明节奏正在成形，但还不适合频繁打断主线。`
            : `Your current ${currentStreak}-day streak shows rhythm is forming, but it is still not the moment to fragment attention.`,
          todayEffect: isZh
            ? '这会让 Today 优先保连续，再考虑更高强度推进。'
            : 'This makes Today protect continuity first, then consider higher-intensity moves.',
        }
      : {
          key: 'rhythm',
          label: isZh ? '节奏阶段' : 'Rhythm phase',
          title: isZh
            ? '你还在建立可持续节奏，系统应更偏低摩擦。'
            : 'You are still building a sustainable rhythm, so the system should stay low-friction.',
          body: isZh
            ? '现在最重要的是让开始变轻，而不是一次做很多。'
            : 'Right now the priority is making it easier to start, not doing a lot at once.',
          evidence: isZh
            ? `当前连续仅 ${currentStreak} 天，系统需要先帮你降低启动成本。`
            : `With only a ${currentStreak}-day streak right now, the system should lower the cost of getting started first.`,
          todayEffect: isZh
            ? '这会让 Today 更倾向最小可执行动作，而不是拉高要求。'
            : 'This makes Today lean toward minimum viable actions instead of raising the bar.',
        }

  const decisionCard: SelfModelCard = shortSelectionCount >= Math.max(2, longSelectionCount * 2)
    ? {
        key: 'decision',
        label: isZh ? '决策偏好' : 'Decision profile',
        title: isZh
          ? '你更容易采纳 5-10 分钟的小步版本。'
          : 'You tend to adopt 5-10 minute starter versions.',
        body: isZh
          ? '系统后续更适合先给你低摩擦起步，再逐步抬高强度。'
          : 'The system should start with low-friction moves, then gradually raise the bar.',
        evidence: isZh
          ? `最近采纳里，小步版本 ${shortSelectionCount} 次，高于完整版本 ${longSelectionCount} 次。`
          : `Among recent adoptions, starter versions appeared ${shortSelectionCount} times versus ${longSelectionCount} fuller versions.`,
        todayEffect: isZh
          ? '这会让 Today 先把主线压缩成更容易开始的一步。'
          : 'This makes Today compress the main thread into an easier first move.',
      }
    : longSelectionCount >= Math.max(2, shortSelectionCount + 1)
      ? {
          key: 'decision',
          label: isZh ? '决策偏好' : 'Decision profile',
          title: isZh
            ? '你已经能够承接更完整的推进窗口。'
            : 'You can already handle more complete focus windows.',
          body: isZh
            ? '系统后续可以更大胆地给你更完整的推进建议。'
            : 'The system can be bolder about suggesting fuller progress blocks next.',
          evidence: isZh
            ? `最近你选择更完整版本 ${longSelectionCount} 次，已经高于小步版本 ${shortSelectionCount} 次。`
            : `You chose fuller versions ${longSelectionCount} times recently, ahead of starter versions at ${shortSelectionCount}.`,
          todayEffect: isZh
            ? '这会让 Today 在合适时段给你更完整的推进窗口。'
            : 'This lets Today offer a fuller execution window when the moment is right.',
        }
      : {
          key: 'decision',
          label: isZh ? '决策偏好' : 'Decision profile',
          title: isZh
            ? '你的决策偏好还在形成，系统仍在继续学习。'
            : 'Your decision profile is still forming, and the system is still learning.',
          body: isZh
            ? '继续采纳或反馈建议，系统会更快知道什么节奏最适合你。'
            : 'Keep adopting or rejecting suggestions and the system will learn your ideal pace faster.',
          evidence: isZh
            ? '当前可用的选择信号还不够稳定，系统暂时不会过度强化某一种建议力度。'
            : 'The available choice signals are not stable enough yet, so the system should avoid overcommitting to one pacing style.',
          todayEffect: isZh
            ? '这会让 Today 先给中性强度的主线，再根据你的反馈继续校准。'
            : 'This keeps Today at a moderate intensity until your feedback sharpens the fit.',
        }

  const adaptationCard: SelfModelCard = topFeedbackLabel === 'no_time'
    ? {
        key: 'adaptation',
        label: isZh ? '系统适配' : 'System adaptation',
        title: isZh
          ? (completedToday ? '今天的状态已经被系统记录。' : '系统仍在等待今天的最新状态。')
          : (completedToday ? 'Today’s state has already been recorded.' : 'The system is still waiting for your latest signal today.'),
        body: isZh
          ? '系统最近观察到你更容易受时间约束，后续应更优先给低时间门槛建议。'
          : 'The system sees time pressure as a recent constraint, so it should lean toward lower-time-threshold suggestions.',
        evidence: isZh
          ? '最近的负反馈里，“没时间”是最高频信号。'
          : 'Among recent negative feedback, “no time” is the strongest recurring signal.',
        todayEffect: isZh
          ? '这会让 Today 对主线建议压低时间门槛。'
          : 'This makes Today lower the time threshold for the main suggestion.',
      }
    : topFeedbackLabel === 'not_fit'
      ? {
          key: 'adaptation',
          label: isZh ? '系统适配' : 'System adaptation',
          title: isZh
            ? (completedToday ? '今天的状态已经被系统记录。' : '系统仍在等待今天的最新状态。')
            : (completedToday ? 'Today’s state has already been recorded.' : 'The system is still waiting for your latest signal today.'),
          body: isZh
            ? '系统最近收到“建议不贴合”的信号，后续应更强依赖你的真实路径与现有行动。'
            : 'The system has seen “not a fit” feedback recently, so it should rely more on your actual paths and existing actions.',
          evidence: isZh
            ? '近期反馈表明，系统需要减少抽象建议，更多贴合你当前正在推进的路径。'
            : 'Recent feedback suggests the system should reduce abstraction and anchor more tightly to your current paths.',
          todayEffect: isZh
            ? '这会让 Today 更紧贴你当前行动，而不是给泛化建议。'
            : 'This makes Today stay closer to your active work instead of offering generic advice.',
        }
      : topFeedbackLabel === 'too_hard'
        ? {
            key: 'adaptation',
            label: isZh ? '系统适配' : 'System adaptation',
            title: isZh
              ? (completedToday ? '今天的状态已经被系统记录。' : '系统仍在等待今天的最新状态。')
              : (completedToday ? 'Today’s state has already been recorded.' : 'The system is still waiting for your latest signal today.'),
            body: isZh
              ? '系统最近观察到难度可能偏高，后续应更先给最小可执行版本。'
              : 'The system has seen difficulty friction recently, so it should offer a more minimum-viable version first.',
            evidence: isZh
              ? '最近的反馈显示，当前建议的门槛对你来说偏高。'
              : 'Recent feedback shows the current recommendation threshold may be too high for you.',
            todayEffect: isZh
              ? '这会让 Today 先要求起步，再逐步加码。'
              : 'This makes Today require a start first, then scale up.',
          }
        : completedRecentCount >= 3
          ? {
              key: 'adaptation',
              label: isZh ? '系统适配' : 'System adaptation',
              title: isZh
                ? (completedToday ? '今天的状态已经被系统记录。' : '系统仍在等待今天的最新状态。')
                : (completedToday ? 'Today’s state has already been recorded.' : 'The system is still waiting for your latest signal today.'),
              body: isZh
                ? '系统已经看到你不只是会采纳建议，也会把它们推进到完成。'
                : 'The system sees that you do not just adopt suggestions, you carry them through to completion.',
              evidence: isZh
                ? `最近已有 ${completedRecentCount} 次建议被真实推进到完成。`
                : `Recent data shows ${completedRecentCount} suggestions were carried through to completion.`,
              todayEffect: isZh
                ? '这会让 Today 更相信你能接住关键推进，而不只是浅层打卡。'
                : 'This lets Today trust you with more meaningful moves instead of shallow check-ins.',
            }
          : adoptedRecentCount >= 3
            ? {
                key: 'adaptation',
                label: isZh ? '系统适配' : 'System adaptation',
                title: isZh
                  ? (completedToday ? '今天的状态已经被系统记录。' : '系统仍在等待今天的最新状态。')
                  : (completedToday ? 'Today’s state has already been recorded.' : 'The system is still waiting for your latest signal today.'),
                body: isZh
                  ? '系统已经开始看见你会回应哪些建议，但还需要更多完成信号来判断长期适配度。'
                  : 'The system is starting to see which suggestions you respond to, but it still needs more completion signals.',
                evidence: isZh
                  ? `最近已有 ${adoptedRecentCount} 次采纳信号，说明偏好正在变得可学习。`
                  : `Recent data shows ${adoptedRecentCount} adoption signals, which means your preferences are becoming learnable.`,
                todayEffect: isZh
                  ? '这会让 Today 开始微调建议力度，但还不会过度自信。'
                  : 'This lets Today start tuning intensity without becoming overconfident.',
              }
            : {
                key: 'adaptation',
                label: isZh ? '系统适配' : 'System adaptation',
                title: isZh
                  ? (completedToday ? '今天的状态已经被系统记录。' : '系统仍在等待今天的最新状态。')
                  : (completedToday ? 'Today’s state has already been recorded.' : 'The system is still waiting for your latest signal today.'),
                body: isZh
                  ? '系统对你的理解还在早期，更多真实采纳和反馈会让它更快贴合你。'
                  : 'The system is still early in its understanding of you. More real adoption and feedback will sharpen the fit.',
                evidence: isZh
                  ? '目前有效的采纳与反馈样本仍较少，系统还处在校准前期。'
                  : 'There are still too few strong adoption and feedback samples, so the system remains in an early calibration phase.',
                todayEffect: isZh
                  ? '这会让 Today 维持保守判断，继续收集你的真实反应。'
                  : 'This keeps Today conservative while it gathers more of your real reactions.',
              }

  return [rhythmCard, decisionCard, adaptationCard]
}

export function buildTodayPersonalization(params: {
  locale: Locale
  currentStreak: number
  nextActionTitle: string | null
  showStreakRiskBanner: boolean
  hasTomorrowHandoff: boolean
  signals: SelfModelSignalSummary
}): TodayPersonalization {
  const { locale, currentStreak, nextActionTitle, showStreakRiskBanner, hasTomorrowHandoff, signals } = params
  const isZh = locale === 'zh'
  const { shortSelectionCount, longSelectionCount, completedRecentCount, topFeedbackLabel } = signals
  const actionRef = nextActionTitle
    ? (isZh ? `对「${nextActionTitle}」的推进` : `progress on "${nextActionTitle}"`)
    : (isZh ? '今天的主线推进' : "today's main thread")

  if (showStreakRiskBanner) {
    return {
      eyebrow: isZh ? '今日系统解读' : 'Today System Read',
      title: isZh ? '系统把你放在“先保连续”的轨道上。' : 'The system places you on a continuity-first track today.',
      body: topFeedbackLabel === 'no_time' || shortSelectionCount >= Math.max(2, longSelectionCount * 2)
        ? (isZh
            ? '因为你最近更适合低摩擦起步，所以今天系统只要求一次最小完成；保住连续后再谈加码。'
            : 'Because you respond better to low-friction starts lately, the system only asks for one minimum completion first; scale up after continuity is safe.')
        : (isZh
            ? `你当前连续 ${currentStreak} 天，这说明 ${actionRef} 最该先变成“不会断”的节奏。`
            : `At a ${currentStreak}-day streak, ${actionRef} should first become a rhythm that does not break.`),
    }
  }

  if (hasTomorrowHandoff) {
    return {
      eyebrow: isZh ? '今日系统解读' : 'Today System Read',
      title: isZh ? '系统判断你更适合延续已有 momentum。' : 'The system sees you as someone who should extend existing momentum.',
      body: completedRecentCount >= 3
        ? (isZh
            ? '你最近不只是会采纳建议，也会把它们做完，所以今天系统优先延续昨天已经发生的推进。'
            : 'You have recently carried suggestions through to completion, so today the system prioritizes extending what already moved yesterday.')
        : (isZh
            ? '系统先用昨天已经发生的推进帮你减少重新启动成本，再决定是否加码。'
            : 'The system uses yesterday’s existing progress to reduce restart cost before deciding whether to push harder.'),
    }
  }

  if (topFeedbackLabel === 'no_time') {
    return {
      eyebrow: isZh ? '今日系统解读' : 'Today System Read',
      title: isZh ? '系统在主动压低今天的时间门槛。' : 'The system is actively lowering today’s time threshold.',
      body: isZh
        ? `最近“没时间”是你的主要阻力，所以系统会把 ${actionRef} 优先收敛成更容易开始的一步。`
        : `"No time" has been your main friction recently, so the system compresses ${actionRef} into an easier first move.`,
    }
  }

  if (topFeedbackLabel === 'too_hard') {
    return {
      eyebrow: isZh ? '今日系统解读' : 'Today System Read',
      title: isZh ? '系统先给你最小可执行版本。' : 'The system starts with a minimum viable version for you.',
      body: isZh
        ? `最近的难度反馈说明门槛偏高，所以系统会先把 ${actionRef} 降到可启动，再逐步抬高。`
        : 'Recent difficulty feedback shows the bar may be too high, so the system reduces the threshold before raising it again.',
    }
  }

  if (shortSelectionCount >= Math.max(2, longSelectionCount * 2)) {
    return {
      eyebrow: isZh ? '今日系统解读' : 'Today System Read',
      title: isZh ? '系统会先让今天更容易开始。' : 'The system will make today easier to start.',
      body: isZh
        ? `你最近更常采纳 5-10 分钟版本，所以系统会先把 ${actionRef} 压缩成一个低摩擦起步动作。`
        : `You have been choosing 5-10 minute versions more often, so the system compresses ${actionRef} into a low-friction first step.`,
    }
  }

  if (longSelectionCount >= Math.max(2, shortSelectionCount + 1)) {
    return {
      eyebrow: isZh ? '今日系统解读' : 'Today System Read',
      title: isZh ? '系统判断你今天能承接更完整的推进窗口。' : 'The system believes you can handle a fuller execution window today.',
      body: isZh
        ? `你最近能接住更完整版本，所以系统不会把 ${actionRef} 过度切碎。`
        : `You have been able to handle fuller versions lately, so the system will not overshrink ${actionRef}.`,
    }
  }

  return {
    eyebrow: isZh ? '今日系统解读' : 'Today System Read',
    title: isZh ? '系统还在继续校准你的最佳节奏。' : 'The system is still calibrating your best pace.',
    body: isZh
      ? `当前系统会给 ${actionRef} 一个中性强度判断，并继续根据你的采纳与完成结果修正。`
      : `For now the system gives ${actionRef} a moderate intensity, then keeps adapting based on your adoption and completion signals.`,
  }
}
