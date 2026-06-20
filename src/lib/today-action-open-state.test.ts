import test from 'node:test'
import assert from 'node:assert/strict'

import {
  resolveInitialOpenAction,
  resolveInitialPanelMode,
  resolveInitialRevealState,
  resolveInitialView,
} from './today-action-open-state.ts'

test('action parameter takes precedence over rescue parameter', () => {
  assert.equal(
    resolveInitialOpenAction({
      actionIdParam: 'action-1',
      rescueParam: 'rescue-1',
    }),
    'action-1'
  )
  assert.equal(
    resolveInitialPanelMode({
      actionIdParam: 'action-1',
      rescueParam: 'rescue-1',
    }),
    'view'
  )
})

test('rescue parameter is preserved when action parameter is absent', () => {
  assert.equal(
    resolveInitialOpenAction({
      actionIdParam: null,
      rescueParam: 'rescue-1',
    }),
    'rescue-1'
  )
  assert.equal(
    resolveInitialPanelMode({
      actionIdParam: null,
      rescueParam: 'rescue-1',
    }),
    'rescue'
  )
})

test('initial open action forces focus view', () => {
  assert.equal(
    resolveInitialView({
      initialOpenActionId: 'action-1',
      shouldFocusByDefault: false,
    }),
    'focus'
  )
})

test('reveal state expands the right group and keeps a scroll target', () => {
  const state = resolveInitialRevealState({
    initialOpenActionId: 'action-8',
    mustIds: ['action-1'],
    overdueIds: ['action-2'],
    completedIds: ['action-3'],
    groupEntries: [
      {
        goalId: 'goal-1',
        actionIds: ['action-4', 'action-5', 'action-6', 'action-7', 'action-8'],
      },
    ],
    maxMust: 8,
    maxOverdue: 8,
    maxPerGroup: 4,
  })

  assert.deepEqual(state.openGoalIds, { 'goal-1': true })
  assert.deepEqual(state.expandedGoalIds, { 'goal-1': true })
  assert.equal(state.scrollTargetId, 'action-8')
})
