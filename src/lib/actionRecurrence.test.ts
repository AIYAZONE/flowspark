import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getNextRecurringRange,
  getUpcomingRecurringDate,
  parseActionRecurrenceDescription,
  serializeActionRecurrenceDescription,
} from './actionRecurrence.ts'

test('weekly upcoming：今天命中则返回今天', () => {
  const range = getUpcomingRecurringDate({
    today: '2024-01-01',
    recurrence: 'weekly',
    ruleParams: { weekday: 1 },
  })
  assert.deepEqual(range, { startDate: '2024-01-01', endDate: '2024-01-01' })
})

test('weekly upcoming：返回下一个目标周几', () => {
  const range = getUpcomingRecurringDate({
    today: '2024-01-01',
    recurrence: 'weekly',
    ruleParams: { weekday: 3 },
  })
  assert.deepEqual(range, { startDate: '2024-01-03', endDate: '2024-01-03' })
})

test('monthly upcoming：缺失日期按月末 clamp（闰年）', () => {
  const range = getUpcomingRecurringDate({
    today: '2024-02-10',
    recurrence: 'monthly',
    ruleParams: { monthday: 31, missing: 'clamp' },
  })
  assert.deepEqual(range, { startDate: '2024-02-29', endDate: '2024-02-29' })
})

test('weekly next：按周推进到下一次', () => {
  const next = getNextRecurringRange({
    startDate: '2024-01-01',
    recurrence: 'weekly',
    ruleParams: { weekday: 1 },
  })
  assert.deepEqual(next, { startDate: '2024-01-08', endDate: '2024-01-08' })
})

test('monthly next：按月推进并在缺失日期时 clamp', () => {
  const next = getNextRecurringRange({
    startDate: '2024-01-31',
    recurrence: 'monthly',
    ruleParams: { monthday: 31, missing: 'clamp' },
  })
  assert.deepEqual(next, { startDate: '2024-02-29', endDate: '2024-02-29' })
})

test('serialize/parse：weekly marker 带 weekday 参数', () => {
  const value = serializeActionRecurrenceDescription('hello', 'weekly', { weekday: 2 })
  const parsed = parseActionRecurrenceDescription(value)
  assert.equal(parsed.recurrence, 'weekly')
  assert.equal(parsed.params.weekday, 2)
  assert.equal(parsed.cleanDescription, 'hello')
})
