import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveFallbackReviewItems, type ReviewCandidates } from '../../../src/lib/ai/reviewFallback.ts'

function makeCandidates(overrides: Partial<ReviewCandidates> = {}): ReviewCandidates {
  return {
    goals: [],
    actions: [],
    ...overrides,
  }
}

function action(over: Record<string, unknown> = {}): ReviewCandidates['actions'][number] {
  return {
    id: 'a1',
    title: 'Action 1',
    goalId: 'g1',
    completed: false,
    endDate: null,
    ...over,
  } as ReviewCandidates['actions'][number]
}

test('returns empty array when candidates undefined', () => {
  assert.deepEqual(deriveFallbackReviewItems(undefined, 'en'), [])
})

test('archives low-priority incomplete actions', () => {
  const c = makeCandidates({ actions: [action({ id: 'a1', priority: 'low' })] })
  const items = deriveFallbackReviewItems(c, 'en')
  assert.equal(items.length, 1)
  assert.equal(items[0].action_kind, 'archive')
  assert.equal(items[0].action_id, 'a1')
})

test('focuses overdue actions', () => {
  const past = new Date(Date.now() - 86_400_000).toISOString()
  const c = makeCandidates({ actions: [action({ id: 'a2', priority: 'high', endDate: past })] })
  const items = deriveFallbackReviewItems(c, 'en')
  assert.equal(items.length, 1)
  assert.equal(items[0].action_kind, 'focus')
  assert.equal(items[0].action_id, 'a2')
})

test('skips completed actions', () => {
  const c = makeCandidates({ actions: [action({ id: 'a3', completed: true, priority: 'low' })] })
  assert.equal(deriveFallbackReviewItems(c, 'en').length, 0)
})

test('caps at 6 items', () => {
  const actions = Array.from({ length: 10 }, (_, i) => action({ id: `a${i}`, priority: 'low' }))
  const items = deriveFallbackReviewItems(makeCandidates({ actions }), 'en')
  assert.equal(items.length, 6)
})

test('adds stuck goals when fewer than 3 items', () => {
  const c = makeCandidates({ goals: [{ id: 'g1', title: 'Stuck goal', status: 'stuck' }] })
  const items = deriveFallbackReviewItems(c, 'en')
  assert.equal(items.length, 1)
  assert.equal(items[0].action_kind, 'focus')
  assert.equal(items[0].goal_id, 'g1')
  assert.equal(items[0].action_id, null)
})

test('locale drives reason language (zh)', () => {
  const c = makeCandidates({ actions: [action({ id: 'a1', priority: 'low' })] })
  const items = deriveFallbackReviewItems(c, 'zh')
  assert.match(items[0].reason, /归档/)
})
