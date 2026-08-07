import { NextResponse } from 'next/server'
import { callAIChatJSON } from '@/lib/ai/client'
import { recordPersonaFromChat, type PersonaInput } from '@/lib/persona'
import type { PersonaCategory, PersonaConfidence } from '@/lib/persona-types'
import type { ChatHistoryEntry } from '@/lib/chat/types'

export const runtime = 'nodejs'

const CATEGORIES: PersonaCategory[] = [
  'strength',
  'value',
  'experience',
  'aspiration',
  'aversion',
  'context',
  'reflection',
]

const PROMPT_ZH = `你是一个「个人记忆抽取器」。请从下面的对话中，识别用户**明确表达或强烈暗示**的、关于「用户本人」的持久信号。

只抽取高信度的、对未来仍有价值的信号，例如：
- 优势/擅长（strength）：用户说自己擅长做什么
- 价值观（value）：用户在乎什么、认为什么重要
- 经历（experience）：用户真实发生过的事
- 想成为的人（aspiration）：用户的志向、目标身份
- 抗拒点（aversion）：用户明确不想做/讨厌的事
- 背景上下文（context）：影响决策的稳定外部条件（职业、城市、家庭等）
- 复盘洞察（reflection）：用户对自己状态的反思结论

【严格规则】
1. 只抽取「关于用户本人」的，不要抽工具方法、不要抽临时待办。
2. 若对话里没有明确或强暗示的本人信号，返回空数组 []。宁缺毋滥。
3. 每条给：category（从上述 7 类选一）、title（一句话结论）、detail（可选补充，无则空串）、confidence（low/medium/high）。
4. 最多返回 3 条。

请只输出 JSON，格式：{"items":[{"category":"...","title":"...","detail":"...","confidence":"..."}]}`

const PROMPT_EN = `You are a "personal memory extractor". From the conversation below, identify persistent signals that are explicitly stated or strongly implied about the USER themselves.

Only extract high-confidence, future-relevant signals: strength / value / experience / aspiration / aversion / context / reflection.
Rules:
1. Only signals about the user, not tools or transient todos.
2. If none, return [].
3. Each: category (one of the 7), title, detail (optional), confidence (low/medium/high).
4. At most 3 items.

Output JSON only: {"items":[{"category":"...","title":"...","detail":"...","confidence":"..."}]}`

function buildTranscript(transcript: ChatHistoryEntry[]): string {
  return transcript
    .map((t) => `${t.role === 'user' ? '用户' : '助手'}：${t.text}`)
    .join('\n')
}

export async function POST(req: Request) {
  let parsed: { transcript?: ChatHistoryEntry[]; locale?: string }
  try {
    parsed = await req.json()
  } catch {
    return NextResponse.json({ ok: true, saved: 0, items: [] }, { status: 200 })
  }

  const transcript = Array.isArray(parsed.transcript) ? parsed.transcript : []
  if (transcript.length === 0) {
    return NextResponse.json({ ok: true, saved: 0, items: [] }, { status: 200 })
  }
  const locale: 'zh' | 'en' = parsed.locale === 'en' ? 'en' : 'zh'

  let raw: string
  try {
    raw = await callAIChatJSON({
      messages: [
        { role: 'system', content: locale === 'en' ? PROMPT_EN : PROMPT_ZH },
        { role: 'user', content: buildTranscript(transcript) }
      ],
      temperature: 0.1,
      timeoutMs: 12000
    })
  } catch {
    return NextResponse.json({ ok: true, saved: 0, items: [] }, { status: 200 })
  }

  let parsedJson: { items?: Array<{ category?: string; title?: string; detail?: string; confidence?: string }> }
  try {
    parsedJson = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: true, saved: 0, items: [] }, { status: 200 })
  }

  const items = (parsedJson.items ?? []).filter(
    (it) => it && typeof it.title === 'string' && CATEGORIES.includes(it.category as PersonaCategory)
  )

  let saved = 0
  const savedItems: PersonaInput[] = []
  for (const it of items.slice(0, 3)) {
    const input: PersonaInput = {
      category: it.category as PersonaCategory,
      title: it.title as string,
      detail: typeof it.detail === 'string' && it.detail.trim() ? it.detail.trim() : null,
      confidence: (['low', 'medium', 'high'].includes(it.confidence as string)
        ? it.confidence
        : 'medium') as PersonaConfidence
    }
    const rec = await recordPersonaFromChat(input)
    if (rec) {
      saved += 1
      savedItems.push(input)
    }
  }

  return NextResponse.json({ ok: true, saved, items: savedItems }, { status: 200 })
}
