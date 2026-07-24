import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('system 页面：今日金句直接展示内层卡片，不保留外层 section 标题壳', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/app/(authenticated)/system/page.tsx'), 'utf8')

  assert.match(
    source,
    /<div className="rounded-2xl border border-border\/40 bg-linear-to-br from-primary\/5 via-background\/80 to-background p-4 shadow-sm md:p-5">[\s\S]*?<DashboardWelcome/
  )
  assert.doesNotMatch(
    source,
    /<section className="rounded-3xl border border-border\/50 bg-background\/85 p-5 shadow-sm">[\s\S]*?<DashboardWelcome/
  )
  assert.doesNotMatch(source, /低权重信号，用来稳住节奏。|Low-priority signal to stabilize rhythm\./)
})

test('system 页面：目标进展直接展示，不保留折叠外壳', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/app/(authenticated)/system/page.tsx'), 'utf8')

  assert.match(source, /<GoalProgressList dict=\{dict\} goals=\{goalProgressList\} \/>/)
  assert.doesNotMatch(source, /路径进展（可选）|Path progress \(optional\)/)
  assert.doesNotMatch(source, /只有在你需要回顾时再展开。|Expand only when you need a review\./)
  assert.doesNotMatch(source, /<Collapsible[\s\S]*?<GoalProgressList/)
})
