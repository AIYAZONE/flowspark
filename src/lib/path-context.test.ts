import test from 'node:test'
import assert from 'node:assert/strict'

import { buildPrimaryPathContext } from './path-context.ts'

test('buildPrimaryPathContext returns zh stageLabel', () => {
  const context = buildPrimaryPathContext({
    locale: 'zh',
    today: '2026-07-03',
    goals: [{
      id: 'g1',
      title: '测试路径',
      priority: 'high',
      actions: [],
    }],
  })

  assert.ok(context)
  assert.equal(context.stageLabel, '路径阶段')
})

test('buildPrimaryPathContext does not mark close-out for small action sample', () => {
  const context = buildPrimaryPathContext({
    locale: 'zh',
    today: '2026-07-03',
    goals: [{
      id: 'g1',
      title: '测试路径',
      priority: 'high',
      actions: [{ id: 'a1', completed: true }],
    }],
  })

  assert.ok(context)
  assert.equal(context.ctaLabel, '继续压实主线')
})

test('buildPrimaryPathContext marks close-out by progress when sample is large enough', () => {
  const context = buildPrimaryPathContext({
    locale: 'zh',
    today: '2026-07-03',
    goals: [{
      id: 'g1',
      title: '测试路径',
      priority: 'high',
      actions: [
        { id: 'a1', completed: true },
        { id: 'a2', completed: true },
        { id: 'a3', completed: true },
      ],
    }],
  })

  assert.ok(context)
  assert.equal(context.ctaLabel, '去收关键尾')
})

test('buildPrimaryPathContext marks close-out by deadline', () => {
  const context = buildPrimaryPathContext({
    locale: 'zh',
    today: '2026-07-03',
    goals: [{
      id: 'g1',
      title: '测试路径',
      priority: 'high',
      end_date: '2026-07-09',
      actions: [
        { id: 'a1', completed: true },
        { id: 'a2', completed: false },
        { id: 'a3', completed: false },
      ],
    }],
  })

  assert.ok(context)
  assert.equal(context.ctaLabel, '去收关键尾')
  assert.match(context.evidence, /只剩 6 天/)
})

