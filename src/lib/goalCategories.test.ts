import test from 'node:test'
import assert from 'node:assert/strict'

const { getAreaDefaultOrder, getAreaDefaultIcon, UNCATEGORIZED_CATEGORY_KEY, AREA_DEFAULT_ORDER } =
  await import(new URL('./goalCategories.ts', import.meta.url).href)

test('领域默认排序：内置领域排在「未分类」之前', () => {
  const builtins = ['personal_brand', 'company_project', 'health', 'career', 'learning', 'finance', 'lifestyle', 'social']
  const otherOrder = getAreaDefaultOrder(UNCATEGORIZED_CATEGORY_KEY)
  assert.equal(otherOrder, 999)
  for (const key of builtins) {
    assert.ok(getAreaDefaultOrder(key) < otherOrder, `${key} 应排在未分类之前`)
  }
})

test('领域默认排序：自定义领域回退 100，仍排在「未分类」之前', () => {
  assert.equal(getAreaDefaultOrder('my_custom_area'), 100)
  assert.ok(getAreaDefaultOrder('my_custom_area') < getAreaDefaultOrder(UNCATEGORIZED_CATEGORY_KEY))
})

test('领域默认图标：内置键映射到具体图标，未知键回退 circle', () => {
  assert.equal(getAreaDefaultIcon('health'), 'heart-pulse')
  assert.equal(getAreaDefaultIcon('finance'), 'wallet')
  assert.equal(getAreaDefaultIcon('totally_unknown'), 'circle')
})

test('未分类常量与默认排序表完整性', () => {
  assert.equal(UNCATEGORIZED_CATEGORY_KEY, 'other')
  assert.equal(AREA_DEFAULT_ORDER.other, 999)
  // 内置 8 类 + 其他，共 9 项
  assert.equal(Object.keys(AREA_DEFAULT_ORDER).length, 9)
})
