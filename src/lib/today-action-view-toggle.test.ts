import test from 'node:test'
import assert from 'node:assert/strict'

import { getTodayActionViewToggleState } from './today-action-view-toggle.ts'

test('getTodayActionViewToggleState marks focus as active when current view is focus', () => {
  assert.deepEqual(getTodayActionViewToggleState('focus'), {
    focusDisabled: true,
    focusVariant: 'default',
    allDisabled: false,
    allVariant: 'outline',
  })
})

test('getTodayActionViewToggleState marks all as active when current view is all', () => {
  assert.deepEqual(getTodayActionViewToggleState('all'), {
    focusDisabled: false,
    focusVariant: 'outline',
    allDisabled: true,
    allVariant: 'default',
  })
})

