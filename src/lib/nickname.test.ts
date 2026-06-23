import test from 'node:test'
import assert from 'node:assert/strict'

import { getNicknameUnits, truncateNicknameToUnits } from './nickname.ts'

test('ASCII 单位计数为 1', () => {
  assert.equal(getNicknameUnits('abcXYZ012'), 9)
})

test('非 ASCII 单位计数为 2', () => {
  assert.equal(getNicknameUnits('中文'), 4)
})

test('emoji 作为非 ASCII 单位计数为 2', () => {
  assert.equal(getNicknameUnits('😀'), 2)
})

test('混合字符串单位累加', () => {
  assert.equal(getNicknameUnits('ab中😀'), 1 + 1 + 2 + 2)
})

test('按单位截断不会截断 surrogate pair', () => {
  assert.equal(truncateNicknameToUnits('😀a', 1), '')
  assert.equal(truncateNicknameToUnits('😀a', 2), '😀')
  assert.equal(truncateNicknameToUnits('😀a', 3), '😀a')
})

test('按单位截断在边界处停止', () => {
  assert.equal(truncateNicknameToUnits('中文abc', 4), '中文')
  assert.equal(truncateNicknameToUnits('中文abc', 5), '中文a')
  assert.equal(truncateNicknameToUnits('中文abc', 6), '中文ab')
})

