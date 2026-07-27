import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldHideQuickAccess } from './quick-access-visibility.ts'

test('shouldHideQuickAccess hides floating quick access on chat and system pages', () => {
  assert.equal(shouldHideQuickAccess('/chat'), true)
  assert.equal(shouldHideQuickAccess('/system'), true)
  assert.equal(shouldHideQuickAccess('/today'), false)
  assert.equal(shouldHideQuickAccess('/goals/123'), false)
})
