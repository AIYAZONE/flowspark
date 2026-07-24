import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTurnFromDraftResponse, createSystemTurnId } from './turn-builder.ts'

test('buildTurnFromDraftResponse: maps executable -> responded.execute', () => {
  const turn = buildTurnFromDraftResponse({
    sourcePage: 'system',
    userText: '我今天该做什么',
    draftResponse: {
      status: 'executable',
      judgement: '今天只需要推进主线',
      reason: '你已经有明确主线',
      nextStep: '进入专注模式开始推进',
      primaryAction: { kind: 'link', href: '/today?view=focus', label: '去执行' },
    },
  })
  assert.equal(turn.state, 'responded.execute')
  assert.equal(turn.tag, '系统判断')
})

test('createSystemTurnId: falls back when crypto.randomUUID is unavailable', () => {
  const originalCrypto = globalThis.crypto
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    configurable: true,
  })

  try {
    const id = createSystemTurnId()
    assert.equal(typeof id, 'string')
    assert.equal(id.length > 0, true)
  } finally {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    })
  }
})
