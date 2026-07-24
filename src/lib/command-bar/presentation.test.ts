import test from 'node:test'
import assert from 'node:assert/strict'

import { buildCommandPresentation } from './presentation.ts'

test('buildCommandPresentation returns not_ready with create-path guidance when no active goal exists', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'push_next_step',
    firstIntentText: '推进英语',
    followupText: null,
    goalCandidates: [],
    suggestedActionTitle: '英语跟读 15 分钟',
    topOpenAction: null,
  })

  assert.equal(draft.status, 'not_ready')
  assert.equal(draft.primaryAction?.type, 'navigate')
  assert.equal(draft.primaryAction?.href, '/goals')
  assert.match(draft.naturalReply, /先定义一条人生路径/)
})

test('buildCommandPresentation returns need_confirmation when path choice is still required', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'push_next_step',
    firstIntentText: '推进英语',
    followupText: '把简历也安排一下',
    goalCandidates: [
      { id: 'g1', title: '英语口语', reason: 'main_path' },
      { id: 'g2', title: '求职', reason: 'recent_active' },
    ],
    suggestedActionTitle: '英语跟读 15 分钟',
    topOpenAction: null,
  })

  assert.equal(draft.status, 'need_confirmation')
  assert.equal(draft.primaryAction?.type, 'confirm')
  assert.match(draft.nextStepLabel, /先选一条人生路径/)
  assert.equal(draft.changes.at(-1)?.value, '把简历也安排一下')
})

test('buildCommandPresentation returns execute_now for task review with a top task', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'review_current_tasks',
    firstIntentText: '我现在该干什么',
    followupText: null,
    goalCandidates: [],
    suggestedActionTitle: null,
    topOpenAction: {
      id: 'a1',
      title: '英语跟读 15 分钟',
      goalTitle: '英语口语',
      isCore: true,
    },
  })

  assert.equal(draft.status, 'execute_now')
  assert.equal(draft.primaryAction?.type, 'navigate')
  assert.equal(draft.primaryAction?.href, '/today?action=a1#today-actions')
  assert.match(draft.naturalReply, /现在先做/)
})

test('buildCommandPresentation returns execute_now for main-path review with a top task', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'review_main_path',
    firstIntentText: '今天主线是什么',
    followupText: null,
    goalCandidates: [{ id: 'g1', title: '英语口语', reason: 'main_path' }],
    suggestedActionTitle: null,
    topOpenAction: {
      id: 'a1',
      title: '英语跟读 15 分钟',
      goalTitle: '英语口语',
      isCore: true,
    },
  })

  assert.equal(draft.status, 'execute_now')
  assert.equal(draft.primaryAction?.href, '/today?action=a1#today-actions')
  assert.match(draft.naturalReply, /主线是「英语口语」/)
})

test('buildCommandPresentation adjusts copy for next-step phrasing', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'review_current_tasks',
    firstIntentText: '我下一步该做什么',
    followupText: null,
    goalCandidates: [],
    suggestedActionTitle: null,
    topOpenAction: {
      id: 'a1',
      title: '英语跟读 15 分钟',
      goalTitle: '英语口语',
      isCore: false,
    },
  })

  assert.match(draft.naturalReply, /你下一步先做/)
  assert.match(draft.nextStepLabel, /先把这一项做掉/)
})

test('buildCommandPresentation adjusts copy for priority phrasing', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'review_main_path',
    firstIntentText: '现在最重要的是什么',
    followupText: null,
    goalCandidates: [{ id: 'g1', title: '英语口语', reason: 'main_path' }],
    suggestedActionTitle: null,
    topOpenAction: {
      id: 'a1',
      title: '英语跟读 15 分钟',
      goalTitle: '英语口语',
      isCore: true,
    },
  })

  assert.match(draft.naturalReply, /现在最该优先的是「英语口语」/)
  assert.match(draft.nextStepLabel, /先把主线推进一格/)
})

test('buildCommandPresentation returns capability response', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'ask_capabilities',
    firstIntentText: '你能干什么',
    followupText: null,
    goalCandidates: [],
    suggestedActionTitle: null,
    topOpenAction: null,
  })

  assert.equal(draft.status, 'execute_now')
  assert.equal(draft.primaryAction?.type, 'navigate')
  assert.match(draft.naturalReply, /我可以帮你判断现在先做什么/)
})

test('buildCommandPresentation returns clarify response for generic create-action request', () => {
  const draft = buildCommandPresentation({
    locale: 'zh',
    kind: 'create_action_request',
    firstIntentText: '你能帮我创建行动吗',
    followupText: null,
    goalCandidates: [],
    suggestedActionTitle: null,
    topOpenAction: null,
  })

  assert.equal(draft.status, 'need_confirmation')
  assert.equal(draft.primaryAction?.type, 'confirm')
  assert.match(draft.nextStepLabel, /直接告诉我要创建的行动内容/)
})
