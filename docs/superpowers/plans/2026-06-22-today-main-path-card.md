# Today 独立主线卡 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `Today` 的 `focus` 视图中新增独立 `Main Path Card`，把原本属于 `other` 的主线路径 action 单独托起展示，同时不破坏现有分层语义。

**Architecture:** 继续复用 `today/page.tsx` 已经生成的 `primaryPathContext` 与 `TodayActionList` 现有 `focusModel.groups`。实现上只在 `TodayActionList` 内部拆出 `mainPathGroup` 和 `secondaryGroups`，并在 `overdue` 与 `other` 之间插入一个新的主线容器；任务单元继续复用 `ActionItem`，不扩散到 AI API、数据库或 `all` 视图。

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui

---

## File Map

- Modify: `src/app/(authenticated)/today/page.tsx`
  - 继续透传 `primaryGoalId`
  - 新增透传单一对象型 `primaryPathContext`
- Modify: `src/components/TodayActionList.tsx`
  - 扩展 props
  - 从 `focusModel.groups` 中拆出 `mainPathGroup`
  - 新增 `Main Path Card` 渲染
  - 保留 `all` 视图逻辑不变
- Check: `src/lib/path-context.ts`
  - 确认 `primaryPathContext` 的字段与计划一致
- Verify: `GetDiagnostics`
  - 检查本批改动文件的 TS/JSX 诊断
- Verify: `npm run build`
  - 验证第 9 批可构建

## Implementation Notes

- 只从 `focusModel.groups` 中抽出 `goalId === primaryGoalId` 的 group。
- `Main Path Card` 与 `other` 不重复；不顺手修复历史的 `must / overdue` 重叠行为。
- 若不存在主线路径 group 或 group 为空，则不渲染 `Main Path Card`。
- `ActionItem` 原样复用，不新增 badge，不改完成逻辑。
- 视觉层级高于普通 `other` group、低于顶部 hero。

### Task 1: 对齐主线卡输入合同

**Files:**
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/components/TodayActionList.tsx`
- Check: `src/lib/path-context.ts`

- [ ] **Step 1: 确认 `primaryPathContext` 字段**

检查 `src/lib/path-context.ts` 中导出的 `PrimaryPathContext` 类型，确认直接复用该类型，而不是在 `TodayActionList` 内重新定义裁剪版 shape：

```ts
type PrimaryPathContext = {
  goalId: string
  title: string
  stageLabel: string
  titleText: string
  body: string
  evidence: string
  ctaLabel: string
}
```

- [ ] **Step 2: 扩展 `TodayActionList` props**

在 `src/components/TodayActionList.tsx` 中直接引入并复用 `PrimaryPathContext`：

```ts
import type { PrimaryPathContext } from '@/lib/path-context'

primaryGoalId?: string | null
primaryPathContext?: PrimaryPathContext | null
```

- [ ] **Step 3: 从 `today/page.tsx` 透传同一个上下文对象**

在 `src/app/(authenticated)/today/page.tsx` 中把已有的 `primaryPathContext` 原对象直接传给 `TodayActionList`：

```tsx
<TodayActionList
  ...
  primaryGoalId={primaryPathContext?.goalId ?? null}
  primaryPathContext={primaryPathContext ?? null}
/>
```

- [ ] **Step 4: 运行局部诊断**

Run: `GetDiagnostics` for `src/app/(authenticated)/today/page.tsx` and `src/components/TodayActionList.tsx`  
Expected: 无新增类型错误

- [ ] **Step 5: Commit**

```bash
git add src/app/\(authenticated\)/today/page.tsx src/components/TodayActionList.tsx
git commit -m "feat: pass main path context into today action list"
```

### Task 2: 从 other 中拆出主线路径 group

**Files:**
- Modify: `src/components/TodayActionList.tsx`

- [ ] **Step 1: 在 `focus` 视图派生主线 group**

基于现有 `focusModel.groups` 派生：

```ts
const mainPathGroup =
  primaryGoalId ? focusModel.groups.find(group => group.goalId === primaryGoalId) ?? null : null

const secondaryGroups =
  mainPathGroup
    ? focusModel.groups.filter(group => group.goalId !== mainPathGroup.goalId)
    : focusModel.groups
```

- [ ] **Step 2: 保持数据边界**

确保 `mainPathGroup` 只来自 `focusModel.groups`，不重新扫描全部 actions，不从 `recent / must / overdue / completed` 抽数据。

- [ ] **Step 3: 处理空场景**

只在以下条件全部满足时渲染主线卡：

```ts
const shouldShowMainPathCard =
  Boolean(primaryGoalId) &&
  Boolean(primaryPathContext) &&
  Boolean(mainPathGroup?.items.length)
```

- [ ] **Step 4: 运行局部诊断**

Run: `GetDiagnostics` for `src/components/TodayActionList.tsx`  
Expected: 无新增诊断错误

- [ ] **Step 5: Commit**

```bash
git add src/components/TodayActionList.tsx
git commit -m "feat: derive main path group from today focus groups"
```

### Task 3: 渲染 Main Path Card

**Files:**
- Modify: `src/components/TodayActionList.tsx`

- [ ] **Step 1: 在 `overdue` 后、`other` 前插入主线卡容器**

容器结构最小如下：

```tsx
{shouldShowMainPathCard ? (
  <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 md:p-5">
    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
      Main Path
    </div>
    <div className="mt-2 text-lg font-semibold">{primaryPathContext.title}</div>
    <div className="mt-1 text-sm text-foreground/90">{primaryPathContext.titleText}</div>
    <div className="mt-2 text-sm leading-6 text-muted-foreground">{primaryPathContext.body}</div>
    <div className="mt-4 grid gap-3">
      {mainPathGroup.items.map(action => (
        <ActionItem key={action.id} ... />
      ))}
    </div>
  </div>
) : null}
```

- [ ] **Step 2: 复用现有 `ActionItem` 参数**

主线卡中的每个 action 必须复用现有参数集，例如：

```tsx
<ActionItem
  action={action}
  dict={dict}
  showGoalTitle={showGoalTitle}
  tz={tz}
  goals={goals}
  initialOpen={action.id === initialOpenActionId}
  initialPanelMode={action.id === initialOpenActionId ? initialPanelMode : 'view'}
/>
```

并明确要求：主线卡内的 `ActionItem` 也必须保留与其他区块一致的深链展开能力，不能因为从 `other` 中抽离后丢失 `initialOpen` / `initialPanelMode`。

- [ ] **Step 3: 给容器补最小 CTA**

在主线卡底部补两个轻量入口：

```tsx
<Link href={`/goals/${mainPathGroup.goalId}`}>进入这条路径</Link>
<Link href="/goals">查看全部路径</Link>
```

- [ ] **Step 4: `other` 改为渲染 `secondaryGroups`**

把现有 `focusModel.groups.map(...)` 替换为 `secondaryGroups.map(...)`，确保主线路径 group 不重复出现在 `other` 中。

- [ ] **Step 5: 手动检查 3 个场景**

检查：
- 有主线路径且 `other` 中有动作时，主线卡出现
- `secondaryGroups` 为空但主线路径 group 仍有动作时，主线卡仍出现，`other` 可为空或不渲染
- 无主线路径时，页面退回现有结构

- [ ] **Step 6: Commit**

```bash
git add src/components/TodayActionList.tsx
git commit -m "feat: surface main path card in today focus view"
```

### Task 4: 验证与回归

**Files:**
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/components/TodayActionList.tsx`

- [ ] **Step 1: 运行诊断**

Run: `GetDiagnostics` for:
- `src/app/(authenticated)/today/page.tsx`
- `src/components/TodayActionList.tsx`

Expected: 无新增诊断错误

- [ ] **Step 2: 运行构建**

Run:

```bash
npm run build
```

Expected: 退出码 `0`

- [ ] **Step 3: 回归检查**

确认：
- `focus` 视图新增 `Main Path Card`
- 主线路径 group 不再在 `other` 重复出现
- `all` 视图未受影响
- `recent / must / overdue / completed` 仍按原有逻辑存在
- 带 `action` 或 `rescue` 参数命中主线路径 action 时，仍能自动展开并滚动到正确位置

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/today/page.tsx src/components/TodayActionList.tsx
git commit -m "chore: verify today main path card integration"
```

## Done Definition

- `Today` 的 `focus` 视图出现独立 `Main Path Card`
- 该卡只承接原本 `other` 中的主线路径 group
- `Main Path Card` 与 `other` 不重复
- 空场景不渲染主线卡
- 不新增依赖
- `GetDiagnostics` 通过
- `npm run build` 通过
