import test from 'node:test'
import assert from 'node:assert/strict'

import { getGoalEntryFooterLayout } from './goal-entry-footer-layout.ts'

test('GoalEntry 详情弹窗：桌面端使用横向按钮组布局', () => {
  assert.equal(getGoalEntryFooterLayout(true), 'row')
})

test('GoalEntry 详情弹窗：移动端使用 2 列网格布局', () => {
  assert.equal(getGoalEntryFooterLayout(false), 'grid')
})
