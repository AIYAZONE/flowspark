import test from 'node:test'
import assert from 'node:assert/strict'

import { formatSystemNotificationCopy } from './notifications.ts'

test('系统通知：护盾发放文案可格式化（中文）', () => {
  const copy = formatSystemNotificationCopy(
    {
      id: 'n1',
      kind: 'shield_granted',
      payload: {
        rule: 'refill_7_day',
        grantedAtStreak: 7,
        shieldBalanceAfter: 2,
      },
      read_at: null,
      created_at: '2026-06-17T00:00:00Z',
    },
    { locale: 'zh' }
  )

  assert.equal(copy.tone, 'success')
  assert.ok(copy.title.includes('护盾'))
  assert.ok(copy.body.includes('7'))
  assert.ok(copy.body.includes('2'))
})

test('系统通知：补回成功文案可格式化（中文）', () => {
  const copy = formatSystemNotificationCopy(
    {
      id: 'n2',
      kind: 'recovery_success',
      payload: {
        targetDate: '2026-06-16',
        currentStreak: 8,
      },
      read_at: null,
      created_at: '2026-06-17T00:00:00Z',
    },
    { locale: 'zh' }
  )

  assert.equal(copy.tone, 'success')
  assert.ok(copy.title.includes('补回'))
  assert.ok(copy.body.includes('2026-06-16'))
})

test('系统通知：里程碑达成文案可格式化（中文）', () => {
  const copy = formatSystemNotificationCopy(
    {
      id: 'n3',
      kind: 'milestone_reached',
      payload: {
        milestone: 30,
        phaseKey: 'steady',
      },
      read_at: null,
      created_at: '2026-06-17T00:00:00Z',
    },
    { locale: 'zh' }
  )

  assert.equal(copy.tone, 'success')
  assert.ok(copy.title.includes('30'))
  assert.ok(copy.body.includes('稳定'))
})
