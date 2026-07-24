# System Conversation Task4 Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 5 个 UI 组件用于渲染系统对话 turns：默认仅展示最后 1 条，可通过 Toggle 展开至最多 3 条；SystemMessage 渲染 tag + judgement/reason/nextStep 与最多 1 个主按钮（link/confirm/focusInput）。

**Architecture:** `SystemConversation` 从 `useSystemConversation()` 读取 `turnsVisible` 并负责折叠窗口；`SystemTurn` 负责结构编排；`SystemUserMessage` 与 `SystemMessage` 分别渲染用户与系统侧气泡；`SystemConversationToggle` 提供最简单的展开/收起按钮。所有组件均为 client component，避免 Server/Client 边界导致的事件处理限制。

**Tech Stack:** Next.js App Router, React + TypeScript, Tailwind, shadcn/ui Button

---

## File Map（锁边界）

**Create**
- `src/components/SystemConversation.tsx`
- `src/components/SystemConversationToggle.tsx`
- `src/components/SystemTurn.tsx`
- `src/components/SystemUserMessage.tsx`
- `src/components/SystemMessage.tsx`

---

### Task 1: 新增 Toggle（展开/收起）

**Files:**
- Create: `src/components/SystemConversationToggle.tsx`

- [ ] **Step 1: 实现 Toggle 组件**

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function SystemConversationToggle(props: {
  expanded: boolean
  onExpandedChange: (next: boolean) => void
  totalCount: number
  collapsedCount?: number
  expandedCount?: number
}) {
  const collapsedCount = props.collapsedCount ?? 1
  const expandedCount = props.expandedCount ?? 3
  const visibleCount = props.expanded ? Math.min(expandedCount, props.totalCount) : Math.min(collapsedCount, props.totalCount)
  const label = props.expanded ? '收起' : `展开最近 ${Math.min(expandedCount, props.totalCount)} 条`

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => props.onExpandedChange(!props.expanded)}
      aria-expanded={props.expanded}
    >
      {props.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      <span>{label}</span>
      <span className="text-[11px] text-muted-foreground/80">{visibleCount}/{props.totalCount}</span>
    </Button>
  )
}
```

---

### Task 2: 新增 Message（系统侧渲染 + 主按钮）

**Files:**
- Create: `src/components/SystemMessage.tsx`

- [ ] **Step 1: 实现 SystemMessage（tag + 三段文本 + 0/1 主按钮）**

```tsx
'use client'

import Link from 'next/link'
import type { SystemTurn } from '@/lib/system-conversation/types'
import { Button } from '@/components/ui/button'

export function SystemMessage(props: {
  turn: SystemTurn
  onConfirm?: (draftId: string) => void
  onFocusInput?: (prefill?: string) => void
}) {
  const action = props.turn.primaryAction
  const actionNode =
    action?.kind === 'link' ? (
      <Button asChild size="sm" className="h-9 rounded-full">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    ) : action?.kind === 'confirm' ? (
      <Button
        type="button"
        size="sm"
        className="h-9 rounded-full"
        onClick={() => props.onConfirm?.(action.draftId)}
        disabled={!props.onConfirm}
      >
        {action.label}
      </Button>
    ) : action?.kind === 'focusInput' ? (
      <Button
        type="button"
        size="sm"
        className="h-9 rounded-full"
        onClick={() => props.onFocusInput?.(action.prefill)}
        disabled={!props.onFocusInput}
      >
        {action.label}
      </Button>
    ) : null

  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          {props.turn.tag}
        </div>
        {actionNode}
      </div>
      <div className="mt-3 space-y-3">
        <div className="text-sm font-semibold leading-6 tracking-tight text-foreground">{props.turn.judgement}</div>
        {props.turn.reason ? (
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">原因</div>
            <div className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{props.turn.reason}</div>
          </div>
        ) : null}
        {props.turn.nextStep ? (
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">下一步</div>
            <div className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{props.turn.nextStep}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
```

---

### Task 3: 新增 UserMessage + Turn（结构编排）

**Files:**
- Create: `src/components/SystemUserMessage.tsx`
- Create: `src/components/SystemTurn.tsx`

- [ ] **Step 1: 实现 SystemUserMessage（用户气泡）**

```tsx
'use client'

export function SystemUserMessage(props: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[44rem] rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm leading-6 text-foreground shadow-sm">
        {props.text}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 实现 SystemTurn（UserMessage + SystemMessage）**

```tsx
'use client'

import type { SystemTurn as SystemTurnType } from '@/lib/system-conversation/types'
import { SystemUserMessage } from '@/components/SystemUserMessage'
import { SystemMessage } from '@/components/SystemMessage'

export function SystemTurn(props: {
  turn: SystemTurnType
  onConfirm?: (draftId: string) => void
  onFocusInput?: (prefill?: string) => void
}) {
  return (
    <div className="space-y-2">
      <SystemUserMessage text={props.turn.userText} />
      <SystemMessage turn={props.turn} onConfirm={props.onConfirm} onFocusInput={props.onFocusInput} />
    </div>
  )
}
```

---

### Task 4: 新增 Conversation（读取 turnsVisible + 折叠规则）

**Files:**
- Create: `src/components/SystemConversation.tsx`

- [ ] **Step 1: 实现 SystemConversation（默认 1 条、展开 3 条）**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useSystemConversation } from '@/lib/system-conversation/store'
import { SystemTurn } from '@/components/SystemTurn'
import { SystemConversationToggle } from '@/components/SystemConversationToggle'

export function SystemConversation(props: {
  className?: string
  onConfirm?: (draftId: string) => void
  onFocusInput?: (prefill?: string) => void
}) {
  const { turnsVisible } = useSystemConversation()
  const [expanded, setExpanded] = useState(false)

  const collapsedCount = 1
  const expandedCount = 3

  const turns = useMemo(() => {
    const count = expanded ? expandedCount : collapsedCount
    return turnsVisible.slice(-count)
  }, [expanded, turnsVisible])

  if (!turnsVisible.length) return null

  return (
    <div
      className={[
        'rounded-3xl border border-primary/12 bg-linear-to-br from-primary/5 via-background to-background p-4 shadow-sm',
        props.className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="space-y-4">
        {turns.map((turn) => (
          <SystemTurn key={turn.id} turn={turn} onConfirm={props.onConfirm} onFocusInput={props.onFocusInput} />
        ))}
      </div>
      {turnsVisible.length > collapsedCount ? (
        <div className="mt-4 flex justify-end">
          <SystemConversationToggle
            expanded={expanded}
            onExpandedChange={setExpanded}
            totalCount={turnsVisible.length}
            collapsedCount={collapsedCount}
            expandedCount={expandedCount}
          />
        </div>
      ) : null}
    </div>
  )
}
```

---

### Task 5: 验证与最小检查

**Run**
- [ ] `npm run lint -- src/components/SystemConversation.tsx src/components/SystemConversationToggle.tsx src/components/SystemTurn.tsx src/components/SystemMessage.tsx src/components/SystemUserMessage.tsx`
- [ ] `npx tsc -p tsconfig.json --noEmit`

