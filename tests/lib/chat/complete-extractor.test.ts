import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCompleteExtraction } from '../../../src/lib/chat/complete-extractor.ts'

test('parses a valid completion draft', () => {
  const raw = JSON.stringify({
    hasComplete: true,
    actionId: 'abc-123',
    title: '写周报',
    reason: '用户明确说写完了'
  })
  const { hasComplete, draft } = parseCompleteExtraction(raw)
  assert.equal(hasComplete, true)
  assert.ok(draft)
  assert.equal(draft?.actionId, 'abc-123')
  assert.equal(draft?.title, '写周报')
  assert.equal(draft?.reason, '用户明确说写完了')
})

test('null on no completion', () => {
  const { hasComplete, draft } = parseCompleteExtraction(JSON.stringify({ hasComplete: false }))
  assert.equal(hasComplete, false)
  assert.equal(draft, null)
})

test('null on malformed json', () => {
  const { hasComplete, draft } = parseCompleteExtraction('not-json')
  assert.equal(hasComplete, false)
  assert.equal(draft, null)
})

test('null when actionId missing', () => {
  const { hasComplete, draft } = parseCompleteExtraction(
    JSON.stringify({ hasComplete: true, title: 'x' })
  )
  assert.equal(hasComplete, false)
  assert.equal(draft, null)
})
