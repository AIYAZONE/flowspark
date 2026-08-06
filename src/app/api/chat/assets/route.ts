import type { NextRequest } from 'next/server'
import { callAIChatJSON } from '@/lib/ai/client'
import type { ChatHistoryEntry } from '@/lib/chat/types'
import { upsertContentAssets } from '@/lib/contentAsset'
import type { ContentAssetKind } from '@/lib/contentAsset'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// AI 从对话中提取「内容资产」。一条对话可能沉淀 0~N 条资产，
// 每条资产由 AI 自主判断类型与挂载路径（path 数组，从根到叶），
// 后端自动逐层建目录树，用户零操作。

const EXTRACTION_SYSTEM_PROMPT = `你是 FlowSpark 的「内容资产提取器」。给定一个用户与系统内核的对话，判断这次对话产出了哪些值得沉淀的「内容资产」，并把它们归类到合适的目录路径下。

只输出 JSON，不要任何解释。格式：
{
  "assets": [
    {
      "kind": "idea" | "script" | "note" | "data" | "strategy" | "tool" | "other",
      "title": string,
      "summary": string | null,
      "body_markdown": string | null,
      "path": string[]
    }
  ]
}

规则：
- kind：资产类型。idea=选题/灵感；script=脚本/文案；note=课程/读书笔记；data=数据分析/指标；strategy=战略/定位/总纲；tool=辅助工具/模板；other=其他。
- title：资产标题（中文，简洁，3-20 字）。
- summary：一句话摘要（用于卡片快速浏览，可为 null）。
- body_markdown：资产正文（完整 Markdown，可为 null）。
- path：目录路径名数组，从根到叶，例如 ["01-总纲与战略","视频号定位"]。路径应当语义清晰、可复用，不要随意新建大量平级目录；相似主题归入同一分支。若没有合适分类，可放 ["00-索引"] 或自建合理的顶层目录。
- 不要凭空捏造；只有对话中确实产出了可沉淀资产时才返回，否则 assets 为空数组 []。
- 闲聊、纯问答、没有具体产出时返回 {"assets": []}。`

interface RawAsset {
  kind?: string
  title?: unknown
  summary?: unknown
  body_markdown?: unknown
  path?: unknown
}

const VALID_KINDS: ContentAssetKind[] = [
  'idea',
  'script',
  'note',
  'data',
  'strategy',
  'tool',
  'other',
]

function normalizePath(p: unknown): string[] {
  if (!Array.isArray(p)) return []
  return (p as unknown[])
    .map((seg) => (typeof seg === 'string' ? seg.trim() : ''))
    .filter(Boolean)
    .slice(0, 5)
}

function normalizeKind(k: unknown): ContentAssetKind {
  return VALID_KINDS.includes(k as ContentAssetKind)
    ? (k as ContentAssetKind)
    : 'other'
}

function asStringOrNull(v: unknown): string | null {
  if (typeof v === 'string') {
    const t = v.trim()
    return t || null
  }
  return null
}

export async function POST(req: NextRequest) {
  let parsed: { transcript?: ChatHistoryEntry[]; locale?: string; chatSessionId?: string }
  try {
    parsed = await req.json()
  } catch {
    return Response.json({ assets: [] }, { status: 200 })
  }

  const transcript = Array.isArray(parsed.transcript) ? parsed.transcript.slice(-14) : []
  if (transcript.length === 0) return Response.json({ assets: [] }, { status: 200 })

  const messages = [
    { role: 'system' as const, content: EXTRACTION_SYSTEM_PROMPT },
    ...transcript.map((t) => ({
      role: 'user' as const,
      content: t.role === 'assistant' ? `系统：${t.text}` : `用户：${t.text}`
    })),
    {
      role: 'user' as const,
      content: '判断本次对话沉淀了哪些内容资产，仅输出 JSON。'
    }
  ]

  try {
    const raw = await callAIChatJSON({ messages, temperature: 0.1 })
    let obj: { assets?: unknown }
    try {
      obj = JSON.parse(raw) as { assets?: unknown }
    } catch {
      return Response.json({ assets: [] }, { status: 200 })
    }

    const rawAssets = Array.isArray(obj.assets) ? (obj.assets as RawAsset[]) : []
    const drafts = rawAssets
      .map((a) => ({
        kind: normalizeKind(a.kind),
        title: typeof a.title === 'string' ? a.title.trim() : '',
        summary: asStringOrNull(a.summary),
        body_markdown: asStringOrNull(a.body_markdown),
        path: normalizePath(a.path),
      }))
      .filter((d) => d.title.length > 0)
      .slice(0, 8)

    if (drafts.length === 0) return Response.json({ assets: [] }, { status: 200 })

    const saved = await upsertContentAssets(
      drafts.map((d) => ({
        ...d,
        source: 'chat',
        chat_session_id: parsed.chatSessionId ?? null,
      })),
    )

    return Response.json(
      {
        assets: saved.map((a) => ({
          id: a.id,
          kind: a.kind,
          title: a.title,
          summary: a.summary,
          folder_id: a.folder_id,
        })),
      },
      { status: 200 },
    )
  } catch {
    return Response.json({ assets: [] }, { status: 200 })
  }
}
