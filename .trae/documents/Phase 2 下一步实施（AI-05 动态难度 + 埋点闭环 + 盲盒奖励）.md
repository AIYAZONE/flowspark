## 背景
- 目前 Phase 2A 的主链（Goal Setup StepA/StepB、Today Plan/Rescue/Review、A/B1/A/B2 分桶）已落地，功能可用但“动态难度（AI-05）/实验观测闭环/变量奖励（GAME-03/04）”仍是缺口。
- 依据 [产品 - 03 Phase 2 详细执行清单.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/%E4%BA%A7%E5%93%81%20-%2003%20Phase%202%20%E8%AF%A6%E7%BB%86%E6%89%A7%E8%A1%8C%E6%B8%85%E5%8D%95.md#L19-L43) 与 [产品 - 22 Phase 2A AI 留存实验计划.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/%E4%BA%A7%E5%93%81%20-%2022%20Phase%202A%20AI%20%E7%95%99%E5%AD%98%E5%AE%9E%E9%AA%8C%E8%AE%A1%E5%88%92.md#L102-L120)，下一步最“既定计划”且可验证的增量是：
  - AI-05：把用户行为反馈拼成 `recent_context`，影响下一次 Today Plan/Rescue 的输出难度。
  - Instrumentation：把事件从 console 占位升级到可用的 Vercel Analytics 自定义事件，并补齐 A/B 曝光/转化链路。
  - GAME-03/04：先做最小“随机奖励池 + 盲盒动效”，与现有 XP/Level 对齐。

## 约束
- 不新增依赖（现有已包含 `@vercel/analytics` 与 `framer-motion`）。
- 不破坏现有非 AI 流程（继续保持可手动创建/完成 action）。
- 重构保持接口稳定：现有 API/组件 props 尽量不改签名；新增字段保持可选。
- 埋点 payload 不含敏感全文（只用 id/枚举/长度/分组）。

## 方案
### 1) AI-05 动态难度（基础版）
**目标**：把“完成/采纳/卡住”等反馈变成可用上下文，让 Today Plan 更像“教练”：连续完成→轻微拉高挑战；停滞/卡住→生成更简单的启动任务（对齐 [产品 - 20](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/%E4%BA%A7%E5%93%81%20-%2020%20%E5%88%9B%E6%96%B0%E6%BF%80%E5%8A%B1%E4%B8%8EAI%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1.md#L28-L31)）。

**做法**（分两层，先“可用”后“更准”）：
- A. 纯 DB 推导（不新增表/字段，立即可做）
  - 在 `/api/ai/today-plan` 服务端生成 `recent_context`：查询最近 7 天 `actions`（core/maintenance）完成率 + 最近 7 天 `daily_scores` 均值/趋势（如果缺失则为空）。
  - 把 `recent_context` 直接传入 `aiTodayPlan`（已有字段 `completion_rate_7d`，可扩展 `momentum_bucket` 等，但保持可选）。
  - 在 prompt 中加入明确规则：
    - completion_rate 高 → 优先给 10/20 的“略升级版”；
    - completion_rate 低/无完成 → 5 分钟启动任务必须更低摩擦。

- B. 反馈事件持久化（更符合 AI-05 的“接受/拒绝/完成”）
  - **最佳实践**：新增一张 `ai_feedback_events` 表（RLS 保护），记录 `event_name + variant + option + reason_tag + created_at`，可做更强的上下文与实验分析。
  - **次优/更快（推荐先上）**：不新增表，只给 `user_profiles` 增加 1 个 `ai_recent_events jsonb` 字段，保存最近 N 条轻量事件（只存枚举、id、长度、时间）。
  - 新增轻量 endpoint：`POST /api/ai/feedback`（鉴权、白名单 event 名、写入 jsonb 环形数组）。
  - UI 侧在关键节点补发 feedback：
    - Today Plan：`suggested`（展示结果时）、`apply`（创建 action 时）、`dismiss`（关闭不采纳）。
    - Rescue：`click/apply`。
    - Review：`click/generated/dismiss`。
    - Goal Setup：StepA/StepB 的 `success/need_more/apply`。

### 2) Instrumentation（把实验链路闭合）
- 升级 `src/lib/analytics.ts`：
  - 生产环境调用 `@vercel/analytics` 的自定义事件（payload 仅枚举/id/分桶/长度）。
  - 开发环境继续 console 输出（便于本地调试）。
- 补齐 A/B 观测必要事件：
  - 在 Dashboard/Today 的曝光点写 `*_viewed`/`*_suggested`，以及 `variant: A|B`。
  - 在 Apply/Complete 等转化点写 `*_apply`/`core_action_completed`（后者可从 toggleAction 处发）。
- 事件命名与字段对齐文档 [产品 - 22](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/%E4%BA%A7%E5%93%81%20-%2022%20Phase%202A%20AI%20%E7%95%99%E5%AD%98%E5%AE%9E%E9%AA%8C%E8%AE%A1%E5%88%92.md#L105-L120)。

### 3) GAME-03 随机奖励池（先与 XP 系统对齐的最小版）
背景 → 约束 → 方案 → 取舍 → 风险 → 建议（决策格式）
- 背景：Phase 2 P0 要求“随机奖励池 + 盲盒反馈”（[产品 - 03](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/%E4%BA%A7%E5%93%81%20-%2003%20Phase%202%20%E8%AF%A6%E7%BB%86%E6%89%A7%E8%A1%8C%E6%B8%85%E5%8D%95.md#L39-L41)），当前仅有 XP/Level。
- 约束：尽量不加表，先跑通惊喜闭环。
- 方案：
  - 最小版（推荐先上）：奖励池只包含 `bonus XP` + `文案`（common/rare/epic 只影响 bonus 倍率与动画皮肤）；落库复用 `xp_logs`（source='bonus'）即可。
  - 完整版（后续）：补齐 `badges/user_inventory` 等表与掉落物，支持主题/护盾券等。
- 取舍：最小版实现快、风险低，但“收集感”弱；完整版更强但需要更多 DB/UX 设计。
- 风险：随机性过强导致用户困惑/不公平感；需要概率配置可调。
- 建议：先上最小版，并把概率权重做成代码配置（可快速调参）。

### 4) GAME-04 盲盒开箱动画（Framer Motion）
- 新增一个可复用 Dialog 组件（例如 `RewardLootBoxDialog`）：支持 common/rare/epic 三种动效皮肤 + 展示奖励结果。
- 触发时机：完成 action（toggleAction 成功且 nextCompleted=true）后展示。
  - 优先集成到 `ActionListCompact`（已有 client transition，最容易接住“完成后的回包结果”）。
  - 再补 `ActionItem`（当前用 form server action，需改成客户端调用或增加中间层）。

## 取舍
- 动态难度的数据来源：
  - 先用“actions/daily_scores 推导”保证无 schema 变更也能上线；再用 `user_profiles.ai_recent_events` 补齐“拒绝/关闭”信号。
- 盲盒奖励的落库：
  - 先只落 XP（可回滚/可观测），避免库存/徽章表设计把节奏拖慢。

## 风险
- Prompt 行为漂移：难度规则写不清可能导致输出不稳定。
- 事件噪声：没有“曝光/分组”埋点时 A/B 无法解释因果。
- 盲盒动效与 Server Action 的交互：ActionItem 当前 form 提交难以在完成后做即时弹窗，需要局部重构。

## 建议（执行顺序 / 批次）
- 批次 1（P0，最快可验证）：AI-05（DB 推导 recent_context）+ 埋点升级（Vercel Analytics）+ AB 曝光/转化事件闭合。
- 批次 2（P0，增强个性化）：新增 `/api/ai/feedback` + `user_profiles.ai_recent_events`（不新增表）并接入 Today Plan/Rescue/Review/Goal Setup。
- 批次 3（P0，体验增量）：GAME-03（bonus XP 奖励池）+ GAME-04（盲盒动画）先落在 ActionListCompact，再覆盖 ActionItem。

## 预期改动点（便于快速 Review）
- AI-05：
  - [today-plan/route.ts](file:///Users/brucewang/Documents/AIYA/goals/src/app/api/ai/today-plan/route.ts)（生成 recent_context）
  - [phase2a.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/ai/phase2a.ts)（prompt 增强，不破坏现有 schema）
- 埋点：
  - [analytics.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/analytics.ts)（对接 Vercel Analytics + 类型化事件）
  - 相关 UI（DailyPlanningCard/ActionItem/ScoreCard/NewGoalForm）补齐 suggested/apply/dismiss 与 variant 字段
- 盲盒：
  - 新增 `src/lib/rewards/*` 或 `src/lib/gamification-rewards.ts`
  - [dashboard/actions.ts](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/dashboard/actions.ts)（完成后 roll 奖励并 awardXP bonus）
  - 新增 Dialog 组件 + ActionListCompact 集成

## 验证方式
- 本地：`npm run lint` + `npm run build`
- 手工验收：
  - Today Plan：A/B1 分组下曝光→suggested→apply→创建 core action
  - Rescue/Review：click→generated/apply/dismiss
  - 动态难度：连续完成 vs 停滞时，Today Plan 的 5/10/20 档明显“更轻/更重”
  - 盲盒：完成 action 后弹窗出现、bonus XP 计入 LevelCard
