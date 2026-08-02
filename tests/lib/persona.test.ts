import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  personaTextSimilarity,
  higherConfidence,
  PERSONA_MERGE_THRESHOLD,
} from '../../src/lib/persona.ts'

// #3 验收：个人记忆的冲突/合并
// 同一条信息换种说法补充时，相似度应达到合并阈值，从而走「更新而非重复插入」。

test('personaTextSimilarity: 同义中文表述高度相似', () => {
  const sim = personaTextSimilarity('擅长把复杂讲简单', '能把复杂事讲简单')
  assert.ok(sim >= PERSONA_MERGE_THRESHOLD, `期望 >= ${PERSONA_MERGE_THRESHOLD}, 实际 ${sim}`)
})

test('personaTextSimilarity: 完全相同为 1', () => {
  assert.equal(personaTextSimilarity('不爱出镜', '不爱出镜'), 1)
})

test('personaTextSimilarity: 明显不同信息相似度低', () => {
  const sim = personaTextSimilarity('擅长把复杂讲简单', '本职做后端开发')
  assert.ok(sim < PERSONA_MERGE_THRESHOLD, `期望 < ${PERSONA_MERGE_THRESHOLD}, 实际 ${sim}`)
})

test('personaTextSimilarity: 英文词重叠', () => {
  const sim = personaTextSimilarity('love reading books', 'love reading books')
  assert.equal(sim, 1)
  const low = personaTextSimilarity('love reading books', 'hate sports')
  assert.ok(low < PERSONA_MERGE_THRESHOLD)
})

test('higherConfidence: 取更高等级', () => {
  assert.equal(higherConfidence('low', 'high'), 'high')
  assert.equal(higherConfidence('medium', 'low'), 'medium')
  assert.equal(higherConfidence('high', 'high'), 'high')
})
