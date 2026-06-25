import test from 'node:test'
import assert from 'node:assert/strict'

import { getTodayPrimaryCta } from './today-primary-cta.ts'

test('getTodayPrimaryCta returns rescue link when streak risk and rescue action exists', () => {
  assert.deepEqual(getTodayPrimaryCta({
    locale: 'zh',
    showStreakRiskBanner: true,
    rescueActionId: 'a1',
    tomorrowHandoffTargetActionId: null,
    nextIncompleteActionId: 'n1',
  }), {
    href: '/today?rescue=a1#today-actions',
    label: '打开 5 分钟救援',
  })
})

test('getTodayPrimaryCta returns minimum-action link when streak risk but no rescue action', () => {
  assert.deepEqual(getTodayPrimaryCta({
    locale: 'zh',
    showStreakRiskBanner: true,
    rescueActionId: null,
    tomorrowHandoffTargetActionId: null,
    nextIncompleteActionId: 'n1',
  }), {
    href: '#today-actions',
    label: '去做最小行动',
  })
})

test('getTodayPrimaryCta returns action link when handoff target exists', () => {
  assert.deepEqual(getTodayPrimaryCta({
    locale: 'en',
    showStreakRiskBanner: false,
    rescueActionId: null,
    tomorrowHandoffTargetActionId: 'h1',
    nextIncompleteActionId: 'n1',
  }), {
    href: '/today?action=h1#today-actions',
    label: 'Start',
  })
})

test('getTodayPrimaryCta returns action link when next incomplete action exists', () => {
  assert.deepEqual(getTodayPrimaryCta({
    locale: 'en',
    showStreakRiskBanner: false,
    rescueActionId: null,
    tomorrowHandoffTargetActionId: null,
    nextIncompleteActionId: 'n1',
  }), {
    href: '/today?action=n1#today-actions',
    label: 'Start',
  })
})

test('getTodayPrimaryCta returns actions anchor when no action exists', () => {
  assert.deepEqual(getTodayPrimaryCta({
    locale: 'zh',
    showStreakRiskBanner: false,
    rescueActionId: null,
    tomorrowHandoffTargetActionId: null,
    nextIncompleteActionId: null,
  }), {
    href: '#today-actions',
    label: '查看行动',
  })
})

