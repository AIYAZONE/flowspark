import test from 'node:test'
import assert from 'node:assert/strict'

import { buildGoalListViewModel } from './goal-list-view.ts'

type GoalLike = Parameters<typeof buildGoalListViewModel>[0]['goals'][number]

function makeGoal(
  overrides: Partial<GoalLike> & Pick<GoalLike, 'id' | 'title' | 'status' | 'start_date' | 'end_date'>
): GoalLike {
  return {
    id: overrides.id,
    title: overrides.title,
    status: overrides.status,
    start_date: overrides.start_date,
    end_date: overrides.end_date,
    description: overrides.description ?? '',
    priority: overrides.priority ?? 'medium',
    category: overrides.category ?? 'other',
    is_starred: overrides.is_starred ?? false,
  }
}

test('buildGoalListViewModel keeps one main list and an archived bucket with importance ordering', () => {
  const model = buildGoalListViewModel({
    goals: [
      makeGoal({
        id: 'active-starred',
        title: 'Starred active',
        status: 'active',
        is_starred: true,
        priority: 'medium',
        start_date: '2026-07-01',
        end_date: '2026-08-01',
      }),
      makeGoal({
        id: 'active-high',
        title: 'High priority active',
        status: 'active',
        priority: 'high',
        start_date: '2026-07-01',
        end_date: '2026-07-28',
      }),
      makeGoal({
        id: 'completed-starred',
        title: 'Starred completed',
        status: 'completed',
        is_starred: true,
        priority: 'high',
        start_date: '2026-07-01',
        end_date: '2026-07-26',
      }),
      makeGoal({
        id: 'abandoned',
        title: 'Abandoned path',
        status: 'abandoned',
        priority: 'high',
        start_date: '2026-07-01',
        end_date: '2026-07-24',
      }),
      makeGoal({
        id: 'archived',
        title: 'Archived path',
        status: 'archived',
        priority: 'high',
        start_date: '2026-07-01',
        end_date: '2026-07-20',
      }),
    ],
    search: '',
    statusFilter: 'all',
  })

  assert.deepEqual(
    model.mainGoals.map((goal) => goal.id),
    ['active-starred', 'completed-starred', 'active-high', 'abandoned']
  )
  assert.deepEqual(model.archivedGoals.map((goal) => goal.id), ['archived'])
})

test('buildGoalListViewModel applies search and status filters before bucketing', () => {
  const model = buildGoalListViewModel({
    goals: [
      makeGoal({
        id: 'match-active',
        title: 'Writing system plan',
        status: 'active',
        start_date: '2026-07-01',
        end_date: '2026-07-29',
      }),
      makeGoal({
        id: 'match-completed',
        title: 'Writing archive',
        status: 'completed',
        start_date: '2026-07-01',
        end_date: '2026-07-30',
      }),
      makeGoal({
        id: 'other-active',
        title: 'Fitness path',
        status: 'active',
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      }),
    ],
    search: 'writing',
    statusFilter: 'active',
  })

  assert.deepEqual(model.mainGoals.map((goal) => goal.id), ['match-active'])
  assert.equal(model.archivedGoals.length, 0)
  assert.equal(model.totalGoals, 1)
})
