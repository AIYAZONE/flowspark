import test from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEM_CONVERSATION_STORAGE_KEY, clipHistory, clipWorkingMemory } from './storage.ts'

test('SYSTEM_CONVERSATION_STORAGE_KEY: stable', () => {
  assert.equal(SYSTEM_CONVERSATION_STORAGE_KEY, 'flowspark.systemConversation.v1')
})

test('clipHistory: keeps last 3 items', () => {
  assert.deepEqual(clipHistory([1, 2]), [1, 2])
  assert.deepEqual(clipHistory([1, 2, 3]), [1, 2, 3])
  assert.deepEqual(clipHistory([1, 2, 3, 4]), [2, 3, 4])
  assert.deepEqual(clipHistory([1, 2, 3, 4, 5]), [3, 4, 5])
})

test('clipWorkingMemory: keeps last 20 items', () => {
  const base = Array.from({ length: 25 }, (_, i) => i + 1)
  assert.deepEqual(clipWorkingMemory(base), base.slice(-20))
  assert.deepEqual(clipWorkingMemory(base.slice(0, 20)), base.slice(0, 20))
  assert.deepEqual(clipWorkingMemory([]), [])
})
