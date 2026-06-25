import test from 'node:test'
import assert from 'node:assert/strict'

import { getLandingHeroSignals } from './landing-hero-signals.ts'

test('从 hero.signals 读取完整信号并忽略不完整项', () => {
  const signals = getLandingHeroSignals({
    signals: [
      { label: 'Direction', value: 'Long-term direction', detail: 'Compress ambition into today.' },
      { label: 'Execution', value: 'Daily traction' },
      { label: 'Intelligence', value: 'System judgment', detail: 'AI learns your rhythm.' },
    ],
  })

  assert.deepEqual(signals, [
    { label: 'Direction', value: 'Long-term direction', detail: 'Compress ambition into today.' },
    { label: 'Intelligence', value: 'System judgment', detail: 'AI learns your rhythm.' },
  ])
})

test('当 hero.signals 缺失时返回空数组', () => {
  assert.deepEqual(getLandingHeroSignals({}), [])
})
