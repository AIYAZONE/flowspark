import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  findDuplicateOpenAction,
  findReferencedOpenActions,
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

const OPEN = [
  { id: 'r1', title: '梳理家庭月收入与固定支出' },
  { id: 'r2', title: '设计四账户存储划分方案' },
  { id: 'r3', title: '老任务' }
]

test('findReferencedOpenActions returns action whose title appears verbatim in reply', () => {
  const reply =
    '系统判断\n先做「梳理家庭月收入与固定支出」。\n这是今天清单里启动成本最低的一项。'
  const refs = findReferencedOpenActions(reply, OPEN)
  assert.deepEqual(refs.map((r) => r.id), ['r1'])
})

test('findReferencedOpenActions returns multiple referenced actions, capped at max', () => {
  const reply =
    '先做「梳理家庭月收入与固定支出」，再做「设计四账户存储划分方案」，最后处理老任务。'
  const refs = findReferencedOpenActions(reply, OPEN, 2)
  assert.deepEqual(refs.map((r) => r.id), ['r1', 'r2'])
})

test('findReferencedOpenActions ignores actions not mentioned in reply', () => {
  const reply = '今天先休息一下，不做任何财务动作。'
  const refs = findReferencedOpenActions(reply, OPEN)
  assert.equal(refs.length, 0)
})

test('findReferencedOpenActions ignores overly short titles (avoid false positives)', () => {
  const open = [{ id: 's1', title: '读书' }, { id: 's2', title: '锻炼' }, ...OPEN]
  const reply = '多做读书和锻炼对身体好。'
  const refs = findReferencedOpenActions(reply, open)
  assert.equal(refs.length, 0)
})
