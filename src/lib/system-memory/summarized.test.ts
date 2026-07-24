import test from 'node:test'
import assert from 'node:assert/strict'

import type { SystemTurn } from '@/lib/system-conversation/types'
import {
  buildSummarizedMemoryEvent,
  clipSummarizedMemoryQueue,
  splitWorkingMemoryForSummarization,
} from './summarized.ts'

function createTurn(index: number): SystemTurn {
  return {
    id: `turn-${index}`,
    createdAt: `2026-07-23T10:${String(index).padStart(2, '0')}:00.000Z`,
    sourcePage: 'system',
    userText: `用户输入 ${index}`,
    state: 'done',
    tag: '已执行',
    judgement: `系统判断 ${index}`,
    reason: '',
    nextStep: '',
    primaryAction: null,
  }
}

test('splitWorkingMemoryForSummarization: 超过 20 轮时切出 overflow', () => {
  const turns = Array.from({ length: 23 }, (_, index) => createTurn(index + 1))
  const result = splitWorkingMemoryForSummarization(turns)

  assert.equal(result.overflow.length, 3)
  assert.equal(result.workingMemory.length, 20)
  assert.equal(result.overflow[0]?.id, 'turn-1')
  assert.equal(result.workingMemory[0]?.id, 'turn-4')
})

test('buildSummarizedMemoryEvent: 为 overflow 生成可持久化的摘要事件', () => {
  const event = buildSummarizedMemoryEvent([createTurn(1), createTurn(2)])

  assert.equal(event?.turnIds.length, 2)
  assert.equal(event?.summary.includes('用户输入 1'), true)
  assert.equal(event?.summary.includes('系统判断 2'), true)
})

test('clipSummarizedMemoryQueue: 只保留最近 10 个摘要事件', () => {
  const queue = Array.from({ length: 12 }, (_, index) => ({
    id: `summary-${index + 1}`,
    createdAt: `2026-07-23T11:${String(index).padStart(2, '0')}:00.000Z`,
    turnIds: [`turn-${index + 1}`],
    summary: `summary ${index + 1}`,
  }))

  const clipped = clipSummarizedMemoryQueue(queue)

  assert.equal(clipped.length, 10)
  assert.equal(clipped[0]?.id, 'summary-3')
  assert.equal(clipped[9]?.id, 'summary-12')
})
