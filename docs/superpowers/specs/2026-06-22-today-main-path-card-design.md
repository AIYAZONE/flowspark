# Today 独立主线卡设计

## Summary
- 目标：把 `Today` 从“主线路径已经更靠前”升级到“主线路径被单独托起展示”，让用户一眼看到今天真正该推进的人生主线。
- 本次范围：
  - 在 `TodayActionList` 的 `focus` 视图里新增 `Main Path Card`。
  - 该卡只承接原本属于 `other` 分组、且 `goal_id === primaryGoalId` 的 action。
  - 继续复用现有 `ActionItem`，不重做任务卡本身。
- 约束：不新增依赖；不改数据库 schema；不改 `api/ai/today-plan`；不破坏 `recent / must / overdue / other / completed` 的整体结构。

## Background
- 已完成状态：
  - 第 7 批已让 `Today` 能解释“当前主线路径是什么、为什么今天它最重要”。
  - 第 8 批已让 `Today` 的排序和 AI fallback 在执行层优先主线路径。
- 当前问题：
  - 虽然主线路径已经更靠前，但它仍埋在现有分组里，用户需要“看出来”，而不是“被系统明确托起来”。
  - 当前的视觉强化仍是轻量提示，缺乏足够强的系统主线感。
- 已确认方向：
  - 本批次不继续做轻度排序优化，而是新增独立 `Main Path Card`，把主线路径从 `other` 中抽离成一个清晰可见的执行容器。

## Goals（成功标准）
- 用户进入 `Today` 后，能够立刻回答：
  - 今天当前最该推进的是哪条路径。
  - 这条路径下现在有哪些动作可以继续推进。
  - 为什么这些动作被系统单独托起。
- 工程验收层面能够回答：
  - 主线路径 group 是否从 `other` 中被无重复地抽离。
  - `recent / must / overdue / completed` 是否保持原有语义。
  - `ActionItem` 是否继续被原样复用。

## Non-goals（不做）
- 不修改 `ActionItem` 的卡片结构。
- 不修改 `Today` 页上方的 `Today Main Thread` hero。
- 不新增新的 AI 生成、埋点、数据库字段或接口。
- 不处理 `all` 视图，只影响 `focus` 视图。

## 方案比较

### 方案 A（本次采用）
- 从 `other` 中抽出主线路径 group，单独渲染为 `Main Path Card`。
- `other` 中移除该 group，避免重复。
- 复用现有 `ActionItem` 与展开/定位能力。

### 为什么选它
- 感知最强：主线路径不再只是排序靠前，而是变成一个明确的系统容器。
- 风险可控：不碰 `recent / must / overdue`，只重排 `other` 的展示结构。
- 改动集中：主要落在 `TodayActionList` 内部数据拆分与容器渲染。

## 用户路径

### 进入 Today
1. `Today` 页继续计算 `primaryPathContext`。
2. `TodayActionList` 继续接收 `primaryGoalId`。
3. `focusModel.groups` 已经按第 8 批逻辑将主线路径 group 排在前面。

### 渲染 focus 视图
1. 用户先看到原有：
  - `recent`
  - `must`
  - `overdue`
2. 接着看到新增的 `Main Path Card`：
  - 标明当前主线路径标题
  - 展示该路径下可继续推进的 action
3. 最后看到剩余的 `other` 分组与 `completed`。

### 何时不展示 Main Path Card
- `primaryGoalId` 为空。
- `focusModel.groups` 中不存在该 `goalId` 对应 group。
- 该主线路径 group 没有任何可展示 action。

## 数据规则

### 抽取来源
- 只从 `focusModel.groups` 中抽取 `goalId === primaryGoalId` 的 group。
- 不从以下区块重复抽取：
  - `recent`
  - `must`
  - `overdue`
  - `completed`

### 去重原则
- `Main Path Card` 中展示的 action 必须来自原本 `other` 的主线路径 group。
- 抽出后，该 group 必须从 `other` 中移除。
- 本批次只保证 `Main Path Card` 与 `other` 之间不重复；不顺手修复历史遗留的 `must / overdue` 重叠行为。

### 顺序原则
- `Main Path Card` 内部 action 顺序保持该 group 原有顺序，不再额外改排序。
- `other` 中剩余 group 的顺序保持现有逻辑。

## 信息结构

### Main Path Card
- Micro label：
  - zh：`Main Path`
  - en：`Main Path`
- 标题：
  - 直接显示 `primaryPathContext.title`
- 一句话阶段说明：
  - 优先复用 `primaryPathContext.titleText`
- 辅助说明：
  - 短版复用 `primaryPathContext.body`
- Action 列表：
  - 逐条复用 `ActionItem`
- CTA：
  - `进入这条路径`
  - `查看全部路径`

## 展示位置

### focus 视图顺序
- `recent`
- `must`
- `overdue`
- `Main Path Card`
- `other`
- `completed`

### 为什么放在这里
- `recent / must / overdue` 代表更强的系统安全优先级，不能被主线展示覆盖。
- `Main Path Card` 放在 `other` 之前，表示“在处理完风险和必须项后，今天的主线推进层是什么”。

## UI 变化

### TodayActionList
- 新增独立容器样式，但不改整体页面框架。
- 容器视觉应明显高于普通 `other` group，但低于顶部 hero：
  - 可使用更明显的边框、浅主色背景、micro label
  - 不应抢走 `Today Main Thread` 的主视觉地位

### ActionItem
- 不新增 badge
- 不改 hover / details / completion 逻辑
- 继续原样渲染

## Implementation Boundaries

### 需要改动
- `src/components/TodayActionList.tsx`
  - 增加单一对象型 props：
    - `primaryPathContext?: { goalId: string; title: string; titleText: string; body: string; ctaLabel?: string | null } | null`
  - 该对象必须直接来自 `today/page.tsx` 中已计算出的同一个 `primaryPathContext`，禁止分散组装多个字段，避免主线 id 与文案错配。
  - 在 `focusModel.groups` 基础上拆出：
    - `mainPathGroup`
    - `secondaryGroups`
  - 渲染新增 `Main Path Card`
  - `other` 改为只渲染剩余 group
- `src/app/(authenticated)/today/page.tsx`
  - 无新增查询；继续复用并透传现有 `primaryGoalId`
  - 继续把同一个 `primaryPathContext` 直接透传给 `TodayActionList`

### 可选新增
- 若 `TodayActionList.tsx` 内部 JSX 过长，可考虑新增轻量展示组件，例如：
  - `src/components/today/MainPathCard.tsx`
- 前提：只在文件过大或可读性明显下降时才拆。

### 暂不改动
- `src/components/ActionItem.tsx`
- `src/components/AITodayPlanButton.tsx`
- `api/ai/today-plan`
- `all` 视图

## Acceptance Criteria（验收标准）
- `Today` 的 `focus` 视图中新增独立 `Main Path Card`。
- 该卡只展示原本属于 `other` 的主线路径 group。
- 抽出后，主线路径 group 不再在 `other` 中重复出现。
- 本批次不额外承诺修复 `must / overdue` 的历史重叠。
- 当 `primaryGoalId` 为空时，不渲染 `Main Path Card`。
- 当 `focusModel.groups` 中不存在对应主线路径 group 时，不渲染 `Main Path Card`。
- 当主线路径 group 没有可展示 action 时，不渲染 `Main Path Card`。
- `recent / must / overdue / completed` 的存在与层级不变。
- `ActionItem` 仍被原样复用，不新增该组件层级的行为回归。
- 不新增依赖；`npm run build` 通过。

## Risks & Mitigations
- 主线路径 group 为空导致容器尴尬：
  - 明确无内容不展示。
- 容器太强抢走 hero：
  - 视觉层级限制为“高于 other，低于 hero”。
- 代码集中在 `TodayActionList.tsx` 继续变长：
  - 若 JSX 明显膨胀，则只拆一个轻量 `MainPathCard` 子组件，不做额外架构扩展。
