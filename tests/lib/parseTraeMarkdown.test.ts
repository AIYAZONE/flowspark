import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseMarkdownFile,
  parseMarkdownMap,
  TRAE_SOURCE,
} from '../../src/lib/parseTraeMarkdown.ts'

const SAMPLE = `# 第一条视频脚本（最终版）

> ⚠️ 本文档已废弃，内容已合并到其它文档
> 钩子：来学传统文化自媒体IP的第一天，我就卡住了
> 状态：已废弃

---

## 脚本

正文内容...
`

test('parseMarkdownFile: 取一级标题为 title，父目录为 angle，钩子/状态解析', () => {
  const d = parseMarkdownFile('02-脚本规划/12-第一条视频脚本（最终版）.md', SAMPLE)
  assert.ok(d)
  assert.equal(d.title, '第一条视频脚本（最终版）')
  assert.equal(d.angle, '02-脚本规划')
  assert.equal(d.hook, '来学传统文化自媒体IP的第一天，我就卡住了')
  assert.equal(d.status, 'archived') // 含"废弃" -> archived
  assert.equal(d.source, TRAE_SOURCE)
  assert.equal(d.rawMarkdown, SAMPLE) // 全文保留
  assert.equal(d.notes, '来学传统文化自媒体IP的第一天，我就卡住了') // 钩子作为摘要
})

test('parseMarkdownFile: 无一级标题时回退文件名', () => {
  const d = parseMarkdownFile('01-总纲/笔记.md', '只是一些正文，没有标题')
  assert.ok(d)
  assert.equal(d.title, '笔记')
  assert.equal(d.angle, '01-总纲')
})

test('parseMarkdownFile: 隐藏目录被跳过（由 parseMarkdownMap 负责）', () => {
  const d = parseMarkdownFile('.uploads/abc.md', '# 图片说明')
  assert.ok(d) // 单文件解析不判断隐藏，隐藏在 map 层过滤
  assert.equal(d.angle, null)
})

test('parseMarkdownMap: 跳过隐藏目录与非 md 文件', () => {
  const map: Record<string, string> = {
    '02-脚本规划/a.md': '# A',
    '.uploads/img.png': 'binary',
    '.trae-html-share-packages/x.html': '<html>',
    '01-总纲/b.md': '# B',
  }
  const drafts = parseMarkdownMap(map)
  assert.equal(drafts.length, 2)
  assert.deepEqual(
    drafts.map((d) => d.title).sort(),
    ['A', 'B'],
  )
})

test('parseMarkdownMap: 已发布状态识别', () => {
  const map = {
    '03-数据分析/r.md': '# 报告\n\n> 状态：已发布\n\n内容',
  }
  const drafts = parseMarkdownMap(map)
  assert.equal(drafts[0].status, 'published')
})
