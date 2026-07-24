import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSystemChatHref, getSystemChatSourceCopy } from './system-chat.ts'

test('buildSystemChatHref: builds chat href with source and prefill', () => {
  assert.equal(
    buildSystemChatHref({ source: 'today', prefill: '继续今天这一步' }),
    '/chat?source=today&prefill=%E7%BB%A7%E7%BB%AD%E4%BB%8A%E5%A4%A9%E8%BF%99%E4%B8%80%E6%AD%A5'
  )
})

test('getSystemChatSourceCopy: returns zh copy for profile source', () => {
  assert.deepEqual(getSystemChatSourceCopy({ source: 'profile', locale: 'zh' }), {
    eyebrow: '来自自我',
    title: '继续做你的状态分析',
    body: '这里是唯一的系统对话场。你可以直接让系统分析你最近怎么了，或继续上一轮判断。',
  })
})
