import test from 'node:test'
import assert from 'node:assert/strict'

import { sortActionsForToday } from './action-ranking.ts'

test('sortActionsForToday orders overdue > priority > core > primaryGoal', () => {
  const actions = [
    {
      id: 'core-low',
      title: 'core-low',
      goalId: 'g2',
      goalTitle: 'B',
      priority: 'low',
      type: 'core',
      start_date: '2026-07-24',
      end_date: '2026-07-24',
    },
    {
      id: 'high-normal',
      title: 'high-normal',
      goalId: 'g2',
      goalTitle: 'B',
      priority: 'high',
      type: 'supporting',
      start_date: '2026-07-24',
      end_date: '2026-07-24',
    },
    {
      id: 'overdue-low',
      title: 'overdue-low',
      goalId: 'g2',
      goalTitle: 'B',
      priority: 'low',
      type: 'supporting',
      start_date: '2026-07-20',
      end_date: '2026-07-20',
    },
    {
      id: 'primary-medium',
      title: 'primary-medium',
      goalId: 'g1',
      goalTitle: 'A',
      priority: 'medium',
      type: 'supporting',
      start_date: '2026-07-24',
      end_date: '2026-07-24',
    },
  ]

  const sorted = sortActionsForToday({
    actions,
    today: '2026-07-24',
    primaryGoalId: 'g1',
  })

  assert.deepEqual(sorted.map((a) => a.id), [
    'overdue-low',
    'high-normal',
    'primary-medium',
    'core-low',
  ])
})
