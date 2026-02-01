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
