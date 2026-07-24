import test from 'node:test'
import assert from 'node:assert/strict'

import { parseChatAgentUnderstanding } from './schemas.ts'

test('parseChatAgentUnderstanding accepts a valid execute payload', () => {
  const result = parseChatAgentUnderstanding({
    type: 'chat_understanding',
    intent_type: 'review_current_tasks',
    user_goal_summary: '用户想知道现在先推进什么',
    reasoning_summary: '当前存在未完成行动，适合直接给出执行入口',
    judgement: '现在先把英语跟读推进掉。',
    next_step: '先打开今日执行。',
    reply_mode: 'execute',
    needs_clarification: false,
    clarifying_question: null,
    suggested_action_title: null,
    target_path_hint: '英语口语',
    recommended_surface: 'today',
    confidence: 'high',
  })

  assert.equal(result.ok, true)
  if (!result.ok) return

  assert.equal(result.value.intent_type, 'review_current_tasks')
  assert.equal(result.value.recommended_surface, 'today')
  assert.equal(result.value.confidence, 'high')
})

test('parseChatAgentUnderstanding requires a clarifying question when reply_mode is clarify', () => {
  const result = parseChatAgentUnderstanding({
    type: 'chat_understanding',
    intent_type: 'clarify_missing_info',
    user_goal_summary: '用户想创建行动，但缺少对象',
    reasoning_summary: '缺少行动内容，不能直接生成下一步',
    judgement: '我已经知道你要推进事情，但还缺一个关键信息。',
    next_step: '直接补充要创建的行动内容。',
    reply_mode: 'clarify',
    needs_clarification: true,
    clarifying_question: null,
    suggested_action_title: null,
    target_path_hint: null,
    recommended_surface: 'chat',
    confidence: 'medium',
  })

  assert.equal(result.ok, false)
  if (result.ok) return

  assert.match(result.violations.join(','), /clarifying_question_required/)
})
