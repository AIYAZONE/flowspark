# Today 主线路径优先执行 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `Today` 的执行层与 AI Today Plan 在不改接口的前提下优先围绕当前主线路径工作。

**Architecture:** `Today` 页继续负责服务端计算 `primaryPathContext.goalId`，并把它透传给 `TodayActionList` 与 `AITodayPlanButton`。`TodayActionList` 只在现有 `focusModel` comparator 与 group 排序中注入主线路径 tie-break；`AITodayPlanButton` 只在 recommendation 未绑定 goal 时用 `preferredGoalId` 做本地 fallback。

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui

---

## File Map

- Modify: `src/app/(authenticated)/today/page.tsx`
  - 透传 `primaryGoalId` 给 `TodayActionList`
  - 透传 `preferredGoalId` 给 `AITodayPlanButton`
- Modify: `src/components/TodayActionList.tsx`
  - 增加 `primaryGoalId?: string | null`
  - 在 `focusModel` comparator 中插入主线路径 tie-break
  - 在 `other` group 排序中提升主线路径 group
  - 可选补充轻量提示文案
- Modify: `src/components/AITodayPlanButton.tsx`
  - 增加 `preferredGoalId?: string | null`
  - 调整 `pickFallbackGoalId()`
- Verify: `src/lib/path-context.ts`
  - 确认继续复用 `primaryPathContext.goalId`

## Task 1: Today 透传主线路径

**Files:**
- Modify: `src/app/(authenticated)/today/page.tsx`

- [ ] **Step 1: 定位主线路径现有来源**

Read:
- `src/app/(authenticated)/today/page.tsx`
- `src/lib/path-context.ts`

Expected:
- `primaryPathContext.goalId` 已在页面内可用，无需新增服务端查询。

- [ ] **Step 2: 给 TodayActionList 透传 primaryGoalId**

Update `TodayActionList` 调用：

```tsx
<TodayActionList
  ...
  primaryGoalId={primaryPathContext?.goalId ?? null}
/>
```

- [ ] **Step 3: 给 AITodayPlanButton 透传 preferredGoalId**

Update `AITodayPlanButton` 调用：

```tsx
<AITodayPlanButton
  ...
  preferredGoalId={primaryPathContext?.goalId ?? null}
/>
```

- [ ] **Step 4: 运行诊断检查页面调用**

Run: `GetDiagnostics` on `src/app/(authenticated)/today/page.tsx`
Expected: 无类型错误、无未知 prop 报错

## Task 2: TodayActionList 注入主线路径偏置

**Files:**
- Modify: `src/components/TodayActionList.tsx`

- [ ] **Step 1: 扩展组件 props**

Add prop:

```ts
primaryGoalId?: string | null
```

并在组件参数中接收它。

- [ ] **Step 2: 在 comparator 中加入主线路径 tie-break**

在现有 `focusModel.sortedIncomplete` comparator 中：
- 保留现有顺序：
  - overdue
  - priority
  - `type === 'core'`
- 在日期比较前加入：

```ts
const primaryA = primaryGoalId && a.goal_id === primaryGoalId ? 1 : 0
const primaryB = primaryGoalId && b.goal_id === primaryGoalId ? 1 : 0
if (primaryA !== primaryB) return primaryB - primaryA
```

- [ ] **Step 3: 保持 recent / must / overdue bucket 语义不变**

Check:
- `recent` 仍先基于 `isRecentlyCreated` 抽出
- `must` 仍先抽高优先级或 `core`
- `overdue` 保持当前实现语义，本批次不顺手修复 `must` / `overdue` 的历史重叠

Expected:
- 只改变 bucket 内部顺序，不改变 bucket 是否存在。

- [ ] **Step 4: 调整 other groups 排序**

在 `groups.sort(...)` 中把主线路径 group 提前：

```ts
const primaryGroupA = primaryGoalId && a.goalId === primaryGoalId ? 1 : 0
const primaryGroupB = primaryGoalId && b.goalId === primaryGoalId ? 1 : 0
if (primaryGroupA !== primaryGroupB) return primaryGroupB - primaryGroupA
```

然后继续复用原有 `items.length` 与 `goalId` 排序。

- [ ] **Step 5: 可选补一句弱提示**

如果实现成本很低，在 summary 区补一句：

```tsx
{primaryGoalId ? (
  <div className="text-xs text-muted-foreground">
    {isZh ? '已优先围绕当前主线路径排序' : 'Prioritized around your current main path'}
  </div>
) : null}
```

若文案位置会破坏现有布局，则跳过，不强求。

- [ ] **Step 6: 运行诊断检查 TodayActionList**

同时确认 `focusModel` 的 `useMemo` 依赖已包含 `primaryGoalId`，避免 prop 变化时排序不刷新。

Run: `GetDiagnostics` on `src/components/TodayActionList.tsx`
Expected: 无类型错误、无未使用变量

## Task 3: AITodayPlanButton 增加 fallback 偏置

**Files:**
- Modify: `src/components/AITodayPlanButton.tsx`

- [ ] **Step 1: 扩展 Props**

Add prop:

```ts
preferredGoalId?: string | null
```

并给默认值 `null`。

- [ ] **Step 2: 修改 pickFallbackGoalId()**

在现有逻辑前插入：

```ts
if (preferredGoalId && candidateGoals.some(goal => goal.id === preferredGoalId)) {
  return preferredGoalId
}
```

其余 `priority > end_date > title` 逻辑保持不变。

- [ ] **Step 3: 确认不修改 API 输入顺序**

Check request body:

```ts
body: JSON.stringify({ today: defaultDate, goals: candidateGoals, actions: candidateActions, locale })
```

Expected:
- 不调整 `candidateGoals` 数组顺序
- 不增加新的 API 字段

- [ ] **Step 4: 运行诊断检查组件**

Run: `GetDiagnostics` on `src/components/AITodayPlanButton.tsx`
Expected: 无类型错误，其他调用点因 prop 可选而无需改动

## Task 4: 集成验证

**Files:**
- Verify: `src/app/(authenticated)/today/page.tsx`
- Verify: `src/components/TodayActionList.tsx`
- Verify: `src/components/AITodayPlanButton.tsx`

- [ ] **Step 1: 运行最近改动文件诊断**

Run:
- `GetDiagnostics` for `src/app/(authenticated)/today/page.tsx`
- `GetDiagnostics` for `src/components/TodayActionList.tsx`
- `GetDiagnostics` for `src/components/AITodayPlanButton.tsx`

Expected:
- 全部无新增错误

- [ ] **Step 2: 运行生产构建**

Run:

```bash
npm run build
```

Expected:
- 命令退出码为 `0`
- 构建通过

- [ ] **Step 3: 回归检查关键边界**

Manual checks:
- `Today` 的 `focus` 视图仍保留 `recent / must / overdue / other / completed`
- 主线路径 action 在同等条件下更靠前
- `other` 中主线路径 group 更靠前
- `AITodayPlanButton` 仅改变 fallback 落点，不改变 API 输入协议
- `rescue` 与 `tomorrow handoff` 入口仍存在

- [ ] **Step 4: 记录结果**

记录：
- 改动文件列表
- 是否加入弱提示文案
- 构建结果
- 是否发现需要进入第 9 批处理的残余问题
