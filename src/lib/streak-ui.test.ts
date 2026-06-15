import test from 'node:test'
import assert from 'node:assert/strict'

import { getShieldBadgeAction, getShieldBadgeDialogCopy, getStreakStatusCopy } from './streak-ui.ts'

test('可恢复且有护盾时给出恢复按钮文案', () => {
  const copy = getStreakStatusCopy({
    locale: 'zh',
    streak: 5,
    todayCompleted: false,
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
    todayCompleted: false,
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
    todayCompleted: false,
    shieldBalance: 0,
    recoverableMissDate: null,
    nextGrantAtStreak: 7,
  })
  assert.ok(copy.title.toLowerCase().includes('keeps'))
  assert.equal(copy.action, null)
})

test('今天已完成时显示已保住连续，而不是继续推进提醒', () => {
  const copy = getStreakStatusCopy({
    locale: 'zh',
    streak: 3,
    todayCompleted: true,
    shieldBalance: 1,
    recoverableMissDate: null,
    nextGrantAtStreak: 7,
  })

  assert.ok(copy.title.includes('已保住'))
  assert.equal(copy.action, null)
})

test('streak 为 0 时引导重新开始', () => {
  const copy = getStreakStatusCopy({
    locale: 'en',
    streak: 0,
    todayCompleted: false,
    shieldBalance: 0,
    recoverableMissDate: null,
    nextGrantAtStreak: 3,
  })
  assert.ok(copy.title.toLowerCase().includes('restart'))
})

test('有可恢复日期且有护盾时，badge 点击走恢复流程', () => {
  assert.equal(
    getShieldBadgeAction({
      shieldBalance: 1,
      recoverableMissDate: '2026-06-14',
    }),
    'recover',
  )
})

test('不可恢复时，badge 点击打开规则说明', () => {
  assert.equal(
    getShieldBadgeAction({
      shieldBalance: 2,
      recoverableMissDate: null,
    }),
    'rules',
  )
})

test('badge 规则说明会包含当前护盾与下一次门槛', () => {
  const copy = getShieldBadgeDialogCopy({
    locale: 'zh',
    shieldBalance: 2,
    nextGrantAtStreak: 14,
  })

  assert.ok(copy.title.includes('护盾'))
  assert.ok(copy.body.includes('2'))
  assert.ok(copy.body.includes('14'))
})
