import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatFeedbackReason } from '../../../src/lib/chat/types.ts'
import { recordChatFeedback } from '../../../src/lib/chat/persistence.ts'
import { buildFeedbackDirective, getChatFeedbackSummary } from '../../../src/lib/chat/feedback.ts'

type FeedbackRow = {
  user_id: string
  turn_id: string
  rating: 'up' | 'down'
  reason: ChatFeedbackReason | null
  excerpt: string | null
}

class MockBuilder {
  db: MockDb
  table: string
  lastUpsert: FeedbackRow | null = null
  userIdFilter: string | null = null
  constructor(db: MockDb, table: string) {
    this.db = db
    this.table = table
  }
  select(): this {
    return this
  }
  eq(col: string, val: string): this {
    if (col === 'user_id') this.userIdFilter = val
    return this
  }
  gte(): this {
    return this
  }
  limit(): this {
    return this
  }
  upsert(payload: FeedbackRow): this {
    this.lastUpsert = payload
    const existing = this.db.feedbackRows.find(
      (r) => r.user_id === payload.user_id && r.turn_id === payload.turn_id
    )
    if (existing) {
      Object.assign(existing, payload)
    } else {
      this.db.feedbackRows.push({ ...payload })
    }
    return this
  }
  then(resolve: (value: unknown) => void): void {
    if (this.table === 'chat_feedback') {
      if (this.lastUpsert) {
        resolve({ error: null })
        return
      }
      const rows = this.userIdFilter
        ? this.db.feedbackRows.filter((r) => r.user_id === this.userIdFilter)
        : this.db.feedbackRows
      resolve({ data: rows, error: null })
      return
    }
    resolve({ data: [], error: null })
  }
}

class MockDb {
  feedbackRows: FeedbackRow[] = []
  from(table: string): MockBuilder {
    return new MockBuilder(this, table)
  }
}

const asClient = (db: MockDb) => db as unknown as SupabaseClient

test('recordChatFeedback upserts without creating duplicate rows for same user+turn', async () => {
  const db = new MockDb()
  const client = asClient(db)
  await recordChatFeedback(client, 'u1', {
    turnId: 't1',
    rating: 'up',
    reason: null,
    excerpt: '好的建议'
  })
  await recordChatFeedback(client, 'u1', {
    turnId: 't1',
    rating: 'down',
    reason: 'too_verbose',
    excerpt: '太啰嗦了'
  })
  assert.equal(db.feedbackRows.length, 1)
  assert.equal(db.feedbackRows[0].rating, 'down')
  assert.equal(db.feedbackRows[0].reason, 'too_verbose')
})

test('recordChatFeedback truncates excerpt to 280 chars', async () => {
  const db = new MockDb()
  const long = 'x'.repeat(500)
  const result = await recordChatFeedback(asClient(db), 'u1', {
    turnId: 't2',
    rating: 'up',
    reason: null,
    excerpt: long
  })
  assert.equal(result.ok, true)
  assert.equal(db.feedbackRows[0].excerpt?.length, 280)
})

test('recordChatFeedback rejects invalid rating', async () => {
  const result = await recordChatFeedback(asClient(new MockDb()), 'u1', {
    turnId: 't3',
    rating: 'sideways' as 'up',
    reason: null,
    excerpt: null
  })
  assert.equal(result.error, 'missing_fields')
})

test('getChatFeedbackSummary aggregates down/up counts and ranks reasons', async () => {
  const db = new MockDb()
  db.feedbackRows = [
    { user_id: 'u1', turn_id: 'a', rating: 'down', reason: 'too_verbose', excerpt: null },
    { user_id: 'u1', turn_id: 'b', rating: 'down', reason: 'too_verbose', excerpt: null },
    { user_id: 'u1', turn_id: 'c', rating: 'down', reason: 'inaccurate', excerpt: null },
    { user_id: 'u1', turn_id: 'd', rating: 'up', reason: null, excerpt: null },
    { user_id: 'u2', turn_id: 'e', rating: 'down', reason: 'not_relevant', excerpt: null }
  ]
  const summary = await getChatFeedbackSummary(asClient(db), 'u1')
  assert.equal(summary.downCount, 3)
  assert.equal(summary.upCount, 1)
  assert.deepEqual(summary.topReasons, [
    { reason: 'too_verbose', count: 2 },
    { reason: 'inaccurate', count: 1 }
  ])
})

test('buildFeedbackDirective returns empty when downCount < 2', () => {
  assert.equal(buildFeedbackDirective({ downCount: 1, upCount: 0, topReasons: [], customCount: 0 }, 'zh'), '')
  assert.equal(buildFeedbackDirective(null, 'zh'), '')
})

test('buildFeedbackDirective returns localized instruction when downCount >= 2', () => {
  const summary = {
    downCount: 3,
    upCount: 1,
    customCount: 0,
    topReasons: [
      { reason: 'too_verbose' as ChatFeedbackReason, count: 2 },
      { reason: 'inaccurate' as ChatFeedbackReason, count: 1 }
    ]
  }
  const zh = buildFeedbackDirective(summary, 'zh')
  const en = buildFeedbackDirective(summary, 'en')
  assert.match(zh, /3 条/)
  assert.match(zh, /更简洁直接/)
  assert.match(en, /3 recent answers/)
  assert.match(en, /more concise/)
})

test('buildFeedbackDirective works without reasons', () => {
  const text = buildFeedbackDirective({ downCount: 2, upCount: 0, topReasons: [], customCount: 0 }, 'zh')
  assert.match(text, /2 条/)
})
