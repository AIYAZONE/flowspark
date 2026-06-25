import test from 'node:test'
import assert from 'node:assert/strict'

import { getLandingTrajectoryMetrics, getLandingTrajectoryTone } from './landing-trajectory.ts'

test('返回 3 个固定信号，顺序为 Direction / Rhythm / Stability', () => {
  const metrics = getLandingTrajectoryMetrics()

  assert.equal(metrics.score, 86)
  assert.deepEqual(
    metrics.signals.map((signal) => signal.key),
    ['direction', 'rhythm', 'stability']
  )
})

test('每个趋势序列都只包含 0 到 100 之间的数值', () => {
  const metrics = getLandingTrajectoryMetrics()

  for (const signal of metrics.signals) {
    assert.ok(signal.trend.length >= 4)

    for (const point of signal.trend) {
      assert.equal(typeof point, 'number')
      assert.ok(point >= 0 && point <= 100)
    }
  }
})

test('状态词映射能为三个信号提供 tone', () => {
  const metrics = getLandingTrajectoryMetrics()
  const tones = metrics.signals.map((signal) => getLandingTrajectoryTone(signal.key))

  assert.deepEqual(tones, ['emerald', 'amber', 'blue'])
})
