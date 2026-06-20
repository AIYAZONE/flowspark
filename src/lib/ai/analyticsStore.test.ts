import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAIFunnelBreakdown,
  buildAIFunnelOverview,
  type AIFunnelDailyRow,
} from './analyticsStore.ts'

function createRow(overrides: Partial<AIFunnelDailyRow>): AIFunnelDailyRow {
  return {
    user_id: 'user-1',
    event_date: '2026-06-20',
    scene: 'today_plan',
    variant: 'B',
    source: 'today',
    dashboard_view_count: 0,
    today_view_count: 1,
    today_plan_exposed_count: 0,
    today_plan_click_count: 0,
    today_plan_suggested_count: 0,
    today_plan_apply_count: 0,
    rescue_click_count: 0,
    rescue_apply_count: 0,
    review_exposed_count: 0,
    review_click_count: 0,
    review_generated_count: 0,
    streak_risk_banner_exposed_count: 0,
    core_action_set_count: 0,
    core_action_completed_count: 0,
    returned_next_day: false,
    ...overrides,
  }
}

test('buildAIFunnelOverview 按 user-day 去重并合并次日回访', () => {
  const rows = [
    createRow({ today_plan_exposed_count: 1, returned_next_day: true }),
    createRow({ review_exposed_count: 1, returned_next_day: false }),
    createRow({
      user_id: 'user-2',
      event_date: '2026-06-20',
      today_plan_apply_count: 1,
      today_plan_exposed_count: 1,
      core_action_set_count: 1,
      core_action_completed_count: 1,
      returned_next_day: false,
    }),
  ]

  const overview = buildAIFunnelOverview(rows)

  assert.equal(overview.page_view_days, 2)
  assert.equal(overview.today_plan_exposed_user_days, 2)
  assert.equal(overview.today_plan_apply_user_days, 1)
  assert.equal(overview.review_exposed_user_days, 1)
  assert.equal(overview.core_action_set_user_days, 1)
  assert.equal(overview.core_action_completed_user_days, 1)
  assert.equal(overview.returned_next_day_user_days, 1)
  assert.equal(overview.today_plan_exposure_rate, 1)
  assert.equal(overview.today_plan_apply_rate, 0.5)
  assert.equal(overview.core_action_completion_rate, 1)
  assert.equal(overview.returned_next_day_rate, 0.5)
})

test('buildAIFunnelBreakdown 只统计有链路信号的 user-day 并按 source/scene/variant 汇总', () => {
  const rows = [
    createRow({ today_plan_exposed_count: 1, today_plan_apply_count: 1 }),
    createRow({ review_exposed_count: 1, returned_next_day: true }),
    createRow({
      user_id: 'user-2',
      event_date: '2026-06-20',
      source: 'dashboard',
      scene: 'review',
      variant: 'A',
      review_exposed_count: 1,
      rescue_click_count: 1,
    }),
    createRow({
      user_id: 'user-4',
      event_date: '2026-06-20',
      source: 'today',
      scene: 'rescue',
      variant: 'A',
      core_action_set_count: 1,
      core_action_completed_count: 1,
    }),
    createRow({
      user_id: 'user-3',
      event_date: '2026-06-20',
      source: 'unknown',
      scene: 'unknown',
      variant: '-',
      today_plan_exposed_count: 0,
      review_exposed_count: 0,
      rescue_click_count: 0,
    }),
  ]

  const breakdown = buildAIFunnelBreakdown(rows)

  assert.equal(breakdown.length, 3)
  assert.deepEqual(breakdown[0], {
    source: 'today',
    scene: 'today_plan',
    variant: 'B',
    today_plan_exposed_user_days: 1,
    today_plan_apply_user_days: 1,
    review_exposed_user_days: 1,
    rescue_click_user_days: 0,
    core_action_set_user_days: 0,
    core_action_completed_user_days: 0,
    returned_next_day_user_days: 1,
  })
  assert.deepEqual(breakdown[1], {
    source: 'dashboard',
    scene: 'review',
    variant: 'A',
    today_plan_exposed_user_days: 0,
    today_plan_apply_user_days: 0,
    review_exposed_user_days: 1,
    rescue_click_user_days: 1,
    core_action_set_user_days: 0,
    core_action_completed_user_days: 0,
    returned_next_day_user_days: 0,
  })
  assert.deepEqual(breakdown[2], {
    source: 'today',
    scene: 'rescue',
    variant: 'A',
    today_plan_exposed_user_days: 0,
    today_plan_apply_user_days: 0,
    review_exposed_user_days: 0,
    rescue_click_user_days: 0,
    core_action_set_user_days: 1,
    core_action_completed_user_days: 1,
    returned_next_day_user_days: 0,
  })
})
