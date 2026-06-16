import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('分享图弹窗：PC 端不应额外注入 md:p-6 留白', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/DashboardWelcome.tsx'), 'utf8')
  assert.match(source, /<DialogFormContent[\s\S]*?md:p-0/)
})

test('分享图全屏预览：标题栏为 absolute 悬浮层，不影响图片整屏居中', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/DashboardWelcome.tsx'), 'utf8')
  assert.match(source, /open=\{sharePreviewFullscreenOpen\}[\s\S]*?absolute[\s\S]*?inset-x-0[\s\S]*?top-0/)
})

test('分享图全屏预览：PC 端应限制最大宽高，确保居中且能看全貌', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/DashboardWelcome.tsx'), 'utf8')
  assert.match(source, /md:max-h-\[82vh\][\s\S]*?md:max-w-\[360px\]/)
})
