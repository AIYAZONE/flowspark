import test from 'node:test'
import assert from 'node:assert/strict'

import { getTodayMainThreadCopy } from './today-main-thread.ts'

test('getTodayMainThreadCopy returns continuity copy when streak risk is active', () => {
  assert.deepEqual(getTodayMainThreadCopy({
    locale: 'zh',
    showStreakRiskBanner: true,
    streakBannerBody: '先做最小行动保连续。',
    hasTomorrowHandoff: false,
    nextActionTitle: '完成复盘',
  }), {
    title: '今天先保连续，不先追求更多',
    body: '先做最小行动保连续。',
  })
})

test('getTodayMainThreadCopy returns handoff copy when yesterday handoff exists', () => {
  assert.deepEqual(getTodayMainThreadCopy({
    locale: 'zh',
    showStreakRiskBanner: false,
    streakBannerBody: 'unused',
    hasTomorrowHandoff: true,
    nextActionTitle: '完成复盘',
  }), {
    title: '先把昨天的 momentum 接回来',
    body: '系统优先建议你延续昨天已经完成的 AI 核心行动，让推进感不要断掉。',
  })
})

test('getTodayMainThreadCopy returns next-action copy when an action exists', () => {
  assert.deepEqual(getTodayMainThreadCopy({
    locale: 'en',
    showStreakRiskBanner: false,
    streakBannerBody: 'unused',
    hasTomorrowHandoff: false,
    nextActionTitle: 'Ship landing polish',
  }), {
    title: 'Today’s main thread is "Ship landing polish"',
    body: 'You do not need more decisions today. Push this one thing forward and let everything else support it.',
  })
})

test('getTodayMainThreadCopy returns closed copy when no action exists', () => {
  assert.deepEqual(getTodayMainThreadCopy({
    locale: 'en',
    showStreakRiskBanner: false,
    streakBannerBody: 'unused',
    hasTomorrowHandoff: false,
    nextActionTitle: null,
  }), {
    title: 'Today’s execution layer is closed',
    body: 'The main thread is already complete. The next best move is to review, close the loop, and prepare tomorrow.',
  })
})

