import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { recordChatAction, completeChatAction } from '../../../src/lib/chat/persistence.ts'

// 极简可 thenable 的 Supabase 查询构造器模拟：记录调用并返回预设响应，
// 足以在 node 测试中断言"落库"逻辑（表 / 字段 / 范围 / 错误处理），无需真实数据库。
class MockBuilder {
  private operation: 'select' | 'insert' | 'update' = 'select'
  private insertPayload: Record<string, unknown> | null = null
  private updatePayload: Record<string, unknown> | null = null
  private filters: Array<[string, unknown]> = []

  db: MockDb
  table: string

  constructor(db: MockDb, table: string) {
    this.db = db
    this.table = table
  }

  select(): this {
    // 不改变 operation：.insert().select('id') 仍应走 insert 分支
    return this
  }
  insert(payload: Record<string, unknown>): this {
    this.operation = 'insert'
    this.insertPayload = payload
    return this
  }
  update(payload: Record<string, unknown>): this {
    this.operation = 'update'
    this.updatePayload = payload
    return this
  }
  eq(col: string, val: unknown): this {
    this.filters.push([col, val])
    return this
  }
  single(): this {
    return this
  }

  then(resolve: (value: unknown) => void): void {
    if (this.operation === 'insert') {
      this.db.lastInsert = this.insertPayload
      resolve(this.db.responses.insert ?? { data: { id: this.db.nextId }, error: null })
      return
    }
    if (this.operation === 'update') {
      this.db.lastUpdate = { payload: this.updatePayload, filters: this.filters }
      resolve(this.db.responses.update ?? { error: null })
      return
    }
    if (this.table === 'goals') {
      resolve({ data: this.db.goals, error: null })
      return
    }
    resolve({ data: [], error: null })
  }
}

class MockDb {
  goals: Array<{ id: string; title: string; status: string }> = []
  responses: { insert?: { data: { id: string } | null; error: unknown }; update?: { error: unknown } } = {}
  nextId = 'act_test'
  lastInsert: Record<string, unknown> | null = null
  lastUpdate: { payload: Record<string, unknown> | null; filters: Array<[string, unknown]> } | null = null

  from(table: string): MockBuilder {
    return new MockBuilder(this, table)
  }
}

const asClient = (db: MockDb) => db as unknown as SupabaseClient

test('recordChatAction inserts under goal matched by hint and returns id', async () => {
  const db = new MockDb()
  db.goals = [
    { id: 'g1', title: '成为独立开发者', status: 'active' },
    { id: 'g2', title: '每周健身三次', status: 'active' }
  ]
  const res = await recordChatAction(asClient(db), 'u1', {
    title: '写周报',
    goalHint: '独立开发者',
    reason: '推进路径',
    today: '2026-07-29'
  })
  assert.equal(res.error, undefined)
  assert.equal(res.actionId, 'act_test')
  assert.equal(db.lastInsert?.goal_id, 'g1')
  assert.equal(db.lastInsert?.user_id, 'u1')
  assert.equal(db.lastInsert?.owner_id, 'u1')
  assert.equal(db.lastInsert?.title, '写周报')
  assert.equal(db.lastInsert?.type, 'core')
  assert.equal(db.lastInsert?.priority, 'medium')
  assert.equal(db.lastInsert?.completed, false)
  assert.equal(db.lastInsert?.start_date, '2026-07-29')
  assert.equal(db.lastInsert?.end_date, '2026-07-29')
  assert.match(String(db.lastInsert?.description), /来自系统对话/)
})

test('recordChatAction falls back to first active goal when hint misses', async () => {
  const db = new MockDb()
  db.goals = [
    { id: 'g1', title: '成为独立开发者', status: 'active' },
    { id: 'g2', title: '健身', status: 'active' }
  ]
  const res = await recordChatAction(asClient(db), 'u1', {
    title: '随便做点事',
    goalHint: '不存在的目标',
    reason: '',
    today: '2026-07-29'
  })
  assert.equal(res.actionId, 'act_test')
  assert.equal(db.lastInsert?.goal_id, 'g1')
})

test('recordChatAction returns no_active_goal when no active goals', async () => {
  const db = new MockDb()
  db.goals = []
  const res = await recordChatAction(asClient(db), 'u1', {
    title: 'x',
    goalHint: null,
    reason: '',
    today: '2026-07-29'
  })
  assert.equal(res.error, 'no_active_goal')
})

test('recordChatAction rejects empty title before any DB call', async () => {
  const db = new MockDb()
  db.goals = [{ id: 'g1', title: 'a', status: 'active' }]
  const res = await recordChatAction(asClient(db), 'u1', {
    title: '',
    goalHint: null,
    reason: '',
    today: '2026-07-29'
  })
  assert.equal(res.error, 'missing_fields')
  assert.equal(db.lastInsert, null)
})

test('recordChatAction maps insert error to operation_failed', async () => {
  const db = new MockDb()
  db.goals = [{ id: 'g1', title: 'a', status: 'active' }]
  db.responses.insert = { data: null, error: { message: 'boom' } }
  const res = await recordChatAction(asClient(db), 'u1', {
    title: 'x',
    goalHint: null,
    reason: '',
    today: '2026-07-29'
  })
  assert.equal(res.error, 'operation_failed')
})

test('completeChatAction updates completed scoped to user and returns ok', async () => {
  const db = new MockDb()
  const res = await completeChatAction(asClient(db), 'u1', 'act1')
  assert.equal(res.ok, true)
  assert.deepEqual(db.lastUpdate?.payload, { completed: true })
  assert.deepEqual(db.lastUpdate?.filters, [
    ['id', 'act1'],
    ['user_id', 'u1']
  ])
})

test('completeChatAction rejects empty actionId', async () => {
  const db = new MockDb()
  const res = await completeChatAction(asClient(db), 'u1', '')
  assert.equal(res.error, 'missing_fields')
  assert.equal(db.lastUpdate, null)
})

test('completeChatAction maps update error to operation_failed', async () => {
  const db = new MockDb()
  db.responses.update = { error: { message: 'boom' } }
  const res = await completeChatAction(asClient(db), 'u1', 'act1')
  assert.equal(res.error, 'operation_failed')
})
