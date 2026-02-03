# 产品 - Phase 2A：AI 留存实验计划（North Star / Guardrails / A-B）

## 背景
- Phase 2A 的目标是把 AI 从“低频生成”迁移到 Today 的高频闭环，通过 Plan/Rescue/Review 形成每日仪式，提升 D7/D30。

## 约束
- 不引入强打扰（默认按钮入口）；不破坏非 AI 流程。
- 现阶段埋点体系较轻（`logEvent` + Vercel Analytics），因此实验设计优先围绕“可观测的行为指标”。

## 方案

## 1) 北极星与指标树（实验视角）

### 1.1 北极星（Phase 2A 推荐）
- **NS1：WAU 中完成 ≥1 个核心行动（type=core）占比**
  - 解释：比“设置核心行动”更接近真实价值达成；也能覆盖 Rescue 的“降难度但仍完成”路径。

### 1.2 代理北极星（当完成事件暂不可用/不稳定时）
- **NS1’：连续 3 天设置核心行动占比**（与现有指标文档一致）

### 1.3 关键分解指标（为定位因果）
- **触发率**：`ai_today_plan_click / dashboard_viewed`、`ai_rescue_click / core_action_viewed`、`ai_review_click / daily_score_area_viewed`
- **采纳率**：`ai_today_plan_apply / ai_today_plan_suggested`、`ai_rescue_apply / ai_rescue_click`
- **完成率**：`core_action_completed / core_action_set`（以及 5 分钟版本完成率）
- **次日回流**：使用 AI 当天 → 次日 `dashboard_viewed` 或 `today_viewed` 占比

### 1.4 护栏指标（必须不变差）
- **稳定性**：关键动作失败率（createAction、toggleAction、submitScore）
- **性能**：Dashboard/Today 页面 TTFB/LCP（Vercel Analytics 可看趋势）
- **成本**（如接入 LLM）：人均日调用次数、P95 响应时间、错误率
- **满意度信号**：Review 关闭未采纳率、AI 生成后立即退出率（可用 `*_dismiss` 代理）

---

## 2) A/B 实验矩阵（最小可验证）

### A/B1：Today 是否默认露出“一键核心行动（AI）”
**假设**
- 默认露出能显著提升 Plan 触发率与核心行动完成率，从而提升 D7。

**分组**
- A（Control）：仅手动入口（现有“规划今日行动”）
- B（Treatment）：新增 “AI 给我一个今日核心行动（草案）” 且在无核心行动时默认高可见

**主要指标**
- Plan 触发率、Plan 采纳率、核心行动完成率、D7 留存

**护栏**
- 页面退出率（按钮曝光导致反感）
- AI 调用失败率/响应时间（体验变慢）

### A/B2：Review 1 问 vs 2 问
**假设**
- 1 问降低摩擦提升参与率；2 问提升质量但可能降低参与率。需要找最优点。

**分组**
- A：1 个问题（优先选择题）
- B：2 个问题（第二问用于阻力标记）

**主要指标**
- Review 参与率（`ai_review_generated / ai_review_click`）
- 次日回流率（review 当天 → 次日回流）
- 明日核心行动完成率（若能归因）

**护栏**
- Review 放弃率（`ai_review_dismiss`）

### A/B3：护盾（Streak Protect）开关（建议在 Phase 2A 后半段再开）
**假设**
- 允许以 5 分钟最小行动保连续性，可降低断更后弃用，提升 D30。

**分组**
- A：无护盾
- B：每周 1 次护盾（可见、可控）

**主要指标**
- 断更后回流率、D30、连续性分布（streak histogram）

**护栏**
- 价值稀释：平均每周完成行动数是否显著下降

---

## 3) 实验开关与分流策略（不新增依赖的前提）

### 3.1 分流单位
- 以 `user_id` 为单位（避免同一用户跨组污染）。

### 3.2 分流算法（建议）
- `bucket = hash(user_id + experiment_key) % 100`
- 例如 `bucket < 50` 进入 A，`>= 50` 进入 B。

### 3.3 开关落地（两套方案）
**最佳实践（推荐）**
- 新增 `feature_flags`（或 `experiments_assignments`）表，由服务端读取，支持灰度与回滚。

**次优方案（更快）**
- 用环境变量控制全量开关（例如 `NEXT_PUBLIC_AI_TODAY_PLAN_ENABLED`），先跑“上线前后对比 + cohort”验证方向，再补齐真正 A/B。

---

## 4) 数据字典（实验需要的关键事件）
说明：现有事件命名偏 `snake_case` 且 payload 未类型化；本实验优先统一新增 AI 相关事件，保持“触发→建议→采纳→完成”的链路闭合。

### 4.1 事件（建议最小集合）
- `ai_today_plan_click`
- `ai_today_plan_suggested`
- `ai_today_plan_apply`
- `ai_rescue_click`
- `ai_rescue_apply`
- `ai_review_click`
- `ai_review_generated`
- `ai_review_dismiss`

### 4.2 归因字段（建议）
- `source`：`dashboard | today | goal_new | goal_detail`
- `variant`：`A | B`
- `option`：`5m | 10m | 20m`
- `reason`：`no_time | too_hard | anxiety | unclear_next | low_energy | other`

---

## 5) 判定规则（Go / No-Go）

### 5.1 两周 MVP 的“方向性通过”
- Plan 触发率提升（相对提升 ≥20%）且核心行动完成率不下降。
- Review 参与率提升（相对提升 ≥15%）且次日回流不下降。
- 护栏不变差：关键动作失败率无显著上升，页面性能无明显退化。

### 5.2 风险提示
- 样本不足时不要追求显著性；先看漏斗方向与质控（输出合格率/采纳率/完成率）。
- AI 质量波动会掩盖实验效果，必须同时观测“输出校验失败率/重写率”。

