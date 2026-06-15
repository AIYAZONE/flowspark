import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getCelebrationMilestone,
  getPhaseRanges,
  getNextPhaseTarget,
  getStageMilestoneWindow,
  getStreakMilestoneSummary,
} from './streak-milestones.ts'

test('低 streak 时展示短期里程碑窗口', () => {
  assert.deepEqual(getStageMilestoneWindow(5), [1, 3, 7, 14, 30])
})

test('中期 streak 时窗口会滑动到当前附近阶段', () => {
  assert.deepEqual(getStageMilestoneWindow(42), [14, 30, 60, 90, 180])
})

test('超过 365 天后仍然会生成更长期的下一阶段', () => {
  const summary = getStreakMilestoneSummary(420)

  assert.equal(summary.currentMilestone, 365)
  assert.equal(summary.nextMilestone, 730)
  assert.equal(summary.progressPercent, 15)
  assert.equal(summary.currentPhaseKey, 'identity')
})

test('阶段进度按当前区间计算，而不是总 streak 比例', () => {
  const summary = getStreakMilestoneSummary(45)

  assert.equal(summary.currentMilestone, 30)
  assert.equal(summary.nextMilestone, 60)
  assert.equal(summary.daysRemaining, 15)
  assert.equal(summary.progressPercent, 50)
  assert.equal(summary.currentPhaseKey, 'deepening')
})

test('只有 30 / 60 / 90 / 180 / 365 命中时才触发阶段高光反馈', () => {
  assert.equal(getCelebrationMilestone(29), null)
  assert.equal(getCelebrationMilestone(30), 30)
  assert.equal(getCelebrationMilestone(60), 60)
  assert.equal(getCelebrationMilestone(365), 365)
  assert.equal(getCelebrationMilestone(366), null)
})

test('下一阶段取下一次阶段跃迁，而不是下一里程碑', () => {
  assert.deepEqual(getNextPhaseTarget(7), { phaseKey: 'deepening', atStreak: 30 })
  assert.deepEqual(getNextPhaseTarget(30), { phaseKey: 'resilient', atStreak: 90 })
  assert.deepEqual(getNextPhaseTarget(200), { phaseKey: 'identity', atStreak: 365 })
})

test('阶段对照表包含每个阶段的起止天数', () => {
  const ranges = getPhaseRanges()
  assert.deepEqual(ranges[0], { phaseKey: 'starter', minDay: 0, maxDay: 6 })
  assert.deepEqual(ranges[1], { phaseKey: 'steady', minDay: 7, maxDay: 29 })
  assert.deepEqual(ranges[ranges.length - 1], { phaseKey: 'identity', minDay: 365, maxDay: null })
})
