import test from 'node:test'
import assert from 'node:assert/strict'

import { applyRefresh, ensureState, shouldPersistQuoteState, type DailyQuoteUiState } from './daily-quote-state.ts'

test('ensureState 会规范化并补齐默认值', () => {
  const state = ensureState({ selectedIndex: 9, refreshUsed: -1, history: [9, 2, 2] }, 5, 0)
  assert.deepEqual(state, { selectedIndex: 4, refreshUsed: 0, history: [4, 2] })
})

test('applyRefresh 在配额内会推进索引并记录历史', () => {
  const state: DailyQuoteUiState = { selectedIndex: 0, refreshUsed: 0, history: [0] }
  const next = applyRefresh(state, 5, 5)
  assert.equal(next.selectedIndex, 1)
  assert.equal(next.refreshUsed, 1)
  assert.deepEqual(next.history, [0, 1])
})

test('applyRefresh 超出配额不会改变状态', () => {
  const state: DailyQuoteUiState = { selectedIndex: 2, refreshUsed: 5, history: [0, 2] }
  const next = applyRefresh(state, 5, 5)
  assert.deepEqual(next, state)
})

test('quoteState 在读取本地存档前不应写回默认值', () => {
  assert.equal(shouldPersistQuoteState(false, 5), false)
  assert.equal(shouldPersistQuoteState(true, 5), true)
  assert.equal(shouldPersistQuoteState(true, 0), false)
})
