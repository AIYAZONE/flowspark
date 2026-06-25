import assert from 'node:assert/strict'
import test from 'node:test'

import { getLandingCapabilities } from './landing-capabilities.ts'

test('按 Direction / Execution / Intelligence 返回品牌能力卡元数据', () => {
  const cards = getLandingCapabilities()

  assert.deepEqual(cards.map((card) => card.key), ['focus', 'growth', 'insight'])
  assert.deepEqual(cards.map((card) => card.eyebrow), ['Direction', 'Execution', 'Intelligence'])
})

test('每张能力卡都带有克制的品牌 tone，而不是彩色功能卡 tone', () => {
  const cards = getLandingCapabilities()

  assert.deepEqual(cards.map((card) => card.accentClass), [
    'text-primary/80',
    'text-violet-300/80',
    'text-sky-300/80',
  ])
  assert.deepEqual(cards.map((card) => card.surfaceClass), [
    'bg-primary/[0.035]',
    'bg-violet-400/[0.035]',
    'bg-sky-400/[0.035]',
  ])
})
