import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildTomorrowHandoffExposureDedupeKey,
  buildTomorrowHandoffStorageKey,
  pickTargetActionId,
  pickYesterdayHandoffCandidate,
} from './tomorrow-handoff.ts'

test('pickYesterdayHandoffCandidate prefers the latest completion time and stable tie-breaker', () => {
  const picked = pickYesterdayHandoffCandidate([
    {
      outcomeId: 'outcome-1',
      recommendationId: 'rec-1',
      actionId: 'action-1',
      title: 'Earlier',
      goalId: 'goal-1',
      completedAt: '2026-06-19T08:00:00.000Z',
    },
    {
      outcomeId: 'outcome-3',
      recommendationId: 'rec-3',
      actionId: 'action-3',
      title: 'Latest',
      goalId: 'goal-1',
      completedAt: '2026-06-19T09:00:00.000Z',
    },
    {
      outcomeId: 'outcome-2',
      recommendationId: 'rec-2',
      actionId: 'action-2',
      title: 'Same time but lower id',
      goalId: 'goal-1',
      completedAt: '2026-06-19T09:00:00.000Z',
    },
  ])

  assert.deepEqual(picked, {
    recommendationId: 'rec-3',
    actionId: 'action-3',
    title: 'Latest',
    goalId: 'goal-1',
    completedAt: '2026-06-19T09:00:00.000Z',
  })
})

test('pickTargetActionId prefers high priority then earlier schedule then stable id', () => {
  const picked = pickTargetActionId({
    goalId: 'goal-1',
    actions: [
      {
        id: 'c-action',
        goal_id: 'goal-1',
        priority: 'medium',
        start_date: '2026-06-21',
        end_date: null,
        completed: false,
        type: 'core',
      },
      {
        id: 'b-action',
        goal_id: 'goal-1',
        priority: 'high',
        start_date: '2026-06-22',
        end_date: null,
        completed: false,
        type: 'core',
      },
      {
        id: 'a-action',
        goal_id: 'goal-1',
        priority: 'high',
        start_date: '2026-06-21',
        end_date: null,
        completed: false,
        type: 'core',
      },
      {
        id: 'done-action',
        goal_id: 'goal-1',
        priority: 'high',
        start_date: '2026-06-20',
        end_date: null,
        completed: true,
        type: 'core',
      },
    ],
  })

  assert.equal(picked, 'a-action')
})

test('handoff keys are stable and include fallback target marker', () => {
  assert.equal(
    buildTomorrowHandoffStorageKey({
      userId: 'user-1',
      dateBucket: '2026-06-20',
      recommendationId: 'rec-1',
    }),
    'tomorrow-handoff:user-1:2026-06-20:rec-1'
  )

  assert.equal(
    buildTomorrowHandoffExposureDedupeKey({
      userId: 'user-1',
      dateBucket: '2026-06-20',
      recommendationId: 'rec-1',
      targetActionId: null,
    }),
    'tomorrow-handoff:exposed:user-1:2026-06-20:rec-1:today_plan'
  )
})
