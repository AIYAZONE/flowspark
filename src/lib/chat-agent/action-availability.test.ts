import test from 'node:test'
import assert from 'node:assert/strict'

import { filterExecutableActionsForToday } from './action-availability.ts'

test('filterExecutableActionsForToday excludes actions that have not started yet', () => {
  const actions = [
    {
      id: 'today',
      title: '今天可做',
      goalId: 'g1',
      goalTitle: '目标',
      priority: 'high',
      type: 'core',
      start_date: '2026-07-24',
      end_date: '2026-07-24',
    },
    {
      id: 'future',
      title: '明天开始',
      goalId: 'g1',
      goalTitle: '目标',
      priority: 'high',
      type: 'core',
      start_date: '2026-07-25',
      end_date: '2026-07-25',
    },
  ]

  const executable = filterExecutableActionsForToday({
    actions,
    today: '2026-07-24',
  })

  assert.deepEqual(executable.map((action) => action.id), ['today'])
})
