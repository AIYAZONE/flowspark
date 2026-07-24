import test from 'node:test'
import assert from 'node:assert/strict'

import { parseUserCommand } from './parse.ts'

test('parseUserCommand detects multi-intent and keeps first intent', () => {
  assert.deepEqual(parseUserCommand('今天推进英语，顺便把简历也安排一下'), {
    rawText: '今天推进英语，顺便把简历也安排一下',
    firstIntentText: '今天推进英语',
    followupText: '把简历也安排一下',
    kind: 'push_next_step',
    mentionsCore: false,
    isMultiIntent: true,
  })
})

test('parseUserCommand detects core intent', () => {
  const parsed = parseUserCommand('今天核心是把简历改完')
  assert.equal(parsed.kind, 'set_today_core')
  assert.equal(parsed.mentionsCore, true)
})

test('parseUserCommand detects completion intent', () => {
  const parsed = parseUserCommand('我把跟读做完了')
  assert.equal(parsed.kind, 'complete_action')
})

test('parseUserCommand detects current-task review intent', () => {
  const parsed = parseUserCommand('我现在有什么任务')
  assert.equal(parsed.kind, 'review_current_tasks')
})

test('parseUserCommand detects next-step style review intent', () => {
  const parsed = parseUserCommand('我现在该干什么')
  assert.equal(parsed.kind, 'review_current_tasks')
})

test('parseUserCommand detects current-task review intent for 做什么 phrasing', () => {
  const parsed = parseUserCommand('我现在该做什么')
  assert.equal(parsed.kind, 'review_current_tasks')
})

test('parseUserCommand detects flexible next-step phrasing', () => {
  assert.equal(parseUserCommand('我现在能先做什么').kind, 'review_current_tasks')
  assert.equal(parseUserCommand('现在先处理哪一项').kind, 'review_current_tasks')
})

test('parseUserCommand detects main-path review intent', () => {
  assert.equal(parseUserCommand('今天主线是什么').kind, 'review_main_path')
  assert.equal(parseUserCommand('现在最重要的是什么').kind, 'review_main_path')
  assert.equal(parseUserCommand('现在优先推进哪个').kind, 'review_main_path')
  assert.equal(parseUserCommand('接下来我该推进哪个').kind, 'review_main_path')
})

test('parseUserCommand detects capability and create-action intents', () => {
  assert.equal(parseUserCommand('你能干什么').kind, 'ask_capabilities')
  assert.equal(parseUserCommand('你能帮我创建行动吗').kind, 'create_action_request')
})
