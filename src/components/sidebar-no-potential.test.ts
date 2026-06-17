import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

test('侧边栏一级菜单不应包含 /potential', async () => {
	const filePath = resolve(process.cwd(), 'src/components/Sidebar.tsx')
	const content = await readFile(filePath, 'utf8')
	assert.equal(content.includes("href: '/potential'"), false)
})

