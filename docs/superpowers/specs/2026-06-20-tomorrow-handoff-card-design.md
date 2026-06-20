# 明日承接卡（Today Plan 次日回流增强）设计

## Summary
- 目标：把 `Today Plan` 从“今天完成”继续推进到“明天为什么还回来”，用最小实现验证 `completed -> returned_next_day` 是否能被拉升。
- 本次范围：
  - 只在 `Today` 页新增一张轻量 `明日承接卡`。
  - 只围绕“昨天完成过 AI 已采纳核心行动（`type='core'`）”的用户展示。
  - 只提供 1 个主 CTA，不引入复杂分支与新流程。
- 约束：不新增依赖；不新增通知系统；不做新 DB migration；复用现有 `Today Plan / actions / ai_recommendation_outcomes`。本批次不要求把 handoff 曝光/点击接入 `ai_funnel_daily` 聚合视图。

## Background
- 已确认的增长结论：
  - `Today Plan` 已跑通 `apply -> core_action_set -> core_action_completed`。
  - 当前真实短板从“今天能不能完成”切换为“完成后第二天会不会回来”。
- 当前问题：
  - 用户完成 AI 核心行动后，系统缺少一个明确的“明天接什么”的承接点。
  - 现有 `returned_next_day` 只会被动统计，没有主动引导。
- 已确认的用户方向：
  - 下一步不走 `Review` 主线，也不切回 `Rescue` 主线。
  - 优先用 `明日承接卡` 承接 `Today Plan`。

## Goals（成功标准）
- 用户在完成 AI 已采纳行动后的次日进入 `Today` 页时，能立刻看到：
  - 昨天你已经完成了什么。
  - 今天最自然的下一步是什么。
  - 只有一个明确 CTA：继续今天的第一步。
- 验收层面能够回答：
  - 明日承接卡是否被展示。
  - 明日承接卡是否被点击。
  - 这批用户的 `returned_next_day` 是否开始抬升。

## Non-goals（不做）
- 不新增独立通知、push、cron 或 email 提醒。
- 不把承接卡同步铺到 `Dashboard`。
- 不生成复杂“明日完整计划”。
- 不新增新的 AI 生成接口；优先复用现有 `Today Plan` 最短路径。

## 用户路径

### 完成当天
1. 用户完成一条带 `ai_recommendation_id` 的行动。
2. 现有 `AICompletionToast` 继续负责“今天已完成”的即时反馈。
3. 不额外写入“明日承接上下文”；次日直接由服务端按“昨天完成的 AI core action”现算。

### 次日进入
1. 用户进入 `Today` 页。
2. 服务端先计算“是否存在候选 handoff 记录”；客户端再结合本地 dismiss 状态决定是否真正展示 `明日承接卡`。
3. 用户点击主 CTA 后，进入最短承接路径：
  - 若今天已有同 `goal_id` 的未完成 core action，则直接打开该 action。
  - 否则滚动到现有 `Today Plan` 区块。

## 展示条件

### 必须同时满足
- 昨天存在至少 1 条：
  - `ai_recommendation_outcomes.completed = true`
  - `ai_recommendation_outcomes.updated_at` 落在用户本地时区的“昨天”
  - 关联到的 `actions.ai_recommendation_id = recommendation_id`
  - 关联 action 的 `type = 'core'`
- 今天不存在任何 `completed = true and type = 'core'` 的 action，避免卡片在“今天已经收口”后继续打扰。

### 多候选时只选 1 条
- 如果昨天完成了多条 AI core action，则固定选择：
  - `ai_recommendation_outcomes.updated_at desc`
  - 若相同则 `id desc`
- 该唯一候选同时用于：
  - 卡片标题文案
  - `goal_id / recommendation_id`
  - CTA 跳转目标选择
  - handoff 埋点字段

### 不展示的情况
- 用户昨天没有完成 AI 已采纳行动。
- 用户今天已经完成核心行动。
- 用户手动关闭过当天的承接卡。
- 不存在可用承接目标：
  - 今天没有同 `goal_id` 的未完成 core action
  - 且 `showAIPlan = false`，无法回退到 `Today Plan`

## 数据来源与最小状态

### 服务端来源
- 不复用当前 `Today` 页“今天相关 actions”结果，因为现有结果会把已完成延迟 action 再过滤到“今天更新”，无法可靠得到“昨天完成”。
- 单独补一段 yesterday query，并复用 `Today` 页现有的时区判断方式。
- `ai_recommendation_outcomes` 只按 `user_id` 查询，不走 `owner_id` fallback，因为该表没有 mixed-schema 兼容需求。
- 关联 `actions` 时再继续沿用现有 mixed-schema 兼容策略。
- 先从 `ai_recommendation_outcomes` 读取昨天完成的 recommendation，再关联 `actions` 取展示字段。
- 关联优先级：
  - 优先使用 `ai_recommendation_outcomes.action_id`
  - 仅当 `action_id` 为空时，才回退到 `actions.ai_recommendation_id = recommendation_id`
- 通过昨天完成的 AI core action 读取：
  - `title`
  - `id`
  - `goal_id`
  - `ai_recommendation_id`
  - `ai_recommendation_outcomes.updated_at`

### 客户端最小状态
- 使用轻量 `localStorage` 记录：
  - 当天是否已关闭承接卡
  - 当天是否已点击承接卡
- 不新增数据库表，也不存储跨天 handoff context；先验证行为是否值得放大。
- dismiss 只在当前设备/浏览器当天生效，这是本批次刻意接受的最小实现取舍。
- key 采用 `userId + today(date_bucket) + recommendationId` 组成，其中 `today` 由服务端按用户配置时区计算后透传，保证本地状态与业务日口径一致。

## 卡片内容

### 信息结构
- 标题：昨天你完成了 AI 核心行动
- 说明：今天继续下一步，会更容易保持节奏
- 辅助信息：展示昨天完成的 action 标题，帮助用户想起上下文
- 主 CTA：继续明日第一步
- 次操作：关闭（弱化为 `x` 或文字关闭）

### 文案原则
- 不谈技术细节，不出现 recommendation / variant 等内部词。
- 不给多个选择，避免用户重新进入决策负担。
- 强调“连续性”和“下一步”，而不是“重新计划一整天”。

## CTA 行为

### 推荐路径
- 首选：如果今天已存在带相同 `goal_id` 的未完成 core action，则：
  - 选择排序第一条候选 action 作为唯一目标：
    - `priority` 高优先
    - 同优先级下 `start_date/end_date` 更早优先
    - 再按 `id` 稳定排序
  - 通过明确协议 `?action=<id>#today-actions` 打开该 action，而不是只按 `goal_id` 模糊高亮
  - `TodayActionList` 必须自动展开命中 action 所在的父容器：
    - 若在目标分组内，则自动展开该 goal 分组
    - 若在已完成区，则自动展开 completed 区
    - 再滚动到命中 action 并以 `view` 模式展开
- 兜底：只有在 `showAIPlan = true` 时，才回退到现有 `Today Plan` 区块 `#today-ai-plan`
- 如果 `showAIPlan = false` 且不存在合适 action，则不展示承接卡，避免把用户带到不存在的目标

### 为什么这样做
- 先复用已有 action，减少重新生成的摩擦。
- 没有可延续 action 时，只在 `Today Plan` 实际可见时才回退到现有入口，不新增自动生成或预填协议，保持实现最小。
- 单独引入 `action` 查询参数，而不复用 `rescue`，避免混淆“普通查看/承接打开”和“救援模式”。

## 埋点与验收口径

### 新增事件
- `ai_tomorrow_handoff_exposed`
  - 标准字段：`source='today'`, `scene='tomorrow_handoff'`, `entry='yesterday_completion'`, `goal_id`, `recommendation_id`
- `ai_tomorrow_handoff_click`
  - 标准字段同上，额外可带 `target='existing_action' | 'today_plan'`, `target_action_id`
- `ai_tomorrow_handoff_dismiss`
  - 标准字段同上

### 为什么需要新事件
- 仅看 `returned_next_day` 不够，无法区分：
  - 用户回来了但没看到卡
  - 看到了卡但没点
  - 点了卡但没进入有效承接路径

### 验收口径
- 第一层：卡片可观测
  - `exposed / click / dismiss` 都可被回传并落到原始事件里
  - `exposed` 只在客户端真正渲染卡片后发送，不能在服务端“存在候选记录”时提前记
  - 同一页面生命周期内只发送一次 `exposed`
- 第二层：行为闭环
  - 点击卡片后，用户能进入已有 action 或 `Today Plan`
- 第三层：上线观察指标
  - `returned_next_day` 在该路径上开始出现正向变化

## 实现边界

### 需要改动
- `src/app/(authenticated)/today/page.tsx`
  - 单独查询“昨天已完成 AI core action”的服务端数据
  - 支持读取 `action` 查询参数并把目标 `actionId` 透传给列表
- `src/components`
  - 新增 `TomorrowHandoffCard` 或等价轻组件
  - 新增卡片关闭/点击的轻状态 helper
  - 客户端根据 dismiss 状态决定是否真正渲染，并在渲染后发送 `exposed`
- `src/lib/analytics.ts`
  - 复用已有事件发送接口，不改公共协议
- `src/app/api/ai/feedback/route.ts`
  - 补白名单，支持 3 个新事件名
- `scripts/check-ai-funnel.mjs`
  - 可选增强原始事件输出，帮助验收 handoff 事件是否开始出现；本批次不强依赖 `ai_funnel_daily` 新增聚合列

### 暂不改动
- `Dashboard`
- `Review`
- `Rescue`
- 数据库 schema

## Acceptance Criteria（验收标准）
- `Today` 页仅对“符合 yesterday-completion 条件、未在当前设备当天 dismiss、且存在可用承接目标”的用户展示明日承接卡。
- 点击卡片后，能进入一条明确的承接路径：
  - 已有 action 则通过 `?action=<id>#today-actions` 打开对应 action
  - 无 action 则滚动到 `Today Plan`
- 关闭卡片后，当天不再重复打扰。
- 新增事件 `ai_tomorrow_handoff_exposed / click / dismiss` 可被回传与落库到原始事件。
- 不新增依赖；不改数据库 schema；`npm run build` 通过。

## Post-launch Metrics（上线后观察，不作为开发验收阻塞）
- `ai_tomorrow_handoff_exposed`
- `ai_tomorrow_handoff_click`
- `ai_tomorrow_handoff_click / ai_tomorrow_handoff_exposed`
- 被圈中的 user-day 在 3-7 天窗口内的 `returned_next_day`

## Risks & Mitigations
- 条件过宽导致卡片打扰：
  - 增加“今天已完成则不展示”与“当日 dismiss 不再展示”。
- 圈选用户使用了错误时间源：
  - 不用 `actions.updated_at`，统一改为 `ai_recommendation_outcomes.completed + updated_at` 作为“昨天完成”时间依据。
- CTA 仍然让用户重新思考：
  - 保持单一 CTA，不提供多分支选择。
- 看得到卡片但效果不明显：
  - 先用最小实现验证；若 `returned_next_day` 仍不动，再考虑把承接卡扩到 `Dashboard` 或增加“明日第一步预填”强度。
