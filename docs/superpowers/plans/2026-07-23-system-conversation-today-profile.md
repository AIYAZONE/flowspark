# SystemConversation 在 /today 与 /profile 固定位置挂载 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/today` 与 `/profile` 页面按与 `/system` 对齐的固定位置插入 `<SystemConversation />`，并确保每个页面只挂载一次，避免重复渲染；完成 lint/test 验证并汇报改动文件与关键代码段。

**Architecture:** 直接在两个页面的顶层布局中插入 `<SystemConversation />`（与 `/system` 一致），避免放在响应式分支或 Tab 内容中导致重复挂载；组件本身会在无 turns 时返回 `null`，不引入额外渲染负担。

**Tech Stack:** Next.js App Router (Server Components + Client Components), React 19, TypeScript, Zustand store（SystemConversationProvider 已在 authenticated layout 提供）。

---

## 文件结构与改动点

- Modify: `/Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/today/page.tsx`
- Modify: `/Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/profile/page.tsx`

说明：
- `<SystemConversation />` 来自 `/Users/ht-2502/Documents/mycode/flowspark/src/components/SystemConversation.tsx`
- store provider 来自 `/Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/layout.tsx`（页面无需重复 provider）

---

### Task 1: /today 顶层 header 之后插入 SystemConversation

**Files:**
- Modify: `/Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/today/page.tsx`
- Test: 运行 `npm run lint`、`npm run test`

- [ ] **Step 1: 添加 import**

在 `today/page.tsx` 顶部 import 区增加：

```tsx
import { SystemConversation } from '@/components/SystemConversation'
```

- [ ] **Step 2: 在顶层 header 块之后插入一次组件**

定位 `return (` 内顶层容器：

```tsx
return (
  <div className="space-y-6">
```

在该页面的“标题/日期/CTA 的 header 区块”（当前实现是包含 `<h1>` 的那段块）之后、且在后续主内容之前插入：

```tsx
<SystemConversation />
```

约束：
- 不要放在 `md:hidden` 或 `md:flex` 等分支内部，避免 mobile/desktop 结构各插一份导致重复挂载。

- [ ] **Step 3: 运行 lint**

Run:

```bash
npm run lint
```

Expected: 退出码 0

- [ ] **Step 4: 运行 test**

Run:

```bash
npm run test
```

Expected: 退出码 0

---

### Task 2: /profile 顶层 header 之后、ProfileTabs 之前插入 SystemConversation

**Files:**
- Modify: `/Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/profile/page.tsx`
- Test: 运行 `npm run lint`、`npm run test`

- [ ] **Step 1: 添加 import**

在 `profile/page.tsx` 顶部 import 区增加：

```tsx
import { SystemConversation } from '@/components/SystemConversation'
```

- [ ] **Step 2: 在 header 之后、ProfileTabs 之前插入一次组件**

定位顶层容器：

```tsx
return (
  <div className="space-y-8 max-w-3xl mx-auto">
```

在这段 header（包含 `<h1>` 与 `<LanguageToggle />`）之后、`<ProfileTabs ... />` 之前插入：

```tsx
<SystemConversation />
```

约束：
- 不要放进任何 tab 的 `content` 中，避免 tab 切换或多处复用导致重复挂载。

- [ ] **Step 3: 运行 lint**

Run:

```bash
npm run lint
```

Expected: 退出码 0

- [ ] **Step 4: 运行 test**

Run:

```bash
npm run test
```

Expected: 退出码 0

---

### Task 3: 最终核对与交付说明

**Files:**
- Review: `/Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/today/page.tsx`
- Review: `/Users/ht-2502/Documents/mycode/flowspark/src/app/(authenticated)/profile/page.tsx`

- [ ] **Step 1: 代码层面确认“每页仅一次挂载”**

检查要点：
- 每个文件仅出现一次 `<SystemConversation />`
- 不在响应式分支/重复布局处插入

- [ ] **Step 2: 汇报**

交付内容：
- 列出改动文件
- 给出关键代码段（含插入位置附近 10~20 行上下文）
- 给出 lint/test 命令与结果摘要

