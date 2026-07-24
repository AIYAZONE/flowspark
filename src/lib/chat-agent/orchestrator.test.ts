import test from 'node:test'
import assert from 'node:assert/strict'

import { draftFromUnderstanding } from './orchestrator.ts'
import type { ChatAgentUnderstanding } from './schemas.ts'

function makeUnderstanding(overrides: Partial<ChatAgentUnderstanding> = {}): ChatAgentUnderstanding {
  return {
    type: 'chat_understanding',
    intent_type: 'general_guidance',
    user_goal_summary: '用户想继续推进事情',
    reasoning_summary: '已有路径与行动，可以直接给出去向',
    judgement: '先把最贴近主线的动作推进掉。',
    next_step: '打开今日执行。',
    reply_mode: 'execute',
    needs_clarification: false,
    clarifying_question: null,
    suggested_action_title: null,
    target_path_hint: null,
    recommended_surface: 'chat',
    confidence: 'high',
    ...overrides,
  }
}

const goals = [
  { id: 'g1', title: '英语口语', priority: 'high', start_date: null, end_date: null },
  { id: 'g2', title: '求职', priority: 'medium', start_date: null, end_date: null },
]

const openActions = [
  { id: 'a1', title: '英语跟读 15 分钟', goalId: 'g1', goalTitle: '英语口语', priority: 'high', type: 'core' },
  { id: 'a2', title: '更新简历', goalId: 'g2', goalTitle: '求职', priority: 'medium', type: null },
]

const goalCandidates = [
  { id: 'g1', title: '英语口语', reason: 'main_path' as const },
  { id: 'g2', title: '求职', reason: 'recent_active' as const },
]

test('draftFromUnderstanding maps review_current_tasks to the hinted goal action', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '我现在先推进英语',
    understanding: makeUnderstanding({
      intent_type: 'review_current_tasks',
      judgement: '现在先推进英语口语。',
      next_step: '先去做英语跟读。',
      recommended_surface: 'today',
      target_path_hint: '英语',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.equal(draft?.status, 'execute_now')
  assert.equal(draft?.primaryAction?.type, 'navigate')
  assert.equal(draft?.primaryAction?.href, '/today?action=a1#today-actions')
  assert.match(draft?.changes.find((item) => item.label === '命中路径')?.value || '', /英语口语/)
})

test('draftFromUnderstanding maps clarify_missing_info to a continue action', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '帮我建个行动',
    understanding: makeUnderstanding({
      intent_type: 'clarify_missing_info',
      judgement: '我知道你要创建行动，但内容还不够具体。',
      next_step: '直接补一句行动内容。',
      reply_mode: 'clarify',
      needs_clarification: true,
      clarifying_question: '你要创建的具体行动是什么？',
      suggested_action_title: null,
      recommended_surface: 'chat',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.equal(draft?.status, 'need_confirmation')
  assert.equal(draft?.primaryAction?.type, 'confirm')
  assert.equal(draft?.primaryAction?.label, '继续补充')
  assert.equal(draft?.nextStepLabel, '你要创建的具体行动是什么？')
})

test('draftFromUnderstanding maps general guidance to goals when goals surface is recommended', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '我想先把人生路径理顺',
    understanding: makeUnderstanding({
      intent_type: 'general_guidance',
      judgement: '先把要推进的路径收束清楚，再往下拆动作。',
      next_step: '先去看人生路径。',
      recommended_surface: 'goals',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.equal(draft?.status, 'execute_now')
  assert.equal(draft?.primaryAction?.type, 'navigate')
  assert.equal(draft?.primaryAction?.href, '/goals')
})

test('draftFromUnderstanding uses user-facing copy for capability answers', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '你能做什么',
    understanding: makeUnderstanding({
      intent_type: 'capability_answer',
      judgement: '用户明确询问系统能力范围，应直接回答核心能力，避免重复历史。',
      next_step: '简要列出核心能力：判断当前任务、识别主线、创建行动草案、引导至今日执行层。',
      reply_mode: 'answer',
      recommended_surface: 'chat',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.equal(draft?.status, 'execute_now')
  assert.match(draft?.naturalReply || '', /我可以帮你判断现在先做什么/)
  assert.doesNotMatch(draft?.naturalReply || '', /用户明确询问/)
  assert.equal(draft?.changes.length, 1)
  assert.match(draft?.changes[0]?.value || '', /任务判断/)
})

test('draftFromUnderstanding strips meta narration from user-facing judgement', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '我现在该做什么',
    understanding: makeUnderstanding({
      intent_type: 'review_current_tasks',
      judgement: '你再次问现在该做什么，所以我直接给你当前优先项。先去做英语跟读。',
      next_step: '你可以直接打开今日执行。',
      recommended_surface: 'today',
      target_path_hint: '英语',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.doesNotMatch(draft?.naturalReply || '', /你再次问/)
  assert.match(draft?.naturalReply || '', /先去做英语跟读/)
})

test('draftFromUnderstanding strips replay-style history narration from user-facing judgement', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '我现在该做什么',
    understanding: makeUnderstanding({
      intent_type: 'review_current_tasks',
      judgement: '你之前问过同样的问题，我给出了3个高优先级行动。现在再看，先去做英语跟读。',
      next_step: '现在再看，你可以直接打开今日执行。',
      recommended_surface: 'today',
      target_path_hint: '英语',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.doesNotMatch(draft?.naturalReply || '', /你之前问过同样的问题|我给出了|现在再看/)
  assert.match(draft?.naturalReply || '', /先去做英语跟读/)
  assert.doesNotMatch(draft?.nextStepLabel || '', /现在再看/)
})

test('draftFromUnderstanding lists executable tasks when user asks to list them', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '列出来',
    understanding: makeUnderstanding({
      intent_type: 'review_current_tasks',
      judgement: '我帮你列出当前可执行的任务。',
      next_step: '回复 1/2/3 来选择。',
      reply_mode: 'answer',
      recommended_surface: 'chat',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.equal(draft?.status, 'execute_now')
  assert.match(draft?.naturalReply || '', /1\)/)
  assert.match(draft?.naturalReply || '', /英语跟读 15 分钟/)
  assert.match(draft?.nextStepLabel || '', /回复/)
  assert.equal(draft?.primaryAction?.type, 'navigate')
  assert.match(draft?.primaryAction?.href || '', /\/today/)
})

test('draftFromUnderstanding opens the first task when user picks "第一个"', () => {
  const draft = draftFromUnderstanding({
    locale: 'zh',
    text: '第一个吧',
    understanding: makeUnderstanding({
      intent_type: 'review_current_tasks',
      judgement: '好，就按第一个。',
      next_step: '打开执行。',
      reply_mode: 'execute',
      recommended_surface: 'today',
    }),
    goals,
    openActions,
    goalCandidates,
    mainPath: { id: 'g1', title: '英语口语' },
  })

  assert.ok(draft)
  assert.equal(draft?.status, 'execute_now')
  assert.equal(draft?.primaryAction?.type, 'navigate')
  assert.equal(draft?.primaryAction?.href, '/today?action=a1#today-actions')
})
