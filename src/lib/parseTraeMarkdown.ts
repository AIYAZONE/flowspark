// 解析 Trae Work 导出的 zip / 目录中的 .md 文件为选题草稿。
// 规则：
//  - 一个 .md 文件 = 一条选题草稿
//  - 一级标题 # ... -> title
//  - 文件所在（非隐藏）目录名 -> angle（角度/分类）
//  - 文件开头的 ">" 引用块里的元信息（钩子 / 状态）-> hook / status
//  - 全文 -> notes
// 隐藏目录（. 开头，如 .uploads / .trae-html-share-packages）整体跳过。

import JSZip from 'jszip'

export interface ParsedIdeaDraft {
  title: string
  angle: string | null
  hook: string | null
  notes: string
  rawMarkdown: string
  status: 'idea' | 'approved' | 'produced' | 'published' | 'archived'
  source: string
}

export const TRAE_SOURCE = 'Trae Work / 王洪兴读经典'

function guessStatus(text: string): ParsedIdeaDraft['status'] {
  if (/废弃|弃用|作废|已合并/.test(text)) return 'archived'
  if (/已发|发布|已发布/.test(text)) return 'published'
  if (/已拍|已制作|制作中|剪辑中/.test(text)) return 'produced'
  if (/已定|确认|通过|已审批/.test(text)) return 'approved'
  return 'idea'
}

// 从 md 全文生成一句话摘要（用于卡片快速浏览），保留可读性，最长约 80 字。
function buildSummary(content: string): string {
  // 优先用 frontmatter 引用块里的"钩子"作为摘要
  const quoteBlock = content.match(/^>[\s\S]*?(?=\n\n|\n#|\n---)/m)
  if (quoteBlock) {
    const h = quoteBlock[0].match(/钩子[：:]\s*(.+)/)
    if (h) return h[1].trim().slice(0, 80)
  }
  // 否则取第一个非空非标题行
  const line = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('---'))
  return (line ?? '').slice(0, 80)
}

// 从单个 md 文本解析
export function parseMarkdownFile(
  filePath: string,
  content: string,
): ParsedIdeaDraft | null {
  if (!content.trim()) return null
  const segments = filePath.split('/').filter(Boolean)
  // 去掉文件名，找第一个非隐藏目录作为 angle
  const dirs = segments.slice(0, -1)
  const angle = dirs.find((d) => !d.startsWith('.')) ?? null

  const topMatch = content.match(/^#\s+(.+)$/m)
  const fallbackName = segments[segments.length - 1]?.replace(/\.md$/i, '') ?? '未命名'
  const title = topMatch ? topMatch[1].trim() : fallbackName

  const quoteBlock = content.match(/^>[\s\S]*?(?=\n\n|\n#|\n---)/m)
  let hook: string | null = null
  let statusText = ''
  if (quoteBlock) {
    const h = quoteBlock[0].match(/钩子[：:]\s*(.+)/)
    if (h) hook = h[1].trim()
    const s = quoteBlock[0].match(/状态[：:]\s*(.+)/)
    if (s) statusText = s[1].trim()
  }

  return {
    title,
    angle,
    hook,
    notes: buildSummary(content),
    rawMarkdown: content,
    status: guessStatus(statusText + '\n' + content.slice(0, 200)),
    source: TRAE_SOURCE,
  }
}

function isHidden(path: string): boolean {
  return path.split('/').some((seg) => seg.startsWith('.'))
}

// 从已解压的文件列表（path -> content）解析
export function parseMarkdownMap(
  files: Record<string, string>,
): ParsedIdeaDraft[] {
  const drafts: ParsedIdeaDraft[] = []
  for (const [path, content] of Object.entries(files)) {
    if (isHidden(path)) continue
    if (!path.toLowerCase().endsWith('.md')) continue
    const d = parseMarkdownFile(path, content)
    if (d) drafts.push(d)
  }
  return drafts
}

// 从 zip 二进制（浏览器 File）解析
export async function parseTraeZip(file: File): Promise<ParsedIdeaDraft[]> {
  const zip = await JSZip.loadAsync(file)
  const map: Record<string, string> = {}
  await Promise.all(
    Object.keys(zip.files).map(async (name) => {
      const entry = zip.files[name]
      if (entry.dir) return
      if (isHidden(name)) return
      if (!name.toLowerCase().endsWith('.md')) return
      map[name] = await entry.async('string')
    }),
  )
  return parseMarkdownMap(map)
}
