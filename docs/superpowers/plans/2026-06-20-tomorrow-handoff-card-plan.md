# Tomorrow Handoff Card Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `Today` 页为“昨天完成 AI core action”的用户增加明日承接卡，验证 `completed -> returned_next_day` 的最小增长增强。

**Architecture:** 服务端在 `Today` 页单独查询昨天完成的 AI core action，并把候选 handoff 数据与 `today` 业务日透传给客户端。客户端组件基于 `localStorage` 决定当天是否真正渲染卡片，并在真实渲染后发送一次曝光事件；CTA 优先通过新的 `?action=<id>` 协议打开已有 action，否则只在 `showAIPlan=true` 时回退到 `#today-ai-plan`。

**Tech Stack:** Next.js App Router, React Client Components, TypeScript, Supabase, existing AI feedback/analytics pipeline

---

### Task 1: 服务端组装昨天完成候选

**Files:**
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/lib/time.ts`
- Test: `src/lib/time.test.ts`
- Check: `src/lib/ownership.ts`

- [ ] **Step 1: 补 yesterday candidate 查询设计点**

先把“昨天”的时间口径写成可执行 helper，而不是在 `today/page.tsx` 里继续手写日期字符串：
- 在 `src/lib/time.ts` 新增：
  - `getDateBucketInTZ(input: Date | string, timeZone: string): string`
  - `shiftDateBucket(dateBucket: string, days: number): string`
- 固定算法：
  - `todayDateBucket = getTodayInTZ(tz)`
  - `yesterdayDateBucket = shiftDateBucket(todayDateBucket, -1)`
  - 数据库只做粗筛：`updated_at >= new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()`
  - JS 做最终精筛：`getDateBucketInTZ(outcome.updated_at, tz) === yesterdayDateBucket`
- 这样不需要引入新的时区依赖，也不需要在 SQL 里拼用户时区 midnight -> UTC 的复杂换算；48 小时粗筛足以覆盖所有时区的“昨天”，最终是否命中完全由 `dateBucket` 精筛决定。

然后确认查询口径：
- `ai_recommendation_outcomes.user_id = currentUser.id`
- `completed = true`
- `updated_at` 先落入最近 48 小时粗筛，再由 `getDateBucketInTZ(..., tz)` 精筛到用户时区的昨天
- 优先使用 `outcomes.action_id` 关联 `actions`
- `action_id` 为空时，回退 `actions.ai_recommendation_id = recommendation_id`
- 目标 action 必须 `type = 'core'`
- 多候选时固定只取 1 条：
  - `ai_recommendation_outcomes.updated_at desc`
  - 若相同则 `ai_recommendation_outcomes.id desc`

- [ ] **Step 2: 在 `today/page.tsx` 增加 yesterday candidate 查询**

最小实现结果结构：

```ts
type TomorrowHandoffCandidate = {
  recommendationId: string
  actionId: string
  title: string
  goalId: string | null
  completedAt: string
}
```

查询路径固定为两段式：
- 第一段：只查 `ai_recommendation_outcomes`
- 第二段：再用 `queryWithOwnershipFallback(...)` 查 `actions`

第一段查询必须固定成下面的执行顺序，避免实现时又退回“查全表再猜”：
1. 读取 `todayDateBucket` 与 `yesterdayDateBucket`
2. 从 `ai_recommendation_outcomes` 按 `user_id + completed=true + updated_at>=48h` 查询
3. `order('updated_at', { ascending: false })`
4. 在 JS 中按 `getDateBucketInTZ(updated_at, tz) === yesterdayDateBucket` 过滤
5. 再按 `updated_at desc, id desc` 取唯一候选
6. 只有拿到候选 recommendation 后，才进入第二段 action 关联查询

- [ ] **Step 3: 计算可用承接目标**

在现有今日 actions 上计算：
- 今天是否已完成任意 `type='core'`
- 是否存在同 `goal_id` 的未完成 core action
- 是否允许回退到 `showAIPlan`
- 若存在多条同 `goal_id` 的未完成 core action，固定只选 1 条作为 `targetActionId`：
  - `priority` 高优先
  - 同优先级下 `start_date/end_date` 更早优先
  - 再按 `id` 稳定排序

推荐透传结构：

```ts
type TomorrowHandoffViewModel = {
  candidate: TomorrowHandoffCandidate | null
  targetActionId: string | null
  canFallbackToTodayPlan: boolean
  todayDateBucket: string
  locale: string
}
```

- [ ] **Step 4: 为新 `action` 参数预留读取位**

在 `today/page.tsx` 读取：

```ts
const actionIdParam = Array.isArray(searchParams?.action)
  ? searchParams.action[0]
  : searchParams?.action
```

并把它作为 `initialOpenActionId` 的优先来源，高于 `rescue`。

- [ ] **Step 5: 运行类型检查前置验证**

Run: `npm run build`
Expected: build 仍然通过或只剩后续任务相关报错

### Task 2: 明日承接卡组件与本地可见性

**Files:**
- Create: `src/components/TomorrowHandoffCard.tsx`
- Create: `src/lib/tomorrow-handoff.ts`
- Create: `src/lib/today-action-open-state.ts`
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`
- Test: `src/lib/tomorrow-handoff.test.ts`
- Test: `src/lib/today-action-open-state.test.ts`

- [ ] **Step 1: 新建 handoff 本地状态 helper**

在 `src/lib/tomorrow-handoff.ts` 定义：

```ts
export type TomorrowHandoffLocalState = {
  dismissed: boolean
  clicked: boolean
}
```

并实现：
- `buildTomorrowHandoffStorageKey({ userId, dateBucket, recommendationId })`
- `readTomorrowHandoffState(key)`
- `writeTomorrowHandoffDismissed(key)`
- `writeTomorrowHandoffClicked(key)`
- `emitTomorrowHandoffEvent({ name, payload, dedupeKey? })`
- `pickYesterdayHandoffCandidate(...)`
- `pickTargetActionId(...)`

`emitTomorrowHandoffEvent(...)` 的硬规则：
- 内部固定顺序为 `logEvent(name, payload)` -> `sendAIFeedback(name, payload)`
- 只允许 `dedupeKey` 用于 `ai_tomorrow_handoff_exposed`
- 若提供 `dedupeKey`，先查 `sessionStorage`；已存在则直接返回 `false`
- 首次发送时先写入 `sessionStorage`，再执行双写，上层据此知道本次是否真的发出了事件
- `dedupeKey` 固定格式：

```ts
`tomorrow-handoff:exposed:${userId}:${dateBucket}:${recommendationId}:${targetActionId ?? 'today_plan'}`
```

- [ ] **Step 1.5: 下沉 Today 打开规则为纯函数**

在 `src/lib/today-action-open-state.ts` 实现：
- `resolveInitialOpenAction({ actionIdParam, rescueParam })`
- `resolveInitialPanelMode({ actionIdParam, rescueParam })`
- `resolveInitialView({ initialOpenActionId, shouldFocusByDefault })`
- `resolveInitialRevealState(...)`

`resolveInitialRevealState(...)` 必须返回可直接喂给 `TodayActionList` state 的完整契约，而不是只返回布尔值片段：

```ts
type InitialRevealState = {
  showAllMust: boolean
  showAllOverdue: boolean
  openGoalIds: Record<string, boolean>
  expandedGoalIds: Record<string, boolean>
  completedOpen: boolean
  scrollTargetId: string | null
}
```

判定规则固定为：
- 目标 action 落在 `must` 且索引超出 `maxMust` 时，`showAllMust = true`
- 目标 action 落在 `overdue` 且索引超出 `maxOverdue` 时，`showAllOverdue = true`
- 目标 action 落在 goal 分组时：
  - `openGoalIds[goalId] = true`
  - 若索引超出 `maxPerGroup`，则 `expandedGoalIds[goalId] = true`
- 目标 action 已完成时，`completedOpen = true`
- 只要命中目标，`scrollTargetId = initialOpenActionId`

- [ ] **Step 2: 新建 `TomorrowHandoffCard` 客户端组件**

组件职责：
- 接收服务端传入的候选数据、目标 action、`todayDateBucket`、`userId`
- 读取 `localStorage`
- 若当天已 dismiss，则不渲染
- 若真正渲染，则只发送一次 `ai_tomorrow_handoff_exposed`
- 必须渲染 `candidate.title`
- CTA 点击时：
  - 有 `targetActionId` 则跳到 `/today?action=<id>#today-actions`
  - 否则跳到 `/today#today-ai-plan`
- 点击/关闭时写入本地状态

点击与关闭的顺序也写死：
- CTA 点击：
  1. `writeTomorrowHandoffClicked(key)`
  2. `emitTomorrowHandoffEvent({ name: 'ai_tomorrow_handoff_click', ... })`
  3. 延迟约 `80ms` 再跳转，和现有 `TrackedEventLink` 保持一致
- dismiss：
  1. `writeTomorrowHandoffDismissed(key)`
  2. `emitTomorrowHandoffEvent({ name: 'ai_tomorrow_handoff_dismiss', ... })`
  3. 再把组件本地可见性设为 `false`

- [ ] **Step 3: 补文案**

新增键：

```json
"tomorrowHandoffTitle": "昨天你完成了 AI 核心行动",
"tomorrowHandoffBody": "今天继续下一步，会更容易保持节奏。",
"tomorrowHandoffCTA": "继续明日第一步",
"tomorrowHandoffDismiss": "先不显示"
```

英文同步补齐。

- [ ] **Step 4: 在 `today/page.tsx` 接入承接卡**

放置位置：
- 固定放在 `StreakFeedbackBanner` 下方、`streak risk banner` 上方

接入条件：
- `candidate !== null`
- `!hasCompletedCoreToday`
- `targetActionId !== null || canFallbackToTodayPlan === true`

- [ ] **Step 5: 运行 diagnostics**

对新文件与 `today/page.tsx` 跑 diagnostics，修掉类型和 unused import。

### Task 3: `?action=` 协议与列表自动展开

**Files:**
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/components/TodayActionList.tsx`
- Modify: `src/components/ActionItem.tsx`
- Modify: `src/lib/today-action-open-state.ts`

- [ ] **Step 1: 明确 `action` 与 `rescue` 参数优先级**

规则：
- `action` 优先于 `rescue`
- 当 `action` 生效时，`initialPanelMode = 'view'`
- 当只有 `rescue` 时，维持现有 `initialPanelMode = 'rescue'`
- 只有真实 `rescue` 路径命中时才渲染 `RescueEntryTracker`
- `?action=` 路径不得产生 `ai_rescue_click`

- [ ] **Step 2: 让 `TodayActionList` 自动展开父容器**

新增最小能力：
- 命中 action 在 goal 分组时，自动展开对应 `goalId`
- 命中 action 在 completed 区时，自动展开 completed 区
- 页面初次渲染后滚动到目标项
- 存在 `initialOpenActionId` 时强制默认进入 `focus` 视图`
- 不把 `initialOpenActionId` 透传给 `ActionListFilter`，避免扩大实现面

这里不靠多个 `useEffect` 临时拼状态，固定按下面的契约实现：
- `TodayActionList` 先基于现有 `focusModel` 计算各 section / group 中目标 action 的位置
- 再调用 `resolveInitialRevealState(...)` 一次性生成：
  - `showAllMust`
  - `showAllOverdue`
  - `openGoalIds`
  - `expandedGoalIds`
  - `completedOpen`
  - `scrollTargetId`
- 上述返回值直接作为对应 `useState` 的初始值，避免首屏先折叠后展开的闪动
- `ActionItem` 顶层容器增加 `data-action-id={action.id}`
- `TodayActionList` 新增一次性滚动 effect：
  - 只在首次命中 `scrollTargetId` 时执行
  - `requestAnimationFrame` 后通过 `document.querySelector('[data-action-id="..."]')` 定位
  - `scrollIntoView({ block: 'center', behavior: 'smooth' })`
- 若目标项不存在 DOM 锚点，不做兜底 rescue 行为，也不产生额外埋点

- [ ] **Step 3: 保持 `ActionItem` 的自动打开兼容**

不改已有 rescue 行为，只确保：
- `initialOpen=true`
- `initialPanelMode='view'`
时，普通详情面板会自动打开

同时补上最小 DOM 契约：
- `ActionItem` 根节点必须稳定携带 `data-action-id`
- 该属性只用于滚动定位，不参与业务判断

- [ ] **Step 4: 手动检查 3 条路径**

检查：
- `/today?action=<valid-id>#today-actions`
- `/today?rescue=<valid-id>#today-actions`
- `/today?action=<id>&rescue=<id>#today-actions`

期望：
- `action` 优先
- 不触发 rescue 语义
- 目标项可见、父容器已展开
- `?action=` 不产生 `ai_rescue_click`

### Task 4: handoff 事件接入现有 AI feedback

**Files:**
- Modify: `src/app/api/ai/feedback/route.ts`
- Modify: `src/lib/aiFeedback.ts`
- Check: `src/lib/analytics.ts`
- Modify: `scripts/check-ai-funnel.mjs`

- [ ] **Step 1: 扩展白名单**

在 `route.ts` 新增：
- `ai_tomorrow_handoff_exposed`
- `ai_tomorrow_handoff_click`
- `ai_tomorrow_handoff_dismiss`

- [ ] **Step 2: 保持事件字段标准化**

确保 payload 至少包含：

```ts
{
  source: 'today',
  scene: 'tomorrow_handoff',
  entry: 'yesterday_completion',
  recommendation_id,
  goal_id,
  target_action_id?: string | null,
  target?: 'existing_action' | 'today_plan'
}
```

实现时不要在组件里分别手写 `logEvent` / `sendAIFeedback` 三次；统一复用 Task 2 的 `emitTomorrowHandoffEvent(...)`，这样双写顺序和 dedupe 规则只有一个来源。

- [ ] **Step 3: 增强脚本输出（必做）**

增强 `scripts/check-ai-funnel.mjs`，只做原始事件层输出，不碰 `ai_funnel_daily`：
- 显示最近窗口内的 `ai_tomorrow_handoff_*` 原始事件

- [ ] **Step 4: 原始事件手工校验**

执行现有检查命令并确认 handoff 事件已出现：

```bash
npm run check:ai-funnel -- --days=7 --raw-limit=30 --recent-minutes=1440
```

Expected:
- 原始事件里出现 `ai_tomorrow_handoff_exposed`
- 点击后出现 `ai_tomorrow_handoff_click`
- 关闭后出现 `ai_tomorrow_handoff_dismiss`

### Task 5: 收口验证

**Files:**
- Verify: `src/app/(authenticated)/today/page.tsx`
- Verify: `src/components/TomorrowHandoffCard.tsx`
- Verify: `src/components/TodayActionList.tsx`
- Verify: `src/app/api/ai/feedback/route.ts`
- Test: `src/lib/tomorrow-handoff.test.ts`
- Test: `src/lib/today-action-open-state.test.ts`

- [ ] **Step 1: 运行完整构建**

Run: `npm run build`
Expected: PASS

- [ ] **Step 1.5: 运行最小自动化测试**

Run:

```bash
node --test src/lib/tomorrow-handoff.test.ts src/lib/today-action-open-state.test.ts
```

Expected:
- PASS
- 覆盖 3 类规则：
  - 昨天候选唯一选择排序
  - `action` 优先于 `rescue`
  - `initialOpenActionId` 在默认入口下能打开目标项

- [ ] **Step 2: 手工走 4 个关键场景**

场景：
1. 昨天完成 AI core action，今天有同 goal 未完成 core action
2. 昨天完成 AI core action，今天无同 goal action，但 `showAIPlan=true`
3. 昨天完成 AI core action，今天无同 goal action，且 `showAIPlan=false`
4. 同一天 dismiss 后刷新页面
5. 昨天完成多条 AI core action，只选最新一条作为承接来源

Expected:
1. 展示卡片，点击后打开已有 action
2. 展示卡片，点击后滚动到 `#today-ai-plan`
3. 不展示卡片
4. 当天同浏览器不再展示
5. 卡片标题、`recommendation_id`、CTA 目标都指向同一条最新候选

- [ ] **Step 3: 记录上线后观察指标**

上线后观察但不阻塞交付：
- `ai_tomorrow_handoff_exposed`
- `ai_tomorrow_handoff_click`
- `click / exposed`
- handoff 用户 3-7 天窗口的 `returned_next_day`

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/today/page.tsx src/components/TomorrowHandoffCard.tsx src/components/TodayActionList.tsx src/lib/tomorrow-handoff.ts src/app/api/ai/feedback/route.ts src/i18n/zh.json src/i18n/en.json docs/superpowers/specs/2026-06-20-tomorrow-handoff-card-design.md docs/superpowers/plans/2026-06-20-tomorrow-handoff-card-plan.md
git commit -m "feat: add tomorrow handoff card for today plan retention"
```
