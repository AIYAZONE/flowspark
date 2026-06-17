import test from 'node:test'
import assert from 'node:assert/strict'

import { buildNotificationDedupeKey } from './keys.ts'

test('dedupe key: shield_granted uses grantedAtStreak', () => {
  assert.equal(
    buildNotificationDedupeKey({
      kind: 'shield_granted',
      payload: { grantedAtStreak: 7 },
    }),
    'shield_granted:7'
  )
})

test('dedupe key: milestone_reached uses milestone', () => {
  assert.equal(
    buildNotificationDedupeKey({
      kind: 'milestone_reached',
      payload: { milestone: 30 },
    }),
    'milestone_reached:30'
  )
})

test('dedupe key: recovery_success uses targetDate', () => {
  assert.equal(
    buildNotificationDedupeKey({
      kind: 'recovery_success',
      payload: { targetDate: '2026-06-16' },
    }),
    'recovery_success:2026-06-16'
  )
})
