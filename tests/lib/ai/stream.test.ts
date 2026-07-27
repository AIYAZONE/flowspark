import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitSSEEvents } from '../../../src/lib/ai/stream.ts'

test('splits multiple SSE events', () => {
  const buffer = 'data: {"a":1}\n\ndata: {"b":2}\n\n'
  const { events, rest } = splitSSEEvents(buffer)
  assert.equal(events.length, 2)
  assert.deepEqual(JSON.parse(events[0]), { a: 1 })
  assert.equal(rest, '')
})

test('preserves a trailing partial event', () => {
  const buffer = 'data: {"a":1}\n\ndata: {"b":'
  const { events, rest } = splitSSEEvents(buffer)
  assert.equal(events.length, 1)
  assert.equal(rest, 'data: {"b":')
})

test('ignores non-data lines', () => {
  const buffer = ': keep-alive\ndata: {"a":1}\n\n'
  const { events } = splitSSEEvents(buffer)
  assert.equal(events.length, 1)
  assert.deepEqual(JSON.parse(events[0]), { a: 1 })
})
