import test from 'node:test'
import assert from 'node:assert/strict'

import { getStreakStatusCopy } from './streak-ui.ts'

test('可恢复且有护盾时给出恢复按钮文案', () => {
  const copy = getStreakStatusCopy({
    locale: 'zh',
    streak: 5,
    shieldBalance: 2,
    recoverableMissDate: '2026-06-14',
    nextGrantAtStreak: 7,
  })
  assert.ok(copy.title.includes('还能补回'))
  assert.ok(copy.action)
})

test('可恢复但无护盾时不展示恢复按钮', () => {
  const copy = getStreakStatusCopy({
    locale: 'zh',
    streak: 5,
    shieldBalance: 0,
    recoverableMissDate: '2026-06-14',
    nextGrantAtStreak: 7,
  })
  assert.ok(copy.title.includes('没有护盾'))
  assert.equal(copy.action, null)
})

test('正常保持中给出最小行动建议', () => {
  const copy = getStreakStatusCopy({
    locale: 'en',
    streak: 3,
    shieldBalance: 0,
    recoverableMissDate: null,
    nextGrantAtStreak: 7,
  })
  assert.ok(copy.title.toLowerCase().includes('keeps'))
  assert.equal(copy.action, null)
})

test('streak 为 0 时引导重新开始', () => {
  const copy = getStreakStatusCopy({
    locale: 'en',
    streak: 0,
    shieldBalance: 0,
    recoverableMissDate: null,
    nextGrantAtStreak: 3,
  })
  assert.ok(copy.title.toLowerCase().includes('restart'))
})

