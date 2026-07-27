import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseActionExtraction } from '../../../src/lib/chat/action-extractor.ts'

test('parses a valid action draft', () => {
  const raw = JSON.stringify({
    hasAction: true,
    draft: { kind: 'action', title: '运动 30 分钟', reason: '健康' }
  })
  const r = parseActionExtraction(raw)
  assert.equal(r.hasAction, true)
  assert.equal(r.draft?.title, '运动 30 分钟')
})

test('returns no action when hasAction is false', () => {
  const r = parseActionExtraction(JSON.stringify({ hasAction: false }))
  assert.equal(r.hasAction, false)
  assert.equal(r.draft, null)
})

test('tolerates malformed json', () => {
  const r = parseActionExtraction('not json')
  assert.equal(r.hasAction, false)
  assert.equal(r.draft, null)
})
