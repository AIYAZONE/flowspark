import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getDefaultSystemMemoryPreferences,
  getSystemMemoryPreferenceProfile,
  mergeSystemMemoryPreferences,
  type SystemMemoryPreferenceRow,
} from './preferences.ts'

function createStoredRow(overrides: Partial<SystemMemoryPreferenceRow>): SystemMemoryPreferenceRow {
  return {
    id: 'pref-1',
    user_id: 'user-1',
    key: 'reply_short',
    title: '回复保持短',
    description: '系统默认用短回复，减少打断感。',
    enabled: true,
    created_at: '2026-07-23T10:00:00.000Z',
    updated_at: '2026-07-23T10:00:00.000Z',
    ...overrides,
  }
}

test('getDefaultSystemMemoryPreferences: 返回稳定的三条默认偏好', () => {
  const preferences = getDefaultSystemMemoryPreferences('zh')

  assert.deepEqual(
    preferences.map((item) => item.key),
    ['reply_short', 'single_clarify_question', 'prefer_focus_mode']
  )
  assert.equal(preferences.every((item) => item.enabled), true)
})

test('mergeSystemMemoryPreferences: 空数据时补齐默认偏好', () => {
  const preferences = mergeSystemMemoryPreferences([], 'zh')

  assert.equal(preferences.length, 3)
  assert.equal(preferences[0]?.title, '回复保持短')
  assert.equal(preferences[1]?.description.includes('只追问一个关键问题'), true)
})

test('mergeSystemMemoryPreferences: 保留已存储偏好的 enabled 状态', () => {
  const preferences = mergeSystemMemoryPreferences(
    [
      createStoredRow({ key: 'reply_short', enabled: false }),
      createStoredRow({ id: 'pref-2', key: 'prefer_focus_mode', title: '优先进入专注模式' }),
    ],
    'zh'
  )

  assert.equal(preferences.find((item) => item.key === 'reply_short')?.enabled, false)
  assert.equal(preferences.find((item) => item.key === 'prefer_focus_mode')?.id, 'pref-2')
  assert.equal(preferences.find((item) => item.key === 'single_clarify_question')?.enabled, true)
})

test('getSystemMemoryPreferenceProfile: 从偏好列表提取文案约束', () => {
  const profile = getSystemMemoryPreferenceProfile([
    createStoredRow({ key: 'reply_short', enabled: false }),
    createStoredRow({ id: 'pref-2', key: 'single_clarify_question', enabled: true }),
    createStoredRow({ id: 'pref-3', key: 'prefer_focus_mode', enabled: false }),
  ])

  assert.deepEqual(profile, {
    preferShortReply: false,
    preferSingleClarifyQuestion: true,
    preferFocusMode: false,
  })
})
