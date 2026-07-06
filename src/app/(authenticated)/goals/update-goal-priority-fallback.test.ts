import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

test('updateGoal fallback update includes priority and category fields', async () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const actionsPath = join(here, 'actions.ts')
  const source = await readFile(actionsPath, 'utf8')

  const start = source.indexOf('export async function updateGoal')
  assert.ok(start >= 0)
  const end = source.indexOf('export async function updateAction', start)
  assert.ok(end > start)
  const segment = source.slice(start, end)

  const fallbackUpdateMatch = segment.match(
    /\.update\(\{([\s\S]*?)\}\)\s*\.eq\('id', id\)\s*\.eq\('user_id', user\.id\)/
  )
  assert.ok(fallbackUpdateMatch)

  const updatePayload = fallbackUpdateMatch[1]
  assert.ok(updatePayload.includes('priority'))
  assert.ok(updatePayload.includes('category'))
})
