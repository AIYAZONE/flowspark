import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildStreakFeedback,
  isStreakFeedbackFresh,
  formatStreakFeedbackCopy,
} from './streak-feedback.ts'

test('护盾到账反馈在有效期内可展示', () => {
  const feedback = buildStreakFeedback(
    {
      kind: 'shield_granted',
      rule: 'first_3_day',
      grantedAtStreak: 3,
      shieldBalanceAfter: 1,
    },
    { now: 1000 }
  )

  assert.equal(isStreakFeedbackFresh(feedback, { now: 1000, maxAgeMs: 60_000 }), true)
  assert.equal(isStreakFeedbackFresh(feedback, { now: 61_001, maxAgeMs: 60_000 }), false)
})

test('护盾到账反馈文案包含门槛与库存（中文）', () => {
  const feedback = buildStreakFeedback(
    {
      kind: 'shield_granted',
      rule: 'refill_7_day',
      grantedAtStreak: 7,
      shieldBalanceAfter: 2,
    },
    { now: 1000 }
  )

  const copy = formatStreakFeedbackCopy(feedback, { locale: 'zh' })
  assert.equal(copy.tone, 'success')
  assert.ok(copy.body.includes('7'))
  assert.ok(copy.body.includes('2'))
})

test('恢复成功反馈文案可被格式化（中文）', () => {
  const feedback = buildStreakFeedback(
    {
      kind: 'recovery_success',
      targetDate: '2026-06-14',
      currentStreak: 3,
    },
    { now: 1000 }
  )

  const copy = formatStreakFeedbackCopy(feedback, { locale: 'zh' })
  assert.equal(copy.tone, 'success')
  assert.ok(copy.title.includes('已补回'))
  assert.ok(copy.body.includes('连续'))
})

test('Rescue 采用反馈文案可被格式化（英文）', () => {
  const feedback = buildStreakFeedback(
    {
      kind: 'rescue_adopted',
      minutes: 5,
      mode: 'replace',
    },
    { now: 1000 }
  )

  const copy = formatStreakFeedbackCopy(feedback, { locale: 'en' })
  assert.equal(copy.tone, 'info')
  assert.ok(copy.title.toLowerCase().includes('streak'))
})

test('阶段里程碑反馈文案可被格式化（中文）', () => {
  const feedback = buildStreakFeedback(
    {
      kind: 'milestone_reached',
      milestone: 60,
      phaseKey: 'deepening',
    },
    { now: 1000 }
  )

  const copy = formatStreakFeedbackCopy(feedback, { locale: 'zh' })
  assert.equal(copy.tone, 'success')
  assert.ok(copy.title.includes('60'))
  assert.ok(copy.body.includes('深耕'))
})
