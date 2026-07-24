import test from 'node:test'
import assert from 'node:assert/strict'
import type { CommandDraft } from '../command-bar/types.ts'
import { mapCommandDraftToSystemDraftResponse } from './command-draft-mapper.ts'

function baseDraft(): CommandDraft {
  return {
    rawText: 'raw',
    firstIntentText: 'intent',
    followupText: null,
    kind: 'push_next_step',
    status: 'execute_now',
    needsGoalConfirmation: false,
    goalCandidates: [{ id: 'g1', title: '路径A', reason: 'main_path' }],
    suggestedActionTitle: '推进一步',
    suggestedGoalId: 'g1',
    naturalReply: '系统回执',
    nextStepLabel: '下一步提示',
    primaryAction: { type: 'navigate', label: '去执行', href: '/today' },
    changes: [{ label: '系统判断', value: '推进一步', status: 'draft' }],
  }
}

test('mapCommandDraftToSystemDraftResponse: execute_now -> executable', () => {
  const draft = baseDraft()
  draft.status = 'execute_now'
  draft.primaryAction = { type: 'navigate', label: '去执行', href: '/today' }

  const res = mapCommandDraftToSystemDraftResponse(draft)
  assert.equal(res.status, 'executable')
  assert.deepEqual(res.primaryAction, { kind: 'link', label: '去执行', href: '/today' })
})

test('mapCommandDraftToSystemDraftResponse: need_confirmation -> need_more_info (can continue)', () => {
  const draft = baseDraft()
  draft.status = 'need_confirmation'
  draft.primaryAction = { type: 'confirm', label: '先确认路径', href: null }

  const res = mapCommandDraftToSystemDraftResponse(draft)
  assert.equal(res.status, 'need_more_info')
  assert.equal(typeof res.question, 'string')
  assert.equal(res.prefill, draft.firstIntentText)
  assert.equal(res.actionLabel, '先确认路径')
})

test('mapCommandDraftToSystemDraftResponse: not_ready -> not_ready (will be degraded in UI)', () => {
  const draft = baseDraft()
  draft.status = 'not_ready'

  const res = mapCommandDraftToSystemDraftResponse(draft)
  assert.equal(res.status, 'not_ready')
  assert.equal(res.prefill, draft.firstIntentText)
})
