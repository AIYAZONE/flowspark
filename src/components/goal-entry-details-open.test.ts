import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldOpenGoalEntryDetails } from './goal-entry-details-open.ts'

test('灵感/心路旅程：PC 端也允许点击打开详情弹窗（未命中忽略规则时）', () => {
  assert.equal(
    shouldOpenGoalEntryDetails({ isTabletAndUp: true, shouldIgnoreTarget: false }),
    true
  )
})

test('灵感/心路旅程：命中忽略规则时不打开详情弹窗', () => {
  assert.equal(
    shouldOpenGoalEntryDetails({ isTabletAndUp: false, shouldIgnoreTarget: true }),
    false
  )
  assert.equal(
    shouldOpenGoalEntryDetails({ isTabletAndUp: true, shouldIgnoreTarget: true }),
    false
  )
})

