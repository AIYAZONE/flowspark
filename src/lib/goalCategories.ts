import type en from '@/i18n/en.json'

export type Dict = typeof en

export const BUILTIN_GOAL_CATEGORY_KEYS = [
  'personal_brand',
  'company_project',
  'health',
  'career',
  'learning',
  'finance',
  'lifestyle',
  'social',
  'other',
] as const

export type BuiltinGoalCategoryKey = (typeof BUILTIN_GOAL_CATEGORY_KEYS)[number]

export function isBuiltinGoalCategory(value: string): value is BuiltinGoalCategoryKey {
  return (BUILTIN_GOAL_CATEGORY_KEYS as readonly string[]).includes(value)
}

export function normalizeCategoryInput(input: unknown, maxLength = 40): string {
  const raw = typeof input === 'string' ? input : ''
  const normalized = raw.trim().replace(/\s+/g, ' ')
  if (!normalized) return 'other'
  if (normalized.length <= maxLength) return normalized
  return normalized.slice(0, maxLength)
}

// 将表单/接口输入解析为去重、裁剪、最多 12 个的标签数组。
export function normalizeTagsInput(input: unknown, maxTags = 12, maxLength = 40): string[] {
  const raw = typeof input === 'string' ? input.split(',') : Array.isArray(input) ? input : []
  const out = new Set<string>()
  for (const item of raw) {
    if (out.size >= maxTags) break
    const t = typeof item === 'string' ? item.trim().replace(/\s+/g, ' ') : ''
    if (!t) continue
    if (t.length <= maxLength) out.add(t)
    else out.add(t.slice(0, maxLength))
  }
  return Array.from(out)
}

export function getCategoryLabel(dict: Dict, category: unknown): string {
  const value = typeof category === 'string' ? category : ''
  if (!value) return dict.goals.category.other

  const builtinLabel = (dict.goals.category as Record<string, string>)[value]
  if (builtinLabel) return builtinLabel

  return value
}

export type CategoryOption = {
  value: string
  label: string
  isBuiltin: boolean
}

export function buildCategoryOptions(params: {
  dict: Dict
  usedCategories?: Array<string | null | undefined>
  includeAll?: boolean
}): CategoryOption[] {
  const { dict, usedCategories, includeAll } = params
  const options: CategoryOption[] = []

  if (includeAll) {
    options.push({ value: 'all', label: dict.goals.filter.allCategory, isBuiltin: true })
  }

  for (const key of BUILTIN_GOAL_CATEGORY_KEYS) {
    options.push({ value: key, label: getCategoryLabel(dict, key), isBuiltin: true })
  }

  if (!usedCategories || usedCategories.length === 0) return options

  const builtinSet = new Set<string>(BUILTIN_GOAL_CATEGORY_KEYS)
  const customSet = new Set<string>()

  for (const category of usedCategories) {
    if (!category) continue
    if (builtinSet.has(category)) continue
    customSet.add(category)
  }

  const customSorted = Array.from(customSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )

  for (const value of customSorted) {
    options.push({ value, label: value, isBuiltin: false })
  }

  return options
}

// ---- Area (领域) 呈现默认值 ----
// goal 的"领域"由 goals.category 文本承载（内置 8 类 + 自定义）。
// 以下常量提供领域在 /goals 分组的默认排序与默认图标，用户可在 area_meta 中覆盖。

export const UNCATEGORIZED_CATEGORY_KEY = 'other'

// 默认排序：内置领域按此序，自定义领域回退 100，"其他/未分类"置底 999。
export const AREA_DEFAULT_ORDER: Record<string, number> = {
  personal_brand: 0,
  company_project: 1,
  health: 2,
  career: 3,
  learning: 4,
  finance: 5,
  lifestyle: 6,
  social: 7,
  other: 999,
}

// 默认图标（lucide 图标名，kebab-case，供组件侧映射为组件）。
export const AREA_DEFAULT_ICON: Record<string, string> = {
  personal_brand: 'sparkles',
  company_project: 'briefcase',
  health: 'heart-pulse',
  career: 'trending-up',
  learning: 'graduation-cap',
  finance: 'wallet',
  lifestyle: 'smile',
  social: 'users',
  other: 'circle',
}

export function getAreaDefaultOrder(categoryKey: string): number {
  return AREA_DEFAULT_ORDER[categoryKey] ?? 100
}

export function getAreaDefaultIcon(categoryKey: string): string {
  return AREA_DEFAULT_ICON[categoryKey] ?? 'circle'
}

// area_meta 表行类型（用户级领域呈现元信息）
export interface AreaMeta {
  id: string
  user_id: string
  category_key: string
  sort_order: number
  icon: string
  description: string | null
  created_at: string
  updated_at: string
}
