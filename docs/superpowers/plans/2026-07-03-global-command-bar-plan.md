# 全局 Command Bar（推进控制台）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在登录态全站加入“底部常驻单行输入 + 自下向上抽屉”的全局控制台，让用户一句话触发推进类草案，确认后写入系统，并提供续写式仪式感提示。

**Architecture:** 在 [authenticated layout.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/layout.tsx#L41-L64) 全局挂载 `GlobalCommandBar`（client）。输入提交后调用 `/api/command/draft`（route handler）生成结构化草案 + 3 个路径候选；用户确认后由客户端调用既有 server actions（例如 [createAction](file:///Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/goals/actions.ts#L626-L628)）完成写入与 revalidate。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Tailwind CSS v4、Radix UI（[sheet.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/components/ui/sheet.tsx)）、Supabase（[createClient](file:///Users/ht-2502/Documents/mycode/flowspark/src/lib/supabase/server.ts)）、Node test runner（`node --test`）。

---

## 产品决策（已确认）

- 入口：全局底部常驻单行输入
- 展开：自下向上抽屉（Sheet bottom）
- 写入：先出草案，再确认写入
- 第一版范围：仅“推进类”
- 回执：自然语言一句 + 结构化变更清单
- 路径缺失：先问一句确认，并给 3 个候选路径（主线 + 最近活跃 + 文本相似）
- 多意图：只处理第一意图，第二意图作为“未处理跟进项”进入续写提示优先级 1
- 仪式感：默认显示“续写提示”，优先级：未处理跟进项 > 最近一次已落地推进对象 > 最近一次输入原句

## 现状锚点（便于落点）

- 全局登录态挂载点：[(authenticated)/layout.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/layout.tsx#L41-L64)
- 现有全局浮层：`QuickCaptureSpeedDial`、`DesktopQuickAccess`、`{modal}`
- 抽屉组件封装： [sheet.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/components/ui/sheet.tsx#L1-L161)
- 核心行动创建参考： [SetCoreActionSheet.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/components/SetCoreActionSheet.tsx#L112-L224)
- 行动创建 server action： [goals/actions.ts#createActionAndReturnId](file:///Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/goals/actions.ts#L544-L623)
- 行动完成/切换 server action： [dashboard/actions.ts#toggleActionWithReward](file:///Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/dashboard/actions.ts#L318-L324)
- 主线路径（primary path）排序口径： [path-context.ts](file:///Users/ht-2502/Documents/mycode/flowspark/src/lib/path-context.ts#L24-L39)

---

### Task 1：定义“推进控制台”的数据模型 + 解析规则（纯函数，可测试）

**Files:**
- Create: `src/lib/command-bar/types.ts`
- Create: `src/lib/command-bar/parse.ts`
- Test: `src/lib/command-bar/parse.test.ts`

- [ ] **Step 1: 新增 `types.ts`**

```ts
export type CommandLocale = 'zh' | 'en'

export type CommandIntentKind =
  | 'set_today_core'
  | 'push_next_step'
  | 'complete_action'
  | 'unknown'

export type ParsedUserCommand = {
  rawText: string
  firstIntentText: string
  followupText: string | null
  kind: CommandIntentKind
  mentionsCore: boolean
  isMultiIntent: boolean
}

export type DraftGoalCandidate = {
  id: string
  title: string
  reason: 'main_path' | 'recent_active' | 'text_match'
}

export type CommandDraft = {
  rawText: string
  firstIntentText: string
  followupText: string | null
  kind: CommandIntentKind
  needsGoalConfirmation: boolean
  goalCandidates: DraftGoalCandidate[]
  suggestedActionTitle: string | null
  suggestedGoalId: string | null
  naturalReply: string
  changes: Array<{
    label: string
    value: string
    status: 'draft' | 'executed'
  }>
}
```

- [ ] **Step 2: 新增 `parse.ts`（第一版规则：可解释、可迭代）**

```ts
import type { ParsedUserCommand } from './types'

function splitFirstIntent(rawText: string) {
  const text = rawText.trim()
  if (!text) return { first: '', rest: null }

  const separators = ['，', ',', '；', ';', '。', '.', '然后', '顺便', '另外']
  for (const sep of separators) {
    const idx = text.indexOf(sep)
    if (idx > 0 && idx < text.length - 1) {
      const first = text.slice(0, idx).trim()
      const rest = text.slice(idx + sep.length).trim()
      if (first) return { first, rest: rest || null }
    }
  }
  return { first: text, rest: null }
}

function includesAny(text: string, words: string[]) {
  const t = text.toLowerCase()
  return words.some((w) => t.includes(w))
}

export function parseUserCommand(rawText: string): ParsedUserCommand {
  const { first, rest } = splitFirstIntent(rawText)
  const mentionsCore = includesAny(first, ['核心', 'main thread', 'core'])

  const kind =
    includesAny(first, ['完成', '做完', '搞定', 'done', 'finished'])
      ? 'complete_action'
      : mentionsCore
        ? 'set_today_core'
        : includesAny(first, ['推进', '往前', '下一步', 'push'])
          ? 'push_next_step'
          : 'unknown'

  return {
    rawText,
    firstIntentText: first,
    followupText: rest,
    kind,
    mentionsCore,
    isMultiIntent: Boolean(rest),
  }
}
```

- [ ] **Step 3: 新增单测 `parse.test.ts`**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'

import { parseUserCommand } from './parse'

test('parseUserCommand detects multi-intent and keeps first intent', () => {
  assert.deepEqual(parseUserCommand('今天推进英语，顺便把简历也安排一下'), {
    rawText: '今天推进英语，顺便把简历也安排一下',
    firstIntentText: '今天推进英语',
    followupText: '把简历也安排一下',
    kind: 'push_next_step',
    mentionsCore: false,
    isMultiIntent: true,
  })
})

test('parseUserCommand detects core intent', () => {
  const parsed = parseUserCommand('今天核心是把简历改完')
  assert.equal(parsed.kind, 'set_today_core')
  assert.equal(parsed.mentionsCore, true)
})

test('parseUserCommand detects completion intent', () => {
  const parsed = parseUserCommand('我把跟读做完了')
  assert.equal(parsed.kind, 'complete_action')
})
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
node --test src/lib/command-bar/parse.test.ts
```

Expected: PASS

---

### Task 2：候选路径 Top-3 选择逻辑（主线 + 最近活跃 + 文本相似）

**Files:**
- Create: `src/lib/command-bar/candidates.ts`
- Test: `src/lib/command-bar/candidates.test.ts`

- [ ] **Step 1: 新增 `candidates.ts`（纯函数部分可独立测试）**

```ts
import type { DraftGoalCandidate } from './types'

export type GoalLite = { id: string; title: string }

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function pickTopGoalCandidates(params: {
  mainPath: GoalLite | null
  recentActive: GoalLite[]
  allGoals: GoalLite[]
  queryText: string
}): DraftGoalCandidate[] {
  const { mainPath, recentActive, allGoals, queryText } = params
  const picked: DraftGoalCandidate[] = []
  const seen = new Set<string>()

  if (mainPath) {
    picked.push({ id: mainPath.id, title: mainPath.title, reason: 'main_path' })
    seen.add(mainPath.id)
  }

  for (const g of recentActive) {
    if (picked.length >= 2) break
    if (seen.has(g.id)) continue
    picked.push({ id: g.id, title: g.title, reason: 'recent_active' })
    seen.add(g.id)
  }

  const q = normalize(queryText)
  if (q) {
    const matched = allGoals
      .map((g) => ({ goal: g, score: normalize(g.title).includes(q) ? 2 : 0 }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.goal.title.localeCompare(b.goal.title))
      .map((row) => row.goal)

    for (const g of matched) {
      if (picked.length >= 3) break
      if (seen.has(g.id)) continue
      picked.push({ id: g.id, title: g.title, reason: 'text_match' })
      seen.add(g.id)
    }
  }

  for (const g of allGoals) {
    if (picked.length >= 3) break
    if (seen.has(g.id)) continue
    picked.push({ id: g.id, title: g.title, reason: 'recent_active' })
    seen.add(g.id)
  }

  return picked.slice(0, 3)
}
```

- [ ] **Step 2: 新增单测 `candidates.test.ts`**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'

import { pickTopGoalCandidates } from './candidates'

test('pickTopGoalCandidates returns main path first, then recent, then match', () => {
  const result = pickTopGoalCandidates({
    mainPath: { id: 'g1', title: '英语口语' },
    recentActive: [{ id: 'g2', title: '面试准备' }],
    allGoals: [
      { id: 'g1', title: '英语口语' },
      { id: 'g2', title: '面试准备' },
      { id: 'g3', title: '个人品牌' },
    ],
    queryText: '英语',
  })
  assert.deepEqual(result.map((x) => x.id), ['g1', 'g2', 'g3'])
})
```

- [ ] **Step 3: 运行测试确认通过**

Run:

```bash
node --test src/lib/command-bar/candidates.test.ts
```

Expected: PASS

---

### Task 3：新增草案生成 API（/api/command/draft）

**Files:**
- Create: `src/app/api/command/draft/route.ts`
- Modify: `src/app/api/ai/today-plan/route.ts`（不改逻辑，仅作为风格对照，计划不动）

- [ ] **Step 1: 新增 `route.ts`（鉴权 + 拉取 goals/actions + 生成草案）**

实现要点（强约束）：
- 必须鉴权：无 user 返回 401
- 输入必须是 `{ text, locale }`
- 第一版只处理“第一意图”：调用 `parseUserCommand(text)` 得到 `firstIntentText` 与 `followupText`
- `needsGoalConfirmation`：当草案需要 `goal_id` 且无法从文本明确匹配时为 true
- 候选 goals：调用 `pickTopGoalCandidates` 组装 3 个候选
- 返回 `naturalReply + changes[]`（draft 状态）

建议代码骨架（可直接落地）：

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseUserCommand } from '@/lib/command-bar/parse'
import { pickTopGoalCandidates } from '@/lib/command-bar/candidates'
import type { CommandDraft } from '@/lib/command-bar/types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  const input = body as Record<string, unknown>
  const text = typeof input.text === 'string' ? input.text : ''
  const locale = input.locale === 'zh' ? 'zh' : 'en'
  if (!text.trim()) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const parsed = parseUserCommand(text)

  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('id,title,priority,start_date,end_date,status')
    .eq('user_id', user.id)
    .eq('status', 'active')
  if (goalsError) return NextResponse.json({ error: 'operation_failed' }, { status: 502 })

  const goalLite = (goals || []).map(g => ({ id: g.id as string, title: g.title as string }))
  const mainPath = goalLite[0] ? goalLite[0] : null

  const candidates = pickTopGoalCandidates({
    mainPath,
    recentActive: goalLite.slice(0, 2),
    allGoals: goalLite,
    queryText: parsed.firstIntentText,
  })

  const draft: CommandDraft = {
    rawText: parsed.rawText,
    firstIntentText: parsed.firstIntentText,
    followupText: parsed.followupText,
    kind: parsed.kind,
    needsGoalConfirmation: parsed.kind !== 'unknown',
    goalCandidates: candidates,
    suggestedActionTitle: parsed.kind === 'set_today_core' || parsed.kind === 'push_next_step'
      ? parsed.firstIntentText.replace(/^今天(核心)?(是|要)?/,'').trim() || '推进一步'
      : null,
    suggestedGoalId: candidates[0]?.id ?? null,
    naturalReply: parsed.kind === 'unknown'
      ? (locale === 'zh' ? '我能给建议，但这条输入还不足以写入系统。' : 'I can help, but this input is not ready to write into the system.')
      : (locale === 'zh' ? '我需要你确认一下归属路径。' : 'I need you to confirm which path this belongs to.'),
    changes: [
      { label: locale === 'zh' ? '识别意图' : 'Intent', value: parsed.kind, status: 'draft' },
    ],
  }

  return NextResponse.json(draft, { status: 200 })
}
```

- [ ] **Step 2: 手动验证接口**

Run dev server 后测试：

```bash
curl -s -X POST http://localhost:3002/api/command/draft \
  -H 'content-type: application/json' \
  -d '{"text":"今天推进英语，顺便把简历也安排一下","locale":"zh"}' | head
```

Expected: 200 JSON，包含 `followupText`、`goalCandidates`（最多 3 个）

---

### Task 4：实现全局 UI 组件（底部单行 + 抽屉草案 + 确认写入）

**Files:**
- Create: `src/components/GlobalCommandBar.tsx`
- Modify: `src/app/(authenticated)/layout.tsx`

- [ ] **Step 1: 新增 `GlobalCommandBar.tsx`**

交互细节（必须实现）：
- 常驻底部输入条（glass 表面；不挡 MobileNavBar 与 Quick actions）
- Enter 提交生成草案；提交后打开 bottom sheet
- 草案区块结构固定：输入原句 / 系统理解 / 变更草案 / 确认&修正
- 路径缺失时：展示 3 个候选 pills；点选后才允许“确认执行”
- 多意图：若 `followupText` 存在，保存为“未处理跟进项”，供续写提示优先级 1 使用
- 回执：自然句 + executed 状态变更清单（执行成功后把 changes 标记为 executed）

写入动作（第一版推进类最小闭环）：
- `set_today_core`：用 `createAction(formData)` 新建 `type=core` 且日期为今天（start/end 同日）
- `push_next_step`：同样创建 `type=core`（第一版简化：推进即落到今天核心行动，但默认不自动“设为核心”，除非用户显式说核心）
- `complete_action`：第一版可以仅回退提示“请在行动列表中完成”（如果要做，后续 Task 再接 `toggleActionWithReward`）

UI 骨架建议（可直接落地，省略样式细节由实现时按主题对齐）：

```tsx
'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { createAction } from '@/app/(authenticated)/goals/actions'
import type { CommandDraft } from '@/lib/command-bar/types'

const LS_LAST_INPUT = 'commandbar:last_input:v1'
const LS_FOLLOWUP = 'commandbar:followup:v1'

export function GlobalCommandBar() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [draft, setDraft] = useState<CommandDraft | null>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const followup = window.localStorage.getItem(LS_FOLLOWUP)
    const last = window.localStorage.getItem(LS_LAST_INPUT)
    setHint(followup || last || null)
  }, [])

  async function requestDraft(raw: string) {
    const res = await fetch('/api/command/draft', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: raw, locale: 'zh' }),
    })
    if (!res.ok) throw new Error('draft_failed')
    const next = (await res.json()) as CommandDraft
    setDraft(next)
    setSelectedGoalId(next.suggestedGoalId)
    setOpen(true)
    if (next.followupText) window.localStorage.setItem(LS_FOLLOWUP, next.followupText)
    window.localStorage.setItem(LS_LAST_INPUT, next.firstIntentText)
  }

  function onSubmit() {
    const raw = text.trim()
    if (!raw) return
    setText('')
    startTransition(() => { requestDraft(raw) })
  }

  function canCommit() {
    if (!draft) return false
    if (draft.kind === 'unknown') return false
    return Boolean(selectedGoalId)
  }

  async function commit() {
    if (!draft || !selectedGoalId) return
    if (!draft.suggestedActionTitle) return

    const fd = new FormData()
    fd.set('goal_id', selectedGoalId)
    fd.set('title', draft.suggestedActionTitle)
    fd.set('type', draft.kind === 'set_today_core' ? 'core' : 'core')
    fd.set('priority', 'medium')
    fd.set('description', '')
    fd.set('repeat_rule', 'none')
    const today = new Date().toISOString().slice(0, 10)
    fd.set('start_date', today)
    fd.set('end_date', today)

    await createAction(fd)
    setDraft((prev) => prev ? ({
      ...prev,
      naturalReply: '已更新你的系统。',
      changes: prev.changes.map((c) => ({ ...c, status: 'executed' })),
    }) : prev)
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-border/60 bg-background/85 px-3 py-2 shadow-lg backdrop-blur">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={hint ? `继续：${hint}` : '告诉系统你要推进什么…'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSubmit()
              }
            }}
            className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button type="button" onClick={onSubmit} disabled={pending}>
            {pending ? <LoadingSpinner /> : '发送'}
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="p-0">
          <div className="px-5 pb-6 pt-5">
            {draft ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">{draft.firstIntentText}</div>
                <div className="text-base font-medium">{draft.naturalReply}</div>

                <div className="flex flex-wrap gap-2">
                  {draft.goalCandidates.map((g) => (
                    <Button
                      key={g.id}
                      type="button"
                      variant={selectedGoalId === g.id ? 'default' : 'outline'}
                      className="rounded-full"
                      onClick={() => setSelectedGoalId(g.id)}
                    >
                      {g.title}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  {draft.changes.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm">
                      <div className="text-muted-foreground">{c.label}</div>
                      <div className="font-medium">{c.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => startTransition(() => { commit() })} disabled={!canCommit() || pending}>
                    确认执行
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setOpen(false) }}>
                    先不管
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 2: 在 authenticated layout 全局挂载**

在 [src/app/(authenticated)/layout.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/layout.tsx#L41-L64) 中：
- 引入并渲染 `<GlobalCommandBar />`
- 放置在 `DesktopQuickAccess` 附近（同一层级的“全局浮层区”），确保 z-index 与 `Sheet` overlay 不冲突

- [ ] **Step 3: 手动回归**

- 任意页面底部都应出现输入条
- 输入后抽屉弹起，能看到 3 个候选路径 pills
- 选中路径后点击“确认执行”，/today 应出现一个新建 core action（与 [SetCoreActionSheet](file:///Users/ht-2502/Documents/mycode/flowspark/src/components/SetCoreActionSheet.tsx#L112-L224) 创建效果一致）

---

### Task 5：续写提示（仪式感）完善：跟进项优先 + 最近推进对象 + 原句

**Files:**
- Modify: `src/components/GlobalCommandBar.tsx`

- [ ] **Step 1: 落地优先级规则**

实现细节：
- 优先级 1：若 `LS_FOLLOWUP` 存在（上次多意图未处理项），placeholder 显示 `继续上次未处理：${followup}`
- 优先级 2：最近一次“已落地”的推进对象：保存 `{ goalTitle, actionTitle }` 到 localStorage，placeholder 显示 `继续推进：${goalTitle}（上次是 ${actionTitle}）？`
- 优先级 3：最近一次输入原句：`继续：${last}`

- [ ] **Step 2: 手动验证**

- 提交多意图后刷新，placeholder 应优先显示未处理项
- 未处理项被再次提交后，应清理 `LS_FOLLOWUP`（避免死循环）

---

## 验收标准（Acceptance Criteria）

- 全站（登录态）底部都有单行入口，不需要切页面即可发起推进
- 提交后抽屉展示草案：原句 / 系统理解 / 变更清单 / 确认按钮
- 路径不明确时必须先确认，且只给 3 个候选（pills，不是下拉）
- 多意图只处理第一意图；第二意图进入续写提示优先级 1
- 确认后能写入一条 core action，并且 /today 与相关 goal 页面刷新后能看到
- 默认提示为“续写提示”，且不抢输入焦点（用户一输入就消失）

## 验证命令（工程侧）

- 单测：

```bash
node --test src/lib/command-bar/parse.test.ts
node --test src/lib/command-bar/candidates.test.ts
```

- 静态检查：

```bash
npm run lint
```

