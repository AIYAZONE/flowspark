import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldOpenInboxItemDetails } from './inbox-item-details-open.ts'

test('灵感收件箱：PC 端也允许点击打开详情弹窗（未命中忽略规则时）', () => {
  assert.equal(
    shouldOpenInboxItemDetails({ shouldIgnoreTarget: false }),
    true
  )
})

test('灵感收件箱：命中忽略规则时不打开详情弹窗', () => {
  assert.equal(
    shouldOpenInboxItemDetails({ shouldIgnoreTarget: true }),
    false
  )
})

