import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildChatSystemPrompt } from '../../../src/lib/chat/prompt.ts'

test('includes goals, actions and today, with zh note', () => {
  const prompt = buildChatSystemPrompt({
    locale: 'zh',
    context: {
      today: '2026-07-27',
      goals: [{ title: '成为独立开发者', category: '职业', priority: 'high' }],
      todayActions: [{ title: '写周报', type: 'core', priority: 'medium' }]
    }
  })
  assert.match(prompt, /成为独立开发者/)
  assert.match(prompt, /写周报/)
  assert.match(prompt, /2026-07-27/)
  assert.match(prompt, /简体中文/)
})

test('uses English note for en locale', () => {
  const prompt = buildChatSystemPrompt({
    locale: 'en',
    context: { today: '2026-07-27', goals: [], todayActions: [] }
  })
  assert.match(prompt, /English/)
})
