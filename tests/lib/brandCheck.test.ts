import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBrandCheck } from '../../src/lib/ai/phase2aSchemas.ts'
import { buildFallbackBrandCheck } from '../../src/lib/ai/phase2a.ts'

// Later 验收：个人品牌专项——人设一致性检查
// 以 user_persona 为人设基准，检查草稿是否与人设一致/冲突/风格不符。

const persona = [
  { title: '不爱出镜', detail: '更偏好幕后与文字表达' },
  { title: '擅长把复杂讲简单', detail: '' }
]

test('parseBrandCheck: 解析分数/命中/建议', () => {
  const res = parseBrandCheck({
    type: 'brand_check',
    consistency_score: 42,
    hits: [{ persona_title: '不爱出镜', verdict: 'conflict', note: '草稿强调露脸口播' }],
    suggestion: '建议改成幕后解说或配音形式'
  } as any)
  assert.ok(res.ok, JSON.stringify(res))
  assert.equal(res.value.consistency_score, 42)
  assert.equal(res.value.hits.length, 1)
  assert.equal(res.value.hits[0].verdict, 'conflict')
})

test('parseBrandCheck: 分数越界被夹紧到 0-100', () => {
  const res = parseBrandCheck({
    type: 'brand_check',
    consistency_score: 250,
    suggestion: 'x'
  } as any)
  assert.ok(res.ok)
  assert.equal(res.value.consistency_score, 100)
})

test('parseBrandCheck: 缺少 suggestion 视为非法', () => {
  const res = parseBrandCheck({
    type: 'brand_check',
    consistency_score: 80,
    hits: []
  } as any)
  assert.equal(res.ok, false)
})

test('buildFallbackBrandCheck: 草稿出现抗拒词相关项时标 conflict', () => {
  const out = buildFallbackBrandCheck('zh', '我决定这次露脸口播，面对镜头讲', persona)
  const conflict = out.hits.find((h) => h.persona_title === '不爱出镜')
  assert.ok(conflict, '应检测到与「不爱出镜」的冲突')
  assert.equal(conflict!.verdict, 'conflict')
  assert.ok(out.consistency_score < 100)
})

test('buildFallbackBrandCheck: 无冲突草稿分数较高', () => {
  const out = buildFallbackBrandCheck('zh', '用简单的话把这件事讲清楚', persona)
  assert.equal(out.hits.length, 0)
  assert.ok(out.consistency_score >= 70)
})

test('buildFallbackBrandCheck: 视频号语境「真人出镜」命中冲突', () => {
  // 锚定视频号：兜底识别视频号常见露面表达
  const out = buildFallbackBrandCheck('zh', '这期我真人出镜，对着镜头口播', persona)
  const conflict = out.hits.find((h) => h.persona_title === '不爱出镜')
  assert.ok(conflict, '「真人出镜/口播」应命中视频号人设冲突')
  assert.equal(conflict!.verdict, 'conflict')
})

test('buildFallbackBrandCheck: 锚定视频号场景，建议指向人设', () => {
  const out = buildFallbackBrandCheck('zh', '我决定这次露脸口播，面对镜头讲', persona)
  assert.ok(out.suggestion.includes('人设') || out.suggestion.includes('视频号'),
    '视频号锚定：建议应明确指向你的人设')
})
