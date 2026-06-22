# Today 主线路径优先执行设计

## Summary
- 目标：让 `Today` 从“知道今天该做什么”升级到“围绕当前最重要的人生主线路径来组织今天的执行层”。
- 本次范围：
  - `TodayActionList` 在现有 `focus` 视图内优先展示当前主线路径相关 action。
  - `AITodayPlanButton` 在本地 fallback goal 选择上优先主线路径。
  - `Today` 页把当前主线路径 id 透传给执行层，不新增新的独立页面与复杂交互。
- 约束：不新增依赖；不改数据库 schema；不改 AI Today Plan API 协议；保持现有 `recent / must / overdue / other / completed` 结构不被推翻。

## Background
- 已完成状态：
  - `You -> AI Insights -> Today` 已打通，系统能解释“为什么这样理解你”。
  - `Today` 已能展示“当前主线路径是什么，以及它为什么重要”。
- 当前问题：
  - 执行层仍然偏“通用任务列表”，没有真正让用户感受到“今天就是围绕这条路径展开”。
  - AI 建议虽然已有目标排序逻辑，但没有显式优先当前主线路径，产品感知仍弱。
- 已确认方向：
  - 第 8 批不再加新的感知层卡片，而是把“主线路径”真正注入 `Today` 的执行排序与建议逻辑。

## Goals（成功标准）
- 用户进入 `Today` 后，能明显感受到：
  - 当前主线路径相关 action 更靠前出现。
  - AI Today Plan 在本地落点兜底时优先回到当前主线路径。
  - 系统是在帮自己推进“人生主线”，不是只是整理一堆待办。
- 工程验收层面能够回答：
  - `TodayActionList` 是否能在不破坏现有分层的前提下优先主线路径。
  - `AITodayPlanButton` 是否会优先选择主线路径作为 fallback goal。
  - `next build` 是否通过且无新增依赖。

## Non-goals（不做）
- 不新增“Main Path Actions”大分区，不重做 `Today` 页信息架构。
- 不修改 `api/ai/today-plan` 的请求协议与服务端推理逻辑。
- 不重构 `Goals` / `Paths` 页。
- 不引入新的埋点事件；先验证体验层是否成立。

## 推荐方案

### 方案 A（本次采用）
- 在现有 `TodayActionList` 内引入 `primaryGoalId` 作为排序偏置：
  - 不打破 `recent / must / overdue / other / completed` 的大框架。
  - 只在同层内对 action 做“主线路径优先”。
- 在 `AITodayPlanButton` 内引入 `preferredGoalId`：
  - fallback 目标优先主线路径。

### 为什么选它
- 风险最低：不推翻现有 `Today` 结构，不会把前几批关于连续性、handoff、rescue 的逻辑冲散。
- 收益直接：用户会在“列表顺序”和“建议落点”两个最关键触点感知系统主线。
- 易于继续演进：后续若效果好，可以自然升级成第 9 批“主线路径独立分区”。

## 用户路径

### 进入 Today
1. 服务端继续计算：
  - 当前主线路径 `primaryPathContext.goalId`
  - 当前节奏判断 `todayPersonalization`
2. `Today` 把 `primaryGoalId` 同时透传给：
  - `TodayActionList`
  - `AITodayPlanButton`

### 查看 Today Action List
1. 用户进入 `focus` 视图。
2. 现有分层保持不变：
  - `recent`
  - `must`
  - `overdue`
  - `other`
  - `completed`
3. `recent` 保持原语义，仍作为“刚创建”分层优先展示。
4. 在基于 `sortedIncomplete` 派生的现有层级里，主线路径 action 会获得排序优先权。
5. `other` 分组中，主线路径对应 group 优先排在第一个。

### 使用 AI Today Plan
1. 用户打开 AI Today Plan。
2. 若 AI 结果需要落到一个 goal，主线路径优先作为 fallback。
3. 若 recommendation 未显式绑定 goal，则优先回落到主线路径，而不是仅按全局 priority 排第一条 goal。

## 排序规则

### TodayActionList 内部排序
- 保留现有 `focusModel` 生成方式：
  - 先基于 `sortedIncomplete` 的 comparator 排序
  - 再从 `sortedIncomplete` 派生 `recent / must / overdue / other`
- 本批次不改变 bucket 生成语义：
  - `recent` 仍先按“刚创建”抽出
  - `must` 仍优先抽走高优先级或 `core`
  - `overdue` 保持当前实现语义，不在本批次额外修正 `must` 与 `overdue` 的历史重叠行为
- 只在现有 comparator 中插入一层 tie-break：
  - overdue 判断之后
  - priority 判断之后
  - `type='core'` 判断之后
  - 日期判断之前
  - 若两条 action 其余条件相同，则 `goal_id === primaryGoalId` 的 action 更靠前
- 最终稳定排序仍保留：
  - 更早日期优先
  - `id` 作为稳定兜底

### other 分组排序
- 现有按 group 内 action 数量排序的逻辑保留。
- 在此之前先判断：
  - 若 group.goalId === primaryGoalId，则该 group 优先

### all 视图
- 本批次不改 `all` 视图过滤体验，只在 `focus` 视图做“主线路径优先”。
- 原因：`all` 视图是面向全量检索，不应过强注入路径偏置，避免用户觉得内容被隐藏。

## AITodayPlan 偏置规则

### Props
- `AITodayPlanButton` 新增可选参数：
  - `preferredGoalId?: string | null`

### 本地 goal 排序
- `candidateGoals` 保持现有结构不变。
- 在 `pickFallbackGoalId()` 中：
  1. 若 `preferredGoalId` 存在且该 goal 仍在候选列表中，优先返回它。
  2. 否则回退到现有 `priority > end_date > title` 逻辑。
- 不调整传给 `/api/ai/today-plan` 的 `candidateGoals` 数组顺序。
- 原因：本批次明确不改变 AI API 的输入排序与服务端推理行为，只调整 recommendation 未绑定 goal 时的本地兜底落点。

### 为什么只做本地偏置
- 不改 API 协议，避免这一批把前后端一起拉动。
- 先验证“围绕主线路径建议”在体验层是否已经足够明显。

## UI 变化

### Today 页面
- 不新增新的大区块。
- 仅在现有 `Today Main Thread` 下的执行层产生顺序变化。
- 可选补一个轻量 micro cue：
  - 当 `TodayActionList` 正在围绕主线路径排序时，在 summary 条下用一句弱提示说明：
    - zh：`已优先围绕当前主线路径排序`
    - en：`Prioritized around your current main path`

### 不做的 UI 改动
- 不把主线路径 action 单独提成新的大卡片。
- 不在每条 action 上额外贴大量“主线”标签，避免界面太吵。

## Implementation Boundaries

### 需要改动
- `src/app/(authenticated)/today/page.tsx`
  - 向 `TodayActionList` 传入 `primaryGoalId`
  - 向 `AITodayPlanButton` 传入 `preferredGoalId`
- `src/components/TodayActionList.tsx`
  - 增加 `primaryGoalId?: string | null`
  - 调整 `focusModel` 排序与 group 排序
  - 可选加入一条弱提示文案
- `src/components/AITodayPlanButton.tsx`
  - 增加 `preferredGoalId?: string | null`
  - 调整 `pickFallbackGoalId()`

### 暂不改动
- `api/ai/today-plan`
- `Goals / Paths` 页结构
- `Today` 的 `all` 视图
- 数据库与 analytics schema

## Acceptance Criteria（验收标准）
- 在 `Today` 的 `focus` 视图里：
  - `recent` 的存在与层级不变。
  - 同等条件下，主线路径 action 比非主线路径 action 更靠前。
  - `other` 分组里，主线路径对应 group 排在前面。
- `AITodayPlanButton` 在 fallback goal 选择时：
  - 若存在 `preferredGoalId` 且该 goal 仍有效，则优先使用它。
- 不破坏现有：
  - `recent / must / overdue / other / completed` 层级
  - `rescue` 行为
  - `tomorrow handoff` 行为
- 不新增依赖；`npm run build` 通过。

## Risks & Mitigations
- 主线路径优先感知仍不够强：
  - 本批先做最小偏置；若用户感知仍弱，再进入下一批做独立主线分区。
- 过强偏置破坏连续性优先逻辑：
  - 主线路径排序只能发生在 overdue / priority / core type 之后，不能覆盖这些安全规则。
- AI 建议仍可能偶尔落到其他路径：
  - 本批接受，因为未改 API 协议；后续若要更强，需要把 `preferredGoalId` 显式传给服务端。
