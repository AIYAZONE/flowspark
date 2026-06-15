import test from 'node:test'
import assert from 'node:assert/strict'

import { buildContinuityInsightCopy } from './continuity-insight.ts'

test('短时版本使用偏多时建议低摩擦起步', () => {
  const copy = buildContinuityInsightCopy({
    locale: 'zh',
    currentStreak: 3,
    shieldBalance: 1,
    repairCount30: 0,
    shortOptionShare: 0.75,
  })
  assert.ok(copy.advice.includes('低摩擦') || copy.advice.includes('更容易开始'))
})

test('最近有恢复记录时建议优先保连续', () => {
  const copy = buildContinuityInsightCopy({
    locale: 'zh',
    currentStreak: 1,
    shieldBalance: 0,
    repairCount30: 2,
    shortOptionShare: 0.2,
  })
  assert.ok(copy.advice.includes('优先保连续'))
})

test('连续稳定且少恢复时建议逐步提高强度（英文）', () => {
  const copy = buildContinuityInsightCopy({
    locale: 'en',
    currentStreak: 10,
    shieldBalance: 2,
    repairCount30: 0,
    shortOptionShare: 0.1,
  })
  assert.ok(copy.advice.toLowerCase().includes('ramp'))
})

