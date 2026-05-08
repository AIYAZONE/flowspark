# AI原生系统架构 v1 后续执行路线

## Summary

- 目标：基于当前仓库真实落地情况，给出 `技术 - 20 AI原生系统架构设计 v1` 的后续执行顺序，优先补齐高价值闭环，再推进统一编排和长期记忆。
- 结论：当前项目已完成 `Goal Setup AI`、`Today Plan recommendation tracking` 和部分 completion 闭环，但仍处于“Phase A 部分完成，Phase B/C 未开始或未打通”的状态。
- 建议执行顺序：
  1. 先补完 `Today/Rescue/Review` 的统一建议闭环。
  2. 再抽离统一 `Coach Orchestrator + Context Builder`。
  3. 再补 `growth profile / behavior snapshots / friction events`。
  4. 最后做 `weekly insight` 与更强实验层。
- 说明：外部链接 `https://solo.trae.ai/session/69fd9332e12d55aadbfb7c76` 当前无法直接读取会话正文，本计划仅基于本地仓库与现有文档判断。

## Current State Analysis

### 已经落地的部分

- AI 基础能力已存在：
  - `src/lib/ai/phase2a.ts`
  - `src/lib/ai/phase2aSchemas.ts`
  - `src/lib/ai/phase2aQuality.ts`
- Goal Setup 两阶段已落地：
  - `src/app/api/ai/goal-setup/step-a/route.ts`
  - `src/app/api/ai/goal-setup/step-b/route.ts`
  - `src/components/NewGoalForm.tsx`
- Today Plan 已有统一入口雏形：
  - `src/lib/ai/coachOrchestrator.ts`
  - `src/app/api/ai/today-plan/route.ts`
- recommendation 持久化与采纳/完成/dismiss 已落地：
  - `src/lib/ai/recommendationStore.ts`
  - `supabase/18_ai_recommendations.sql`
  - `supabase/19_ai_recommendations_rls.sql`
- completion 回写已部分打通：
  - `src/app/(authenticated)/dashboard/actions.ts`
  - `src/app/(authenticated)/goals/actions.ts`
- 轻量 AI 事件流已存在：
  - `src/app/api/ai/feedback/route.ts`
  - `src/lib/aiFeedback.ts`
  - `src/lib/analytics.ts`

### 尚未完成或只完成一半的部分

- `Coach Orchestrator` 目前只覆盖 `today_plan`，还不是真正的统一编排层：
  - `src/lib/ai/coachOrchestrator.ts`
- `Context Builder` 尚未落地，当前 Today 上下文仍在 `planToday()` 内部临时拼装：
  - 缺失文件：`src/lib/ai/contextBuilder.ts`
- `Rescue / Review` 仍直接调用 `phase2a`，未写入 `ai_recommendations`，也未进入统一策略层：
  - `src/app/api/ai/rescue/route.ts`
  - `src/app/api/ai/review/route.ts`
- `Today` 还不是 AI 主入口，AI 今日建议仍主要放在 Dashboard 卡片：
  - `src/components/DailyPlanningCard.tsx`
  - `src/app/(authenticated)/dashboard/page.tsx`
  - `src/app/(authenticated)/today/page.tsx`
- 长期用户记忆和行为聚合表均未落地：
  - 缺失表：`user_growth_profiles`
  - 缺失表：`user_behavior_daily_snapshots`
  - 缺失表：`user_friction_events`
- `weekly_insight` 只有类型和 scene 预留，没有实现：
  - `src/lib/ai/types.ts`
  - `supabase/18_ai_recommendations.sql`

### 当前最关键的架构判断

- 现在最像“Phase A 的产品验证版”，不是“AI 原生统一系统”。
- 现阶段最不该先做的是：
  - 直接上向量记忆
  - 直接上 weekly insight 页面
  - 继续新增零散 AI route
- 现阶段最该先做的是：
  - 把所有高频 AI 场景都纳入统一 recommendation 生命周期
  - 让 `Today` 成为 AI 决策默认入口
  - 让后续个性化所需的数据表先稳定沉淀

## Assumptions & Decisions

### 背景

- 文档目标是把 FlowSpark 从“有 AI 的目标工具”推进到“AI 原生教练系统”。
- 当前仓库已经具备 Phase 2A 的一部分能力，但产品主闭环和架构主闭环都还没打全。

### 约束

- 继续沿用当前 `Next.js App Router + Supabase + OpenAI Compatible` 架构。
- 不做大规模目录重构，优先在现有文件组织上演进。
- 保持已有 API 路径兼容，先做服务层统一，再决定是否收口 route。
- 不引入新依赖，除非后续做计划任务或 `pgvector` 时确有必要。

### 方案

- 执行节奏按四段走：
  - Sprint 1：补完高频闭环
  - Sprint 2：收拢统一编排
  - Sprint 3：补长期记忆数据层
  - Sprint 4：加 insight 与实验增强

### 取舍

- 先补闭环，再补智能度：这样更快看到采纳率/完成率提升。
- 先做结构化数据，再做向量记忆：这样成本更低、调试更容易。
- 先把 Today 做成默认入口，再扩入口：避免 AI 能力散落。

### 风险

- 如果直接做 `Context Builder + 数据表`，但不先补产品入口，价值感知会偏弱。
- 如果继续保留 `Rescue / Review` 旁路实现，后续 recommendation 数据会断层。
- 如果过早做 insight，可能出现“总结很多，但闭环价值没提升”的偏差。

### 建议

- 默认按本计划执行；若你在外部 solo session 已经实现了其中某一块，再把差异贴给我，我可以把计划快速重排。

## Proposed Changes

## Phase 1：补完高频 AI 闭环

### 目标

- 让 `Today Plan / Rescue / Review` 全部具备统一 recommendation 记录能力。
- 让 `Today` 页而不是 `Dashboard` 成为 AI 主入口。

### 具体文件与变更

#### 1. 扩展统一 recommendation 生命周期到 Rescue / Review

- Modify: `src/lib/ai/coachOrchestrator.ts`
  - 做什么：把当前仅有的 `planToday()` 拆成 scene-aware orchestrator，新增 `planRescue()`、`planReview()`。
  - 为什么：避免 `rescue/review` 继续绕过 recommendation store。
  - 怎么做：
    - 抽出 scene 共有字段：`scene`、`strategyVersion`、`promptVersion`、`model`、`fallbackUsed`
    - 统一返回 `CoachApiResponse<T>`
    - 在生成成功后统一写 `createRecommendation()`

- Modify: `src/app/api/ai/rescue/route.ts`
  - 做什么：不再直接调 `aiRescue()`；改为调 orchestrator 中的 rescue 方法。
  - 为什么：让 rescue 进入统一 recommendation 记录。
  - 怎么做：
    - 保持入参与返回兼容
    - 返回 `recommendationId`

- Modify: `src/app/api/ai/review/route.ts`
  - 做什么：不再直接调 `aiReview()`；改为调 orchestrator 中的 review 方法。
  - 为什么：让 review 同样进入 recommendation 记录。
  - 怎么做：
    - 保持当前前端消费字段兼容
    - 返回 `recommendationId`

- Modify: `src/components/ActionItem.tsx`
  - 做什么：接收 rescue 的 `recommendationId` 并在“应用替换/新增”时写 adopt。
  - 为什么：目前只有事件埋点，没有 recommendation outcome 闭环。
  - 怎么做：
    - 调用 `/api/ai/recommendations/[id]/adopt`
    - 传 `optionSelected='5m'`
    - 替换/新增成功后关联 `actionId`

- Modify: `src/components/ScoreCard.tsx`
  - 做什么：接收 review 的 `recommendationId`，在用户关闭结果、忽略、或后续采纳明日方向时记录 dismiss/adopt。
  - 为什么：review 目前只有事件，没有 recommendation 生命周期。
  - 怎么做：
    - MVP 先做 `generated/dismissed`
    - 若当前没有“采用明日建议”动作，可先只补 recommendation 生成与 dismiss

#### 2. 把 Today 变成 AI 主入口

- Modify: `src/app/(authenticated)/today/page.tsx`
  - 做什么：增加 Today 顶部 AI 推荐区或内嵌推荐卡。
  - 为什么：当前文档目标要求 Today 成为主战场，但入口仍放在 Dashboard。
  - 怎么做：
    - 复用 `DailyPlanningCard` 的 AI 交互逻辑，拆出可复用的 `TodayPlanCard` 或 `useTodayPlan`
    - 优先放在 Today 顶部，位于行动列表上方

- Modify: `src/components/DailyPlanningCard.tsx`
  - 做什么：收敛成可复用逻辑，而不是 Dashboard 专属实现。
  - 为什么：避免同一套 AI Today 逻辑在多处复制。
  - 怎么做：
    - 抽离请求、dismiss、apply 逻辑
    - 保留 Dashboard 二级入口，但 Today 设为主入口

- Modify: `src/app/(authenticated)/dashboard/page.tsx`
  - 做什么：降低 Dashboard 中 AI 建议入口权重。
  - 为什么：保持页面职责清晰，让 Today 成为默认 AI 决策入口。
  - 怎么做：
    - Dashboard 继续保留入口，但文案改为“去 Today 获取今日建议”或弱化为辅助入口

### 验收标准

- `today_plan / rescue / review` 都能写 `ai_recommendations`
- `today_plan / rescue` 至少能写 adopt outcome
- Today 页打开后，用户无需去 Dashboard 也能拿到 AI 建议
- 原有非 AI 路径不受影响

## Phase 2：落地真正的统一编排层

### 目标

- 把上下文拼装、策略判断、模型调用、持久化从 route 中抽离出来。

### 具体文件与变更

#### 1. 新增统一 Context Builder

- Create: `src/lib/ai/contextBuilder.ts`
  - 做什么：实现 `buildCoachContext(scene, userId, supabase)`。
  - 为什么：当前 Today 的上下文散落在 `planToday()` 中，后续 rescue/review 无法复用。
  - 怎么做：
    - 第一版只接结构化数据，不做向量检索
    - 输出接近架构文档中的 `CoachContext`
    - 覆盖 identity/profile/goals/behavior/frictions/recentAI

#### 2. 收敛 orchestrator 结构

- Modify: `src/lib/ai/coachOrchestrator.ts`
  - 做什么：重组为：
    - `buildCoachContext`
    - `decideStrategy`
    - `invokeAgent`
    - `validateAndRepair`
    - `persistRecommendation`
  - 为什么：现在的 `planToday()` 仍是单函数，后续不可扩展。
  - 怎么做：
    - 保留外部 API 兼容
    - scene-specific prompt 仍可继续复用 `phase2a.ts`

- Modify: `src/lib/ai/types.ts`
  - 做什么：补完整的泛型结果类型和 context 类型定义。
  - 为什么：后续 `today_plan/rescue/review/weekly_insight` 需要共享契约。

#### 3. recommendation store 只保留持久化职责

- Modify: `src/lib/ai/recommendationStore.ts`
  - 做什么：保持 CRUD/状态更新，不再承担策略逻辑。
  - 为什么：责任边界要清楚，后续才能扩充 outcome 类型。

### 验收标准

- `today_plan / rescue / review` 均通过同一 orchestrator 入口执行
- route handler 不再包含上下文拼装细节
- orchestrator 可独立单测 scene 输入/输出

## Phase 3：补长期记忆数据层

### 目标

- 为“越来越懂用户”提供结构化基础，而不是继续依赖 `user_profiles.ai_recent_events`。

### 具体文件与变更

#### 1. 新增数据库表

- Create: `supabase/20_user_growth_profiles.sql`
  - 做什么：新增 `user_growth_profiles`
  - 为什么：承载慢变化画像

- Create: `supabase/21_user_behavior_daily_snapshots.sql`
  - 做什么：新增 `user_behavior_daily_snapshots`
  - 为什么：为近 7/30/90 天聚合提供低成本读取

- Create: `supabase/22_user_friction_events.sql`
  - 做什么：新增 `user_friction_events`
  - 为什么：沉淀 Rescue/Review/未完成原因

- Create: `supabase/23_ai_native_memory_rls.sql`
  - 做什么：补以上表的 RLS
  - 为什么：与现有 Supabase 数据策略保持一致

#### 2. 新增写入与聚合服务

- Create: `src/lib/userState.ts`
  - 做什么：读取 growth profile / latest behavior state
  - 为什么：供 context builder 统一使用

- Create: `src/lib/snapshots.ts`
  - 做什么：聚合并写入 daily snapshot
  - 为什么：避免每次 AI 现算

- Modify: `src/components/ActionItem.tsx`
  - 做什么：Rescue 应用时写 friction event
  - 为什么：当前只有轻量事件日志，没有结构化表

- Modify: `src/components/ScoreCard.tsx`
  - 做什么：Review 结果中有 friction 时写 friction event
  - 为什么：为后续个性化和 insight 提供高质量输入

### 验收标准

- `Today` 上下文不再只依赖 `ai_recent_events`
- 能区分最近 7 天高/中/低动量用户
- 能查询到用户主要 friction 标签分布

## Phase 4：做 Weekly Insight 与实验增强

### 目标

- 在闭环和数据层稳定后，再引入更高阶的主动式能力。

### 具体文件与变更

#### 1. 新增周洞察服务

- Create: `src/lib/ai/insights.ts`
  - 做什么：封装 `weekly_insight` scene
  - 为什么：避免继续把能力堆进 `phase2a.ts`

- Modify: `src/lib/ai/coachOrchestrator.ts`
  - 做什么：接入 `weekly_insight`
  - 为什么：保持统一 scene 模式

- Create: `src/app/api/ai/insight/route.ts`
  - 做什么：提供周洞察接口
  - 为什么：独立高价值、低频调用

#### 2. 增强实验与归因

- Modify: `src/lib/analytics.ts`
  - 做什么：把 recommendation 维度字段统一并标准化
  - 为什么：当前事件有，但 recommendation/strategy/model 归因还不完整

- Modify: `src/lib/experiments.ts`
  - 做什么：为 AI 入口/问题数/策略版本提供稳定开关
  - 为什么：支撑后续灰度与 A/B

### 验收标准

- 每周能生成一次可展示的 insight 草案
- 能比较不同策略版本对采纳率/完成率的影响

## Recommended Execution Order

### 第一优先级：本周就做

- `Rescue / Review` 接入 recommendation store
- `Today` 页面增加 AI 推荐主入口
- recommendation 生命周期覆盖 `generated / adopted / dismissed / completed`

### 第二优先级：下一轮做

- 新建 `contextBuilder.ts`
- 重构 `coachOrchestrator.ts` 为真正的 scene orchestration
- 把 route handler 变薄

### 第三优先级：再下一轮做

- 新增 `user_growth_profiles`
- 新增 `user_behavior_daily_snapshots`
- 新增 `user_friction_events`

### 第四优先级：最后做

- `weekly_insight`
- 更强实验分流与版本归因
- 更深层的长期记忆

## Verification Steps

- 静态验证
  - 检查 `src/lib/ai/coachOrchestrator.ts` 是否仅保留 scene orchestration，不再内联大量上下文查询
  - 检查 `src/app/api/ai/rescue/route.ts`、`src/app/api/ai/review/route.ts` 是否返回 `recommendationId`
  - 检查 `Today` 页是否存在 AI 建议入口

- 数据验证
  - 生成 today/review/rescue 建议后，确认 `ai_recommendations.scene` 分别落库
  - adopt/dismiss/complete 后，确认 `ai_recommendation_outcomes` 正确更新
  - 完成 Rescue/Review 后，确认结构化 friction 数据落库

- 产品验证
  - 用户从 Today 一次点击拿到建议
  - 采纳后创建的 action 能立即在 Today 列表可见
  - 完成 action 后 recommendation status 变为 `completed`
  - 关闭 AI 功能开关时，原始非 AI 路径仍可正常使用

## 你现在最应该执行的 3 件事

1. 先把 `rescue/review` 纳入 recommendation 生命周期，不要再让它们做旁路能力。
2. 把 AI 今日建议主入口从 `Dashboard` 移到 `Today`，让产品价值和架构目标对齐。
3. 开始建设 `contextBuilder + snapshots + friction events`，为下一阶段个性化做准备。
