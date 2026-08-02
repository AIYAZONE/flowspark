import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseReview } from '../../src/lib/ai/phase2aSchemas.ts'
import { buildFallbackReview } from '../../src/lib/ai/phase2a.ts'

// Later 验收：复盘闭环——周期性 review 自动沉淀「学到了什么」到 user_persona
// 这里验证 ReviewOutput 能稳定携带 learnings，且 fallback 也能产出 learnings。

test('parseReview: 解析 learnings', () => {
  const res = parseReview({
    type: 'review',
    summary_sentence: '本周完成了一个小闭环',
    detected_friction_tag: null,
    tomorrow_card: {
      risk: '明天容易被打断',
      if_then: { if: '如果只剩5分钟', then: '先做第一步' },
      suggested_core_action_direction: '从最小一步开始',
    },
    learnings: [
      { title: '上午专注力更高', detail: '把深度任务放上午' },
      { title: '公开承诺提升完成率' },
    ],
  } as any)
  assert.ok(res.ok, JSON.stringify(res))
  assert.equal(res.value.learnings?.length, 2)
  assert.equal(res.value.learnings?.[0].title, '上午专注力更高')
})

test('parseReview: learnings 过长 title 被丢弃', () => {
  const res = parseReview({
    type: 'review',
    summary_sentence: '本周完成了一个小闭环',
    tomorrow_card: {
      risk: 'r',
      if_then: { if: 'i', then: 't' },
      suggested_core_action_direction: 'd',
    },
    learnings: [{ title: 'x'.repeat(50) }],
  } as any)
  assert.ok(res.ok)
  assert.equal(res.value.learnings?.length ?? 0, 0)
})

test('buildFallbackReview: 始终产出 learnings，保证复盘闭环不中断', () => {
  const low = buildFallbackReview('zh', 1, { friction: 'no_time' })
  assert.ok(Array.isArray(low.learnings) && low.learnings.length >= 1)
  const high = buildFallbackReview('zh', 5, { friction: 'none' })
  assert.ok(Array.isArray(high.learnings) && high.learnings.length >= 1)
})
