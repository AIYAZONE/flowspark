import test from 'node:test'
import assert from 'node:assert/strict'

import { buildTodayTaskListModel, mergeTargetedActionIntoTodayList } from './today-task-list.ts'

type ActionLike = Parameters<typeof buildTodayTaskListModel>[0]['actions'][number]

function makeAction(overrides: Partial<ActionLike> & Pick<ActionLike, 'id' | 'title'>): ActionLike {
  return {
    id: overrides.id,
    title: overrides.title,
    completed: overrides.completed ?? false,
    type: overrides.type ?? 'supporting',
    priority: overrides.priority ?? 'medium',
    start_date: overrides.start_date ?? '2026-07-24',
    end_date: overrides.end_date ?? null,
    goal_id: overrides.goal_id ?? 'goal-b',
    created_at: overrides.created_at ?? null,
  }
}

test('buildTodayTaskListModel prioritizes overdue, high priority, core, and primary goal actions', () => {
  const model = buildTodayTaskListModel({
    today: '2026-07-24',
    primaryGoalId: 'goal-a',
    actions: [
      makeAction({
        id: 'normal',
        title: 'normal',
        priority: 'medium',
        type: 'supporting',
        end_date: '2026-07-25',
        goal_id: 'goal-b',
      }),
      makeAction({
        id: 'primary',
        title: 'primary',
        priority: 'medium',
        type: 'supporting',
        end_date: '2026-07-25',
        goal_id: 'goal-a',
      }),
      makeAction({
        id: 'core',
        title: 'core',
        priority: 'medium',
        type: 'core',
        end_date: '2026-07-25',
        goal_id: 'goal-b',
      }),
      makeAction({
        id: 'high',
        title: 'high',
        priority: 'high',
        type: 'supporting',
        end_date: '2026-07-25',
        goal_id: 'goal-b',
      }),
      makeAction({
        id: 'overdue',
        title: 'overdue',
        priority: 'low',
        type: 'supporting',
        end_date: '2026-07-20',
        goal_id: 'goal-b',
      }),
    ],
  })

  assert.deepEqual(
    model.incomplete.map((action) => action.id),
    ['overdue', 'high', 'core', 'primary', 'normal']
  )
})

test('buildTodayTaskListModel separates completed actions to the completed bucket', () => {
  const model = buildTodayTaskListModel({
    today: '2026-07-24',
    primaryGoalId: null,
    actions: [
      makeAction({ id: 'todo', title: 'todo', completed: false }),
      makeAction({ id: 'done', title: 'done', completed: true }),
    ],
  })

  assert.equal(model.incompleteCount, 1)
  assert.equal(model.completedCount, 1)
  assert.deepEqual(model.incomplete.map((action) => action.id), ['todo'])
  assert.deepEqual(model.completed.map((action) => action.id), ['done'])
})

test('mergeTargetedActionIntoTodayList appends the targeted action when it is missing', () => {
  const actions = [
    makeAction({ id: 'todo', title: 'todo', completed: false }),
  ]
  const targeted = makeAction({
    id: 'target',
    title: 'target',
    completed: false,
    start_date: '2026-07-24',
    end_date: '2026-07-24',
  })

  const merged = mergeTargetedActionIntoTodayList({
    actions,
    targetedAction: targeted,
    today: '2026-07-24',
  })

  assert.deepEqual(
    merged.map((action) => action.id),
    ['todo', 'target']
  )
})

test('mergeTargetedActionIntoTodayList does not append a targeted action that has not started yet', () => {
  const actions = [
    makeAction({ id: 'todo', title: 'todo', completed: false }),
  ]
  const targeted = makeAction({
    id: 'future',
    title: 'future',
    completed: false,
    start_date: '2026-07-25',
    end_date: '2026-07-25',
  })

  const merged = mergeTargetedActionIntoTodayList({
    actions,
    targetedAction: targeted,
    today: '2026-07-24',
  })

  assert.deepEqual(
    merged.map((action) => action.id),
    ['todo']
  )
})
