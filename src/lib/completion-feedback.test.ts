import test from 'node:test'
import assert from 'node:assert/strict'

import { buildCompletionFeedback } from './completion-feedback.ts'

test('reward takes priority over ai, xp, and streak feedback', () => {
  const feedback = buildCompletionFeedback({
    actionTitle: '写周报',
    aiCompleted: true,
    xpEarned: 50,
    reward: { rarity: 'rare', bonusXP: 40 },
    streak: {
      shieldGrantedRule: 'first_3_day',
      shieldGrantedAtStreak: 3,
      shieldBalance: 1,
    },
  }, { now: 1000 })

  assert.deepEqual(feedback, {
    kind: 'modal',
    reward: { rarity: 'rare', bonusXP: 40 },
    createdAt: 1000,
    suppressedSignals: ['shield_granted', 'ai_completion', 'xp'],
  })
})

test('streak feedback takes priority over ai and xp when there is no reward', () => {
  const feedback = buildCompletionFeedback({
    actionTitle: '深度工作',
    aiCompleted: true,
    xpEarned: 20,
    streak: {
      milestoneReached: {
        milestone: 7,
        phaseKey: 'steady',
      },
    },
  }, { now: 2000 })

  assert.equal(feedback?.kind, 'toast')
  if (!feedback || feedback.kind !== 'toast' || feedback.toast.variant !== 'streak') {
    assert.fail('expected streak toast')
  }
  assert.equal(feedback.toast.feedback.kind, 'milestone_reached')
  assert.deepEqual(feedback.suppressedSignals, ['ai_completion', 'xp'])
})

test('ai completion and xp are merged into one toast', () => {
  const feedback = buildCompletionFeedback({
    actionTitle: '完成 AI 建议',
    aiCompleted: true,
    xpEarned: 30,
  }, { now: 3000 })

  assert.deepEqual(feedback, {
    kind: 'toast',
    toast: {
      variant: 'ai_xp',
      actionTitle: '完成 AI 建议',
      xpEarned: 30,
    },
    createdAt: 3000,
    suppressedSignals: [],
  })
})

test('plain xp completion uses xp toast', () => {
  const feedback = buildCompletionFeedback({
    actionTitle: '喝水',
    aiCompleted: false,
    xpEarned: 10,
  }, { now: 4000 })

  assert.deepEqual(feedback, {
    kind: 'toast',
    toast: {
      variant: 'xp_only',
      xpEarned: 10,
    },
    createdAt: 4000,
    suppressedSignals: [],
  })
})
