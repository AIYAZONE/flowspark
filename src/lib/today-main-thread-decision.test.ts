import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveTodayMainThreadDecision } from './today-main-thread-decision.ts'

const baseActions = [
  {
    id: 'a1',
    title: '路径A-普通动作',
    goal_id: 'goal-a',
    completed: false,
    priority: 'medium',
    type: 'learning',
    start_date: '2026-06-25',
    end_date: '2026-06-26',
  },
  {
    id: 'a2',
    title: '路径A-核心动作',
    goal_id: 'goal-a',
    completed: false,
    priority: 'high',
    type: 'core',
    start_date: '2026-06-25',
    end_date: '2026-06-25',
  },
  {
    id: 'b1',
    title: '路径B-高优先动作',
    goal_id: 'goal-b',
    completed: false,
    priority: 'high',
    type: 'core',
    start_date: '2026-06-25',
    end_date: '2026-06-25',
  },
] as const

test('resolveTodayMainThreadDecision picks an action from the primary path', () => {
  assert.deepEqual(resolveTodayMainThreadDecision({
    today: '2026-06-25',
    showStreakRiskBanner: false,
    tomorrowHandoffCandidate: null,
    actions: [...baseActions],
    primaryPathGoalId: 'goal-a',
  }), {
    mainThreadActionId: 'a2',
    mainThreadActionTitle: '路径A-核心动作',
    source: 'primary_path_action',
  })
})

test('resolveTodayMainThreadDecision ignores handoff from a different path', () => {
  assert.deepEqual(resolveTodayMainThreadDecision({
    today: '2026-06-25',
    showStreakRiskBanner: false,
    tomorrowHandoffCandidate: {
      actionId: 'b1',
      title: '昨天的路径B动作',
      goalId: 'goal-b',
    },
    actions: [...baseActions],
    primaryPathGoalId: 'goal-a',
  }), {
    mainThreadActionId: 'a2',
    mainThreadActionTitle: '路径A-核心动作',
    source: 'primary_path_action',
  })
})

test('resolveTodayMainThreadDecision keeps continuity source but still picks action from primary path', () => {
  assert.deepEqual(resolveTodayMainThreadDecision({
    today: '2026-06-25',
    showStreakRiskBanner: true,
    tomorrowHandoffCandidate: null,
    actions: [...baseActions],
    primaryPathGoalId: 'goal-a',
  }), {
    mainThreadActionId: 'a2',
    mainThreadActionTitle: '路径A-核心动作',
    source: 'continuity',
  })
})

test('resolveTodayMainThreadDecision falls back to other incomplete actions when primary path has no executable action', () => {
  assert.deepEqual(resolveTodayMainThreadDecision({
    today: '2026-06-25',
    showStreakRiskBanner: false,
    tomorrowHandoffCandidate: null,
    actions: [
      {
        id: 'b1',
        title: '路径B-动作',
        goal_id: 'goal-b',
        completed: false,
        priority: 'high',
        type: 'core',
        start_date: '2026-06-25',
        end_date: '2026-06-25',
      },
    ],
    primaryPathGoalId: 'goal-a',
  }), {
    mainThreadActionId: 'b1',
    mainThreadActionTitle: '路径B-动作',
    source: 'fallback_action',
  })
})

test('resolveTodayMainThreadDecision returns closed only when there is no incomplete action', () => {
  assert.deepEqual(resolveTodayMainThreadDecision({
    today: '2026-06-25',
    showStreakRiskBanner: false,
    tomorrowHandoffCandidate: null,
    actions: [
      {
        id: 'a1',
        title: '已完成动作',
        goal_id: 'goal-a',
        completed: true,
        priority: 'high',
        type: 'core',
        start_date: '2026-06-25',
        end_date: '2026-06-25',
      },
    ],
    primaryPathGoalId: 'goal-a',
  }), {
    mainThreadActionId: null,
    mainThreadActionTitle: null,
    source: 'closed',
  })
})
