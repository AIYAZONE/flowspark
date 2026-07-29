import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  findDuplicateOpenAction,
  normalizeActionTitle
} from '../../../src/lib/chat/action-dedup.ts'

// 最小可 thenable 的 actions 表模拟，只服务于去重匹配逻辑断言。
class MockBuilder {
  db: MockDb
  table: string
  constructor(db: MockDb, table: string) {
    this.db = db
    this.table = table
  }
  select(): this {
    return this
  }
  eq(): this {
    return this
  }
  then(resolve: (value: unknown) => void): void {
    if (this.table === 'actions') {
      resolve({ data: this.db.actions, error: null })
      return
    }
    resolve({ data: [], error: null })
  }
}

class MockDb {
  actions: Array<{ id: string; title: string; completed: boolean | null }> = []
  from(table: string): MockBuilder {
    return new MockBuilder(this, table)
  }
}

const asClient = (db: MockDb) => db as unknown as SupabaseClient

test('normalizeActionTitle strips spaces, casing and common punctuation', () => {
  assert.equal(
    normalizeActionTitle('  「梳理 家庭月收入」与固定支出！ '),
    '梳理家庭月收入与固定支出'
  )
})

test('findDuplicateOpenAction returns existing OPEN action on exact match', async () => {
  const db = new MockDb()
  db.actions = [
    { id: 'a1', title: '梳理家庭月收入与固定支出', completed: false },
    { id: 'a2', title: '老任务', completed: true }
  ]
  const hit = await findDuplicateOpenAction(asClient(db), 'u1', '梳理家庭月收入与固定支出')
  assert.equal(hit?.id, 'a1')
})

test('findDuplicateOpenAction matches by normalized substring', async () => {
  const db = new MockDb()
  db.actions = [{ id: 'a1', title: '梳理家庭月收入与固定支出', completed: false }]
  const hit = await findDuplicateOpenAction(asClient(db), 'u1', '梳理家庭月收入')
  assert.equal(hit?.id, 'a1')
})

test('findDuplicateOpenAction ignores COMPLETED actions', async () => {
  const db = new MockDb()
  db.actions = [{ id: 'a1', title: '老任务', completed: true }]
  const hit = await findDuplicateOpenAction(asClient(db), 'u1', '老任务')
  assert.equal(hit, null)
})

test('findDuplicateOpenAction returns null when nothing matches', async () => {
  const db = new MockDb()
  db.actions = [{ id: 'a1', title: '已有的', completed: false }]
  const hit = await findDuplicateOpenAction(asClient(db), 'u1', '全新的事')
  assert.equal(hit, null)
})
