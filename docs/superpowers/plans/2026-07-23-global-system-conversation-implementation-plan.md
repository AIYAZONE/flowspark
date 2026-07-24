# Global System Conversation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用“全站内联对话流 + 记忆分层（可见 3 轮、工作记忆 20 轮、摘要记忆）”替换现有弹窗式回执，让系统不挂、不啰嗦、像短剧系统。

**Architecture:** 在 authenticated layout 下新增 `SystemConversationProvider` 统一管理对话与记忆；`GlobalCommandBar` 提交后写入 store 并在页面内联渲染；用状态机（execute/confirm/clarify/done/degraded）驱动 UI；偏好记忆落 DB 并在 `/profile` 管理。

**Tech Stack:** Next.js App Router, React + TypeScript, Tailwind, shadcn/ui（已有）, Supabase

---

## File Map（先锁边界）

**Create**
- `src/components/SystemConversation.tsx`
- `src/components/SystemTurn.tsx`
- `src/components/SystemMessage.tsx`
- `src/components/SystemUserMessage.tsx`
- `src/components/SystemConversationToggle.tsx`
- `src/lib/system-conversation/types.ts`
- `src/lib/system-conversation/store.tsx`
- `src/lib/system-conversation/turn-builder.ts`
- `src/lib/system-conversation/storage.ts`
- `src/lib/system-memory/preferences.ts`
- `src/app/(authenticated)/profile/SystemMemorySection.tsx`
- `src/app/api/system-memory/preferences/route.ts`
- `supabase/migrations/<timestamp>_system_memory_preferences.sql`

**Modify**
- `src/components/GlobalCommandBar.tsx`
- `src/app/(authenticated)/system/page.tsx`
- `src/app/(authenticated)/today/page.tsx`
- `src/app/(authenticated)/profile/page.tsx`
- `src/app/(authenticated)/layout.tsx`
- `src/app/api/command/draft/route.ts`（仅做字段/状态兼容，不改核心业务）

**Test**
- `src/lib/system-conversation/turn-builder.test.ts`
- `src/lib/system-conversation/storage.test.ts`
- `src/lib/system-memory/preferences.test.ts`

---

### Task 1: 引入系统对话类型与状态机（纯逻辑层）

**Files:**
- Create: `src/lib/system-conversation/types.ts`
- Create: `src/lib/system-conversation/turn-builder.ts`
- Test: `src/lib/system-conversation/turn-builder.test.ts`

- [ ] **Step 1: 写 failing test（状态映射）**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTurnFromDraftResponse } from './turn-builder'

test('buildTurnFromDraftResponse: maps executable -> responded.execute', () => {
  const turn = buildTurnFromDraftResponse({
    sourcePage: 'system',
    userText: '我今天该做什么',
    draftResponse: {
      status: 'executable',
      judgement: '今天只需要推进主线',
      reason: '你已经有明确主线',
      nextStep: '进入专注模式开始推进',
      primaryAction: { kind: 'link', href: '/today?view=focus', label: '去执行' },
    },
  })
  assert.equal(turn.state, 'responded.execute')
  assert.equal(turn.tag, '系统判断')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test src/lib/system-conversation/turn-builder.test.ts`
Expected: FAIL（模块不存在/函数不存在）

- [ ] **Step 3: 实现 types.ts（最小可用）**

```ts
export type SystemTurnState =
  | 'submitting'
  | 'responded.execute'
  | 'responded.confirm'
  | 'responded.clarify'
  | 'done'
  | 'degraded'

export type SystemTurnTag = '系统判断' | '需要确认' | '需要澄清' | '已执行' | '降级理解'

export type SystemPrimaryAction =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'confirm'; label: string; draftId: string }
  | { kind: 'focusInput'; label: string; prefill?: string }

export type SystemDraftResponse =
  | {
      status: 'executable'
      judgement: string
      reason: string
      nextStep: string
      primaryAction: SystemPrimaryAction
    }
  | {
      status: 'need_confirmation'
      draftId: string
      judgement: string
      reason: string
      nextStep: string
    }
  | {
      status: 'need_more_info'
      question: string
      judgement: string
      reason: string
      nextStep: string
      prefill?: string
    }
  | {
      status: 'not_ready' | 'error'
      judgement: string
      reason: string
      nextStep: string
      prefill?: string
    }

export type SystemTurn = {
  id: string
  createdAt: string
  sourcePage: 'system' | 'today' | 'profile'
  userText: string
  state: SystemTurnState
  tag: SystemTurnTag
  judgement: string
  reason: string
  nextStep: string
  primaryAction: SystemPrimaryAction | null
  traceId?: string
}
```

- [ ] **Step 4: 实现 turn-builder.ts（状态映射 + 降级兜底）**

```ts
import crypto from 'node:crypto'
import type { SystemDraftResponse, SystemTurn } from './types'

export function buildTurnFromDraftResponse({
  sourcePage,
  userText,
  draftResponse,
}: {
  sourcePage: SystemTurn['sourcePage']
  userText: string
  draftResponse: SystemDraftResponse
}): SystemTurn {
  const base = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    sourcePage,
    userText,
    traceId: undefined,
  } satisfies Pick<SystemTurn, 'id' | 'createdAt' | 'sourcePage' | 'userText' | 'traceId'>

  if (draftResponse.status === 'executable') {
    return {
      ...base,
      state: 'responded.execute',
      tag: '系统判断',
      judgement: draftResponse.judgement,
      reason: draftResponse.reason,
      nextStep: draftResponse.nextStep,
      primaryAction: draftResponse.primaryAction,
    }
  }

  if (draftResponse.status === 'need_confirmation') {
    return {
      ...base,
      state: 'responded.confirm',
      tag: '需要确认',
      judgement: draftResponse.judgement,
      reason: draftResponse.reason,
      nextStep: draftResponse.nextStep,
      primaryAction: { kind: 'confirm', draftId: draftResponse.draftId, label: '确认写入' },
    }
  }

  if (draftResponse.status === 'need_more_info') {
    return {
      ...base,
      state: 'responded.clarify',
      tag: '需要澄清',
      judgement: draftResponse.judgement,
      reason: draftResponse.reason,
      nextStep: draftResponse.question,
      primaryAction: { kind: 'focusInput', label: '告诉我你卡在哪', prefill: draftResponse.prefill },
    }
  }

  return {
    ...base,
    state: 'degraded',
    tag: '降级理解',
    judgement: draftResponse.judgement,
    reason: draftResponse.reason,
    nextStep: draftResponse.nextStep,
    primaryAction: { kind: 'focusInput', label: '按这个继续', prefill: draftResponse.prefill },
  }
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `node --test src/lib/system-conversation/turn-builder.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/system-conversation/types.ts src/lib/system-conversation/turn-builder.ts src/lib/system-conversation/turn-builder.test.ts
git commit -m "feat: add system conversation turn state machine"
```

---

### Task 2: 可见历史（3 轮）+ 工作记忆（20 轮）持久化

**Files:**
- Create: `src/lib/system-conversation/storage.ts`
- Create: `src/lib/system-conversation/storage.test.ts`

- [ ] **Step 1: 写 failing test（裁剪规则）**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { clipHistory, clipWorkingMemory } from './storage'

test('clipHistory keeps 3', () => {
  const input = Array.from({ length: 10 }, (_, i) => `h${i}`)
  assert.deepEqual(clipHistory(input), ['h7', 'h8', 'h9'])
})

test('clipWorkingMemory keeps 20', () => {
  const input = Array.from({ length: 30 }, (_, i) => `m${i}`)
  assert.equal(clipWorkingMemory(input).length, 20)
  assert.equal(clipWorkingMemory(input)[0], 'm10')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test src/lib/system-conversation/storage.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 storage.ts（纯函数 + key 常量）**

```ts
export const SYSTEM_CONVERSATION_STORAGE_KEY = 'flowspark.systemConversation.v1'

export function clipHistory<T>(items: T[]) {
  return items.slice(-3)
}

export function clipWorkingMemory<T>(items: T[]) {
  return items.slice(-20)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test src/lib/system-conversation/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/system-conversation/storage.ts src/lib/system-conversation/storage.test.ts
git commit -m "feat: add conversation storage clipping rules"
```

---

### Task 3: SystemConversationProvider（全站共享 store）

**Files:**
- Create: `src/lib/system-conversation/store.tsx`
- Modify: `src/app/(authenticated)/layout.tsx`

- [ ] **Step 1: 建立 store API（无 UI）**

`store.tsx` 提供：

- `turnsVisible`（最多 3）
- `turnsWorking`（最多 20）
- `appendSubmittingTurn(userText, sourcePage)`
- `replaceLastTurnWithResponse(draftResponse)`
- `clearConversation()`

要求：

- 初始渲染不读 localStorage（避免 hydration mismatch）
- `useEffect` 里读取 localStorage 恢复历史

- [ ] **Step 2: 在 authenticated layout 挂 Provider**

把 Provider 包在现有页面内容外层，让 `/system /today /profile` 共享。

- [ ] **Step 3: 基础手动验证**

打开任意页面：

- 刷新前后对话历史可恢复
- 不出现 hydration mismatch

- [ ] **Step 4: Commit**

```bash
git add src/lib/system-conversation/store.tsx src/app/(authenticated)/layout.tsx
git commit -m "feat: add global system conversation provider"
```

---

### Task 4: UI 组件（SystemConversation / Turn / Message）

**Files:**
- Create: `src/components/SystemConversation.tsx`
- Create: `src/components/SystemTurn.tsx`
- Create: `src/components/SystemMessage.tsx`
- Create: `src/components/SystemUserMessage.tsx`
- Create: `src/components/SystemConversationToggle.tsx`

- [ ] **Step 1: 实现 SystemMessage（3 段 + 1 主按钮）**

约束：

- judgement/reason/nextStep 永远展示
- tag 小标签永远展示
- primaryAction 为空则不展示按钮

- [ ] **Step 2: 实现 Turn（上：用户一句，下：系统三段）**

- [ ] **Step 3: 实现 SystemConversation（默认 1，展开到 3）**

展开/收起组件 `SystemConversationToggle`：

- 默认：只 render 最近 1 轮
- 展开：render 最近 3 轮

- [ ] **Step 4: Commit**

```bash
git add src/components/SystemConversation.tsx src/components/SystemTurn.tsx src/components/SystemMessage.tsx src/components/SystemUserMessage.tsx src/components/SystemConversationToggle.tsx
git commit -m "feat: add inline system conversation UI components"
```

---

### Task 5: 改造 GlobalCommandBar（去 Sheet 回执，写入对话流）

**Files:**
- Modify: `src/components/GlobalCommandBar.tsx`

- [ ] **Step 1: 移除/禁用 Sheet 回执**

要求：

- 提交后不打开 Sheet
- 不遮罩页面

- [ ] **Step 2: 提交流程改为：submitting -> requestDraft -> buildTurnFromDraftResponse -> store**

伪流程：

1. `appendSubmittingTurn(userText, sourcePage)`
2. `POST /api/command/draft`
3. 成功：`replaceLastTurnWithResponse(...)`
4. 失败：用 degraded 模板构造 response，写回 store

- [ ] **Step 3: 主按钮行为**

primaryAction.kind:

- link：直接跳转
- focusInput：聚焦输入框并可选 prefill
- confirm：调用确认接口（见 Task 7）

- [ ] **Step 4: Commit**

```bash
git add src/components/GlobalCommandBar.tsx
git commit -m "feat: route command bar responses into inline conversation"
```

---

### Task 6: 三页面接入 SystemConversation（位置固定）

**Files:**
- Modify: `src/app/(authenticated)/system/page.tsx`
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/app/(authenticated)/profile/page.tsx`

- [ ] **Step 1: /system 接入（Hero 下方）**

插入 `<SystemConversation sourcePage="system" />`

- [ ] **Step 2: /today 接入（标题/工具条下方）**

插入 `<SystemConversation sourcePage="today" />`

- [ ] **Step 3: /profile 接入（Tabs 下方）**

插入 `<SystemConversation sourcePage="profile" />`

- [ ] **Step 4: 手动验收**

- 任意页发一句话，系统回执出现在页面内
- 切换页面后历史仍在（最近 3 轮可见）

- [ ] **Step 5: Commit**

```bash
git add src/app/(authenticated)/system/page.tsx src/app/(authenticated)/today/page.tsx src/app/(authenticated)/profile/page.tsx
git commit -m "feat: mount system conversation on system/today/profile pages"
```

---

### Task 7: 偏好记忆（DB + API + Profile 管理）

**Files:**
- Create: `supabase/migrations/<timestamp>_system_memory_preferences.sql`
- Create: `src/lib/system-memory/preferences.ts`
- Create: `src/app/api/system-memory/preferences/route.ts`
- Create: `src/app/(authenticated)/profile/SystemMemorySection.tsx`
- Modify: `src/app/(authenticated)/profile/page.tsx`
- Test: `src/lib/system-memory/preferences.test.ts`

- [ ] **Step 1: 数据库迁移**

创建表（示例）：

```sql
create table if not exists system_memory_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  title text not null,
  description text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists system_memory_preferences_user_key
  on system_memory_preferences(user_id, key);
```

- [ ] **Step 2: API**

`GET`：列出用户偏好  
`POST/PATCH`：开关 enabled、更新描述  
`DELETE`：删除

- [ ] **Step 3: Profile UI**

在 `/profile` 增加 “系统记忆”区：

- 每条：title + description + toggle + delete
- 满足 “开关 + 解释”

- [ ] **Step 4: 让系统使用偏好（最小落地）**

在 `GlobalCommandBar` 生成 degraded/clarify 的文案时，读取偏好（例如“回复短/不连环问”）进行模板选择。

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations src/lib/system-memory/preferences.ts src/app/api/system-memory/preferences/route.ts src/app/(authenticated)/profile/SystemMemorySection.tsx src/app/(authenticated)/profile/page.tsx src/lib/system-memory/preferences.test.ts
git commit -m "feat: add preference memory with toggleable controls"
```

---

### Task 8: 更早摘要记忆（仅落接口与存根，不做强 AI）

**Files:**
- Create: `src/lib/system-memory/summarized.ts`（存根）
- Modify: `src/lib/system-conversation/store.tsx`（超 20 轮时写入摘要事件）

- [ ] **Step 1: 定义摘要写入点**

当 working memory 超过 20：

- 把最早的一段对话“打包成摘要事件”写入一个队列（先 local 记录即可）
- 不在 V1 做 LLM 真实摘要，只把接口与扩展点留好

- [ ] **Step 2: Commit**

```bash
git add src/lib/system-memory/summarized.ts src/lib/system-conversation/store.tsx
git commit -m "chore: add summarized memory extension point"
```

---

### Task 9: 统一 placeholder 与焦点行为（消除“两个输入框人格”）

**Files:**
- Modify: `src/components/GlobalCommandBar.tsx`

- [ ] **Step 1: placeholder 固定**

全站固定：

- `对系统说：你现在想推进什么？`

页面语境差异不再通过 placeholder 体现，而通过 SystemConversation 的系统提示体现。

- [ ] **Step 2: focusInput 行为**

当 primaryAction.kind=focusInput：

- 聚焦输入框
- 可选 prefill

- [ ] **Step 3: Commit**

```bash
git add src/components/GlobalCommandBar.tsx
git commit -m "chore: unify command bar placeholder and focus behavior"
```

---

### Task 10: 验证与回归

**Files:**
- Test: `src/lib/system-conversation/*.test.ts`
- Test: `src/lib/system-memory/preferences.test.ts`

- [ ] **Step 1: 跑单测**

Run:

```bash
node --test src/lib/system-conversation/turn-builder.test.ts
node --test src/lib/system-conversation/storage.test.ts
node --test src/lib/system-memory/preferences.test.ts
```

Expected: PASS

- [ ] **Step 2: lint**

Run:

```bash
npm run lint
```

Expected: PASS

- [ ] **Step 3: 手动验收（3 条路径）**

- `/system`：发一句 → 内联回复出现；不弹窗；失败也能 degraded 继续
- `/today`：发一句 → 内联回复出现；切回 `/system` 可见历史仍在
- `/profile`：能看到“系统记忆”区；toggle 生效；删除可用

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: verify global system conversation flow"
```

---

## Self-Review（对照 spec 覆盖）

- 覆盖了：内联对话流、状态机、降级兜底、全站共享、UI 3 轮、工作记忆 20 轮、偏好记忆开关+解释、自我画像（仅入口未实现）、摘要扩展点。
- 无 “TBD/TODO/后面再说” 占位步骤（迁移中的 `<timestamp>` 需在执行时替换为实际时间戳）。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-23-global-system-conversation-implementation-plan.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session using executing-plans with checkpoints

Which approach?

