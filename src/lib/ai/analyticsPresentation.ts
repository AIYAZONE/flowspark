type Locale = 'zh' | 'en'

type RecommendationStatusInput = {
  completed: boolean | null
  adopted: boolean | null
  status: string
  feedbackLabel: string | null
  fallbackUsed: boolean
}

const SCENE_META = {
  today_plan: {
    zh: { label: '今日建议', description: 'AI 帮你决定今天最值得先做的行动。' },
    en: { label: 'Today Plan', description: 'AI suggests the best action to focus on today.' },
  },
  rescue: {
    zh: { label: '遇阻救援', description: '当你卡住时，AI 给出更容易起步的建议。' },
    en: { label: 'Rescue', description: 'AI gives an easier next step when you get stuck.' },
  },
  review: {
    zh: { label: '复盘建议', description: 'AI 根据今天的执行情况给出复盘与明日提醒。' },
    en: { label: 'Review', description: 'AI reflects on today and suggests what to watch tomorrow.' },
  },
  weekly_insight: {
    zh: { label: '周洞察', description: 'AI 总结你最近一周的节奏、阻力和下周建议。' },
    en: { label: 'Weekly Insight', description: 'AI summarizes your weekly rhythm, frictions, and next-week suggestion.' },
  },
} satisfies Record<string, Record<Locale, { label: string; description: string }>>

const STATUS_META = {
  generated: { zh: '已生成', en: 'Generated' },
  adopted: { zh: '已采纳', en: 'Adopted' },
  completed: { zh: '已完成', en: 'Completed' },
  dismissed: { zh: '已关闭', en: 'Dismissed' },
  fallback: { zh: '规则兜底', en: 'Rule fallback' },
} satisfies Record<string, Record<Locale, string>>

const CONFIDENCE_META = {
  high: { zh: '高', en: 'High' },
  medium: { zh: '中', en: 'Medium' },
  low: { zh: '低', en: 'Low' },
} satisfies Record<string, Record<Locale, string>>

const FRICTION_META = {
  no_time: { zh: '没时间', en: 'No time' },
  low_energy: { zh: '没精力', en: 'Low energy' },
  too_hard: { zh: '太难了', en: 'Too hard' },
  anxiety: { zh: '有压力', en: 'Anxiety' },
  unclear_next: { zh: '下一步不明确', en: 'Unclear next step' },
  other: { zh: '其他', en: 'Other' },
} satisfies Record<string, Record<Locale, string>>

function extractVersion(value: string | null | undefined) {
  const match = (value || '').match(/v\d+$/i)
  return match?.[0]?.toUpperCase() || null
}

function localized(locale: Locale, zh: string, en: string) {
  return locale === 'zh' ? zh : en
}

export function formatAISceneLabel(scene: string | null | undefined, locale: Locale) {
  if (!scene) return '-'
  return SCENE_META[scene]?.[locale].label || scene
}

export function formatAISceneDescription(scene: string | null | undefined, locale: Locale) {
  if (!scene) return null
  return SCENE_META[scene]?.[locale].description || null
}

export function formatAIStatusLabel(input: RecommendationStatusInput, locale: Locale) {
  if (input.completed) return STATUS_META.completed[locale]
  if (input.adopted) return STATUS_META.adopted[locale]
  if (input.status === 'dismissed' || input.feedbackLabel === 'dismiss' || input.feedbackLabel === 'close_result') {
    return STATUS_META.dismissed[locale]
  }
  if (input.fallbackUsed) return STATUS_META.fallback[locale]
  return STATUS_META.generated[locale]
}

export function formatAIConfidenceLabel(value: string | null | undefined, locale: Locale) {
  if (!value) return '-'
  return CONFIDENCE_META[value]?.[locale] || value
}

export function formatAIFallbackLabel(value: boolean, locale: Locale) {
  return value
    ? localized(locale, '是，走了规则兜底', 'Yes, rule fallback was used')
    : localized(locale, '否，直接由 AI 生成', 'No, generated directly by AI')
}

export function formatAIBooleanLabel(value: boolean | null | undefined, locale: Locale) {
  if (value == null) return '-'
  return localized(locale, value ? '是' : '否', value ? 'Yes' : 'No')
}

export function formatAIModelLabel(model: string | null | undefined, locale: Locale) {
  if (!model) return '-'
  if (model === 'fallback_rule_v1') return localized(locale, '规则兜底', 'Rule fallback')
  if (model.toLowerCase().includes('deepseek')) return localized(locale, 'DeepSeek AI 模型', 'DeepSeek AI model')
  if (model.toLowerCase().includes('openai')) return localized(locale, 'OpenAI AI 模型', 'OpenAI AI model')
  return model
}

export function formatAIStrategyLabel(scene: string | null | undefined, strategy: string | null | undefined, locale: Locale) {
  if (!strategy) return '-'
  const normalized = strategy.toLowerCase()
  const version = extractVersion(strategy)
  if (normalized.startsWith('phase_b')) {
    if (scene === 'rescue') {
      return localized(locale, `救援建议策略${version ? ` ${version}` : ''}`, `Rescue strategy${version ? ` ${version}` : ''}`)
    }
    if (scene === 'review') {
      return localized(locale, `复盘建议策略${version ? ` ${version}` : ''}`, `Review strategy${version ? ` ${version}` : ''}`)
    }
    return localized(locale, `策略方案${version ? ` ${version}` : ''}`, `Strategy${version ? ` ${version}` : ''}`)
  }
  if (normalized.startsWith('phase_c')) {
    return localized(locale, `今日建议策略${version ? ` ${version}` : ''}`, `Today planning strategy${version ? ` ${version}` : ''}`)
  }
  if (normalized.startsWith('phase_d')) {
    return localized(locale, `周洞察策略${version ? ` ${version}` : ''}`, `Weekly insight strategy${version ? ` ${version}` : ''}`)
  }
  if (scene === 'rescue') {
    return localized(locale, `救援建议策略${version ? ` ${version}` : ''}`, `Rescue strategy${version ? ` ${version}` : ''}`)
  }
  if (scene === 'review') {
    return localized(locale, `复盘建议策略${version ? ` ${version}` : ''}`, `Review strategy${version ? ` ${version}` : ''}`)
  }
  return strategy
}

export function formatAIPromptLabel(scene: string | null | undefined, prompt: string | null | undefined, locale: Locale) {
  if (!prompt) return '-'
  const version = extractVersion(prompt)
  if (prompt.startsWith('today_plan')) {
    return localized(locale, `今日建议提示词${version ? ` ${version}` : ''}`, `Today plan prompt${version ? ` ${version}` : ''}`)
  }
  if (prompt.startsWith('weekly_insight')) {
    return localized(locale, `周洞察提示词${version ? ` ${version}` : ''}`, `Weekly insight prompt${version ? ` ${version}` : ''}`)
  }
  if (scene === 'rescue') {
    return localized(locale, `救援建议提示词${version ? ` ${version}` : ''}`, `Rescue prompt${version ? ` ${version}` : ''}`)
  }
  if (scene === 'review') {
    return localized(locale, `复盘建议提示词${version ? ` ${version}` : ''}`, `Review prompt${version ? ` ${version}` : ''}`)
  }
  return prompt
}

export function formatAIFrictionLabel(value: string | null | undefined, locale: Locale) {
  if (!value) return '-'
  return FRICTION_META[value]?.[locale] || value
}

export function formatAIOptionLabel(value: string | null | undefined, locale: Locale) {
  if (!value) return '-'
  if (value === 'dismiss' || value === 'close_result') return localized(locale, '关闭这条建议', 'Dismissed this suggestion')
  return value
}

export function getAIFieldHelpText(field: 'strategy' | 'model' | 'metrics' | 'technical', locale: Locale) {
  if (field === 'strategy') {
    return localized(locale, '展示系统用了哪种生成方案；供深入查看，普通使用可忽略。', 'Shows which generation setup the system used; optional for most users.')
  }
  if (field === 'model') {
    return localized(locale, '展示建议来自 AI 模型还是规则兜底；供参考。', 'Shows whether a suggestion came from an AI model or a rule fallback.')
  }
  if (field === 'metrics') {
    return localized(locale, '这些指标帮助你判断哪类 AI 建议更容易被采纳并完成。', 'These metrics show which kinds of AI suggestions are more likely to be adopted and completed.')
  }
  return localized(locale, '以下为技术细节，用于解释系统如何生成这条建议；普通使用可忽略。', 'Technical details below explain how the system generated this suggestion; optional for normal use.')
}
