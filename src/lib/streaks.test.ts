import test from 'node:test'
import assert from 'node:assert/strict'

import {
  computeStreakSnapshot,
  getShieldGrantDecision,
} from './streaks.ts'

test('今天已完成时，连续天数从今天开始连续回溯', () => {
  const snapshot = computeStreakSnapshot({
    today: '2026-06-15',
    completedDates: ['2026-06-15', '2026-06-14', '2026-06-13', '2026-06-11'],
    repairDates: [],
    shieldBalance: 1,
  })

  assert.equal(snapshot.currentStreak, 3)
  assert.equal(snapshot.longestStreak, 3)
  assert.equal(snapshot.recoverableMissDate, null)
  assert.equal(snapshot.completedToday, true)
  assert.equal(snapshot.shieldBalance, 1)
})

test('昨天缺失且仅缺 1 天时，可恢复日期只指向昨天', () => {
  const snapshot = computeStreakSnapshot({
    today: '2026-06-15',
    completedDates: ['2026-06-13', '2026-06-12'],
    repairDates: [],
    shieldBalance: 1,
  })

  assert.equal(snapshot.currentStreak, 0)
  assert.equal(snapshot.longestStreak, 2)
  assert.equal(snapshot.recoverableMissDate, '2026-06-14')
  assert.equal(snapshot.usedRepairYesterday, false)
})

test('昨天已通过修复补回时，连续天数会把修复日期视为有效', () => {
  const snapshot = computeStreakSnapshot({
    today: '2026-06-15',
    completedDates: ['2026-06-13', '2026-06-12'],
    repairDates: ['2026-06-14'],
    shieldBalance: 0,
  })

  assert.equal(snapshot.currentStreak, 3)
  assert.equal(snapshot.longestStreak, 3)
  assert.equal(snapshot.recoverableMissDate, null)
  assert.equal(snapshot.usedRepairYesterday, true)
})

test('缺口超过 1 天时不可恢复昨天', () => {
  const snapshot = computeStreakSnapshot({
    today: '2026-06-15',
    completedDates: ['2026-06-12', '2026-06-10'],
    repairDates: [],
    shieldBalance: 1,
  })

  assert.equal(snapshot.currentStreak, 0)
  assert.equal(snapshot.longestStreak, 1)
  assert.equal(snapshot.recoverableMissDate, null)
})

test('首次达到 3 天连续且没有护盾时发放首个护盾', () => {
  const grant = getShieldGrantDecision({
    currentStreak: 3,
    shieldBalance: 0,
    lastShieldGrantedForStreak: null,
  })

  assert.deepEqual(grant, {
    shouldGrant: true,
    nextBalance: 1,
    grantedRule: 'first_3_day',
    grantedAtStreak: 3,
    nextGrantAtStreak: 7,
  })
})

test('达到 7 天连续且当前无护盾时补充护盾', () => {
  const grant = getShieldGrantDecision({
    currentStreak: 7,
    shieldBalance: 0,
    lastShieldGrantedForStreak: 3,
  })

  assert.deepEqual(grant, {
    shouldGrant: true,
    nextBalance: 1,
    grantedRule: 'refill_7_day',
    grantedAtStreak: 7,
    nextGrantAtStreak: 14,
  })
})

test('达到 7 天连续且库存未满时允许在已有护盾基础上继续累积', () => {
  const grant = getShieldGrantDecision({
    currentStreak: 7,
    shieldBalance: 1,
    lastShieldGrantedForStreak: 3,
  })

  assert.deepEqual(grant, {
    shouldGrant: true,
    nextBalance: 2,
    grantedRule: 'refill_7_day',
    grantedAtStreak: 7,
    nextGrantAtStreak: 14,
  })
})

test('达到 14 天连续且库存接近上限时会补满到 3', () => {
  const grant = getShieldGrantDecision({
    currentStreak: 14,
    shieldBalance: 2,
    lastShieldGrantedForStreak: 7,
  })

  assert.deepEqual(grant, {
    shouldGrant: true,
    nextBalance: 3,
    grantedRule: 'refill_7_day',
    grantedAtStreak: 14,
    nextGrantAtStreak: 21,
  })
})

test('库存达到上限 3 时，即使满足门槛也不再发放', () => {
  const grant = getShieldGrantDecision({
    currentStreak: 14,
    shieldBalance: 3,
    lastShieldGrantedForStreak: 7,
  })

  assert.deepEqual(grant, {
    shouldGrant: false,
    nextBalance: 3,
    grantedRule: null,
    grantedAtStreak: null,
    nextGrantAtStreak: 14,
  })
})

test('连续天数超过门槛但非刚好达成时不补发护盾', () => {
  const grant = getShieldGrantDecision({
    currentStreak: 8,
    shieldBalance: 1,
    lastShieldGrantedForStreak: 3,
  })

  assert.deepEqual(grant, {
    shouldGrant: false,
    nextBalance: 1,
    grantedRule: null,
    grantedAtStreak: null,
    nextGrantAtStreak: 7,
  })
})
