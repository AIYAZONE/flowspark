# Today 主线路径推进密度卡 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `Today` 的 `Main Path Card` 中新增推进密度层，让用户看到主线最近 7 天推进频率、当前完成/剩余动作密度，以及今天推进这一步的意义。

**Architecture:** 在服务端新增一个轻量 `main-path-density` helper，只针对 `primaryGoalId` 派生密度上下文，避免把时间窗统计逻辑堆回客户端。`today/page.tsx` 负责查询主线路径近 7 天轻量动作数据并透传 `mainPathDensityContext`，`TodayActionList.tsx` 只负责把它渲染进现有 `Main Path Card`，同时把主线卡拆成“始终可显示的 header + density + CTA”和“按存在性显示的 action list / fallback”。

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui

---

## File Map

- Create: `src/lib/main-path-density.ts`
  - 统一生成 `MainPathDensityContext`
  - 处理近 7 天推进频率、动作密度、今日推进意义、降级策略
- Modify: `src/app/(authenticated)/today/page.tsx`
  - 查询主线路径最近 7 天轻量 action 时间窗数据
  - 调用 helper 生成 `mainPathDensityContext`
  - 透传给 `TodayActionList`
- Modify: `src/components/TodayActionList.tsx`
  - 接收 `mainPathDensityContext`
  - 在现有 `Main Path Card` 中插入 2 个轻指标块和 1 条意义句
  - 把卡片显示条件从“必须有 residual action”改为“只要有 `primaryPathContext` 就显示密度层”
- Check: `src/lib/path-context.ts`
  - 复用 `PrimaryPathContext`，不改其既有语义
- Verify: `GetDiagnostics`
  - 检查新 helper 与两处改动文件
- Verify: `npm run build`
  - 验证第 10 批闭环

## Implementation Notes

- `recentCompletedCount7d` 不能直接从 Today 当前 actions 列表硬算，必须来自主线路径专属轻量查询。
- 近 7 天窗口必须按用户时区 bucket 判断，不能直接用 `${date}T00:00:00.000Z` 充当用户本地零点。
- `completionCount / remainingCount / totalCount` 继续来自 `activeGoals.actions`，不要和 7 天查询混在客户端现场拼。
- 主线卡本身只要存在 `primaryPathContext` 就应显示 header + density + CTA。
- `mainPathGroup?.items` 只决定是否展示 residual action 列表，不决定主线卡是否存在。
- `recent` 指标必须可表达三种状态：
  - 可稳定显示
  - 降级为活跃数
  - 隐藏 recent 卡片，只保留其余两项
- 不改 `all` 视图，不改 `ActionItem` 接口，不改 AI API。

### Task 1: 新增主线路径密度 helper

**Files:**
- Create: `src/lib/main-path-density.ts`
- Check: `src/lib/path-context.ts`

- [ ] **Step 1: 定义上下文类型**

在 `src/lib/main-path-density.ts` 中新增：

```ts
import type { PrimaryPathContext } from '@/lib/path-context'

export type MainPathDensityContext = {
  goalId: string
  recentMetricStatus: 'ready' | 'fallback' | 'hidden'
  recentCompletedCount7d: number | null
  recentActiveCount7d: number | null
  completionCount: number
  remainingCount: number
  totalCount: number
  recentSummary: string | null
  progressSummary: string
  meaningSummary: string
}
```

- [ ] **Step 2: 定义 helper 输入**

新增一个纯函数，例如：

```ts
export function buildMainPathDensityContext(params: {
  locale: 'zh' | 'en'
  primaryPathContext: PrimaryPathContext | null
  totalCount: number
  completionCount: number
  recentCompletedCount7d: number | null
  recentActiveCount7d: number | null
}): MainPathDensityContext | null
```

- [ ] **Step 3: 在 helper 内实现最小逻辑**

实现规则：
- `remainingCount = Math.max(totalCount - completionCount, 0)`
- `recentMetricStatus`
  - `ready`: 有可靠完成频率
  - `fallback`: 没有稳定完成频率，退为活跃数
  - `hidden`: recent 指标不显示
- `recentSummary`
  - `ready`
    - zh: `近 7 天推进 ${recentCompletedCount7d} 次`
    - en: `${recentCompletedCount7d} moves in the last 7 days`
  - `fallback`
    - zh: `近 7 天主线有 ${recentActiveCount7d} 次活跃`
    - en: `${recentActiveCount7d} main-path touches in the last 7 days`
  - `hidden`
    - `null`
- `progressSummary`
  - zh: `已完成 ${completionCount} / 共 ${totalCount}`
  - en: `${completionCount} completed of ${totalCount}`
- `meaningSummary`
  - 基于 `primaryPathContext.titleText` + `remainingCount` + `recentCompletedCount7d`
  - 如果 `remainingCount === 0`，切为收口语义
  - 如果 `totalCount === 0`，切为“先把路径变成可执行”的语义

- [ ] **Step 4: 保持 helper 纯净**

不要在 helper 里访问数据库，不要依赖 React，只做纯计算与文案输出。

- [ ] **Step 5: 运行局部诊断**

Run: `GetDiagnostics` for `src/lib/main-path-density.ts`  
Expected: 无新增诊断错误

- [ ] **Step 6: Commit**

```bash
git add src/lib/main-path-density.ts
git commit -m "feat: add main path density context helper"
```

### Task 2: 在 Today 服务端生成 mainPathDensityContext

**Files:**
- Modify: `src/app/(authenticated)/today/page.tsx`
- Create: `src/lib/main-path-density.ts`

- [ ] **Step 1: 扩展主线路径近 7 天轻量查询**

在 `today/page.tsx` 中，当 `primaryPathContext?.goalId` 存在时新增轻量查询，字段至少包含：

```ts
const sevenDaysAgo = shiftDateBucket(today, -6)

const { data: recentMainPathActions } = primaryPathContext?.goalId
  ? await queryWithOwnershipFallback({
      execute: (ownershipColumn) => supabase
        .from('actions')
        .select('goal_id, completed, created_at, updated_at')
        .eq(ownershipColumn, ownerId)
        .eq('goal_id', primaryPathContext.goalId)
    })
  : { data: [] }
```

查询阶段不要试图用 UTC 零点直接裁窗口；只拉主线路径轻量字段，窗口判断放到 JS 侧按用户时区 bucket 做。

- [ ] **Step 2: 从 activeGoals 中拿主线路径动作总数**

复用已有 `activeGoals`，找到当前主线路径 goal：

```ts
const primaryGoal = (activeGoals || []).find(goal => goal.id === primaryPathContext?.goalId) ?? null
const totalCount = primaryGoal?.actions?.length ?? 0
const completionCount = primaryGoal?.actions?.filter(action => action.completed).length ?? 0
```

- [ ] **Step 3: 生成 mainPathDensityContext**

先在服务端按用户时区做 7 天 bucket 判断：

```ts
const inRecentWindow = (iso?: string | null) => {
  if (!iso) return false
  const bucket = getDateBucketInTZ(iso, tz)
  return bucket >= sevenDaysAgo && bucket <= today
}

const recentCompletedCount7d = (recentMainPathActions || []).filter(
  (action) => action.completed && inRecentWindow(action.updated_at)
).length

const recentActiveCount7d = (recentMainPathActions || []).filter(
  (action) => inRecentWindow(action.updated_at) || inRecentWindow(action.created_at)
).length
```

再调用 helper：

```ts
const recentMetricStatus =
  recentCompletedCount7d > 0
    ? 'ready'
    : recentActiveCount7d > 0
      ? 'fallback'
      : 'hidden'

const mainPathDensityContext = buildMainPathDensityContext({
  locale: localeIsZh ? 'zh' : 'en',
  primaryPathContext,
  totalCount,
  completionCount,
  recentCompletedCount7d: recentMetricStatus === 'ready' ? recentCompletedCount7d : null,
  recentActiveCount7d: recentMetricStatus === 'hidden' ? null : recentActiveCount7d,
})
```

- [ ] **Step 4: 透传给 TodayActionList**

```tsx
<TodayActionList
  ...
  primaryPathContext={primaryPathContext ?? null}
  mainPathDensityContext={mainPathDensityContext}
/>
```

- [ ] **Step 5: 运行局部诊断**

Run: `GetDiagnostics` for `src/app/(authenticated)/today/page.tsx`  
Expected: 无新增诊断错误

- [ ] **Step 6: Commit**

```bash
git add src/app/\(authenticated\)/today/page.tsx src/lib/main-path-density.ts
git commit -m "feat: derive main path density context on today page"
```

### Task 3: 在 Main Path Card 中渲染推进密度层

**Files:**
- Modify: `src/components/TodayActionList.tsx`

- [ ] **Step 1: 扩展 TodayActionList props**

直接引入并复用 `MainPathDensityContext`：

```ts
import type { MainPathDensityContext } from '@/lib/main-path-density'

mainPathDensityContext?: MainPathDensityContext | null
```

- [ ] **Step 2: 调整主线卡显示条件**

把主线卡存在条件从：

```ts
Boolean(primaryGoalId) && Boolean(primaryPathContext) && Boolean(mainPathGroup?.items.length)
```

改成：

```ts
const shouldShowMainPathCard = Boolean(primaryPathContext)
const shouldShowMainPathActions = Boolean(mainPathGroup?.items.length)
```

- [ ] **Step 3: 插入密度层**

在现有标题区与 action 列表之间插入 2 个轻指标块 + 1 条意义句：

```tsx
{mainPathDensityContext ? (
  <div className="mt-4 space-y-3">
    <div className={`grid gap-3 ${mainPathDensityContext.recentMetricStatus === 'hidden' ? '' : 'sm:grid-cols-2'}`}>
      {mainPathDensityContext.recentMetricStatus !== 'hidden' ? (
        <div className="rounded-2xl border border-border/50 bg-background/70 p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Recent</div>
          <div className="mt-2 text-base font-semibold">
            {mainPathDensityContext.recentCompletedCount7d ?? mainPathDensityContext.recentActiveCount7d}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{mainPathDensityContext.recentSummary}</div>
        </div>
      ) : null}
      <div className="rounded-2xl border border-border/50 bg-background/70 p-3">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Density</div>
        <div className="mt-2 text-base font-semibold">{mainPathDensityContext.remainingCount}</div>
        <div className="mt-1 text-xs text-muted-foreground">{mainPathDensityContext.progressSummary}</div>
      </div>
    </div>
    <div className="rounded-2xl border border-primary/12 bg-primary/6 px-4 py-3 text-sm leading-6 text-foreground/90">
      {mainPathDensityContext.meaningSummary}
    </div>
  </div>
) : null}
```

- [ ] **Step 4: 处理 action 列表 fallback**

如果 `shouldShowMainPathActions` 为 `false`，不要让整张卡消失；改为显示 fallback 文案：

```tsx
<div className="mt-4 rounded-2xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground">
  {isZh
    ? '今天这条主线没有落在 residual 动作区，说明它当前更多体现在 must / overdue / recent 或已接近收口。'
    : 'This main path does not currently sit inside the residual action area, which usually means it is showing up in must / overdue / recent or is already near closure.'}
</div>
```

- [ ] **Step 5: 保留深链能力**

若 `shouldShowMainPathActions` 为真，主线卡里的 `ActionItem` 继续透传：

```tsx
initialOpen={action.id === initialOpenActionId}
initialPanelMode={action.id === initialOpenActionId ? initialPanelMode : 'view'}
```

- [ ] **Step 6: 运行局部诊断**

Run: `GetDiagnostics` for `src/components/TodayActionList.tsx`  
Expected: 无新增诊断错误

- [ ] **Step 7: Commit**

```bash
git add src/components/TodayActionList.tsx
git commit -m "feat: add density layer to main path card"
```

### Task 4: 验证与回归

**Files:**
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/components/TodayActionList.tsx`
- Create: `src/lib/main-path-density.ts`

- [ ] **Step 1: 运行诊断**

Run: `GetDiagnostics` for:
- `src/lib/main-path-density.ts`
- `src/app/(authenticated)/today/page.tsx`
- `src/components/TodayActionList.tsx`

Expected: 无新增诊断错误

- [ ] **Step 2: 运行构建**

Run:

```bash
npm run build
```

Expected: 退出码 `0`

- [ ] **Step 3: 手动回归检查**

确认：
- 主线路径存在时，主线卡显示 header + density + CTA
- `mainPathGroup` 为空时，主线卡仍存在且展示 fallback
- `mainPathGroup` 有 residual action 时，动作列表仍正常显示
- `?action=` / `?rescue=` 命中主线 residual action 时，仍能自动展开并滚动
- 用户时区边界附近的 recent 统计按 `getDateBucketInTZ()` 判断，而不是 UTC 零点硬切
- `totalCount === 0` 时，meaningSummary 退回“先把路径变成可执行”
- `remainingCount === 0` 时，meaningSummary 退回收口语义
- `recentMetricStatus === 'hidden'` 时，不显示 Recent 卡片，但其余密度层仍正常显示
- `recentMetricStatus === 'fallback'` 时，Recent 卡片显示活跃数而不是伪精准完成次数
- `all` 视图未受影响

- [ ] **Step 4: Commit**

```bash
git add src/lib/main-path-density.ts src/app/\(authenticated\)/today/page.tsx src/components/TodayActionList.tsx
git commit -m "chore: verify main path density card integration"
```

## Done Definition

- `Main Path Card` 中新增推进密度层
- 密度层包含最近 7 天推进频率、当前完成/剩余动作、今日推进意义
- 主线卡只要存在 `primaryPathContext` 就显示 header + density + CTA
- residual action 为空时，主线卡展示 fallback，不整卡消失
- 主线 residual action 存在时，深链展开能力保持
- 不新增依赖
- `GetDiagnostics` 通过
- `npm run build` 通过
