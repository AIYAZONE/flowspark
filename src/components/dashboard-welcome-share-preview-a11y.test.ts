import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('分享图全屏预览弹窗包含 DialogTitle，避免 Radix 可访问性报错', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/DashboardWelcome.tsx'), 'utf8')

  assert.match(
    source,
    /<Dialog open=\{sharePreviewFullscreenOpen\}[\s\S]*?<DialogTitle[\s\S]*?\{dict\.sharePreviewFullscreen\}[\s\S]*?<\/DialogTitle>/,
  )
})
