# AI 洞察页的用户价值与闭环实施计划

**Goal:** 解决“AI 洞察到底有什么用”的核心疑问：让普通用户看得懂、看完知道下一步做什么，并提供可落地的反馈入口，形成可进化的 AI 系统闭环。

---

## 1. 现状复盘（基于仓库事实）

### 1.1 这页最初是为“分析/可解释性”做的

在已有文档里，`/profile/ai-insights` 的目标是回答：

- 哪个 scene 更有效
- 哪个 strategy / prompt / model 组合更有效
- 某条 recommendation 为什么出现、最终结果如何

来源：`.trae/documents/技术 - 21 AI分析二期设计.md`

### 1.2 这页天然更像“运营/研发看板”，而不是用户产品

数据字段来自：

- `ai_recommendations`：`scene/strategy_version/prompt_version/model/confidence/status/fallback_used/...`
- `ai_recommendation_outcomes`：`adopted/completed/feedback_label/option_selected/completion_minutes`

来源：`supabase/18_ai_recommendations.sql`

这些字段本质是“系统如何工作”和“系统表现如何”，不是用户天然关心的语言。

### 1.3 用户确实“不能推动系统升级”的原因

- 目前有事件上报 `/api/ai/feedback`，但只存 `user_profiles.ai_recent_events` 的最近 60 条事件，且事件白名单主要是 click/view/generate/open_report 等行为事件，并非结构化“好/不好/原因”。  
  来源：`src/app/api/ai/feedback/route.ts`、`src/lib/aiFeedback.ts`
- 目前 outcome 层有 `feedback_label` 字段可写入（没有强校验），但缺少用户侧可理解的反馈入口与说明。  
  来源：`supabase/18_ai_recommendations.sql`

结论：你现在的疑问是合理的——**这页不补“用户价值表达 + 反馈闭环”，对普通用户就像一份内部报表。**

---

## 1.4 对照《技术-20 AI原生系统架构设计 v1》：已做到/未做到

### 目标对照

《技术 - 20》在愿景里明确写了 AI 原生系统要具备：

- 持续理解用户状态
- 主动编排每日推进节奏
- **记录建议效果并自我优化**

来源：`.trae/documents/技术 - 20 AI原生系统架构设计 v1.md` 第 5-12 行

### 目前已经做到的（但属于“可追踪/可解释”，还不算自我优化）

- **结果可追踪**：`ai_recommendations` + `ai_recommendation_outcomes` 已记录建议与部分结果字段。  
  来源：`supabase/18_ai_recommendations.sql`
- **可回放/可分析**：`/profile/ai-insights` + `analyticsStore` 能按 scene/strategy/model 汇总并下钻回放。  
  来源：`.trae/documents/技术 - 21 AI分析二期设计.md`
- **上下文已接入近期结果信号**（弱个性化信号）：`buildCoachContext()` 会读取最近 12 条 AI 的 adopted/completed（`recentAI`），以及摩擦统计（`frictions`）。  
  来源：`src/lib/ai/contextBuilder.ts`
- **失败可降级**：各场景已有 fallback 逻辑与 `fallback_used` 标记（这属于可靠性，不是学习）。  

### 目前没有做到的（你说的“自我优化”缺口，确实存在）

- **没有把“历史结果/反馈”反哺到下一轮推荐决策**：目前 `recentAI` 只作为上下文提供给模型/策略，但系统没有根据这些结果“调整策略权重、调整推荐形式、调整默认变体”。  
- **没有结构化的用户反馈入口**：用户无法用 1-2 次点击告诉系统“为什么不采纳/哪里不贴合”，更谈不上系统自动升级。

结论：你系统当前处于《技术-20》所说的“结果可追踪”阶段，但**还没进入“根据历史结果调整下一轮推荐”的自我优化阶段**。

---

## 2. 技术决策（强制格式）

### 2.1 决策：这页服务谁？

**背景**：字段大量为内部系统字段（版本号/策略/模型），普通用户看不懂，且看懂也难行动。  
**约束**：不新增复杂后台 BI；优先复用现有数据表与写入链路；不大改 AI 生成逻辑。  
**方案**：
- 默认给普通用户的“我的 AI 洞察”（用户语言 + 行动建议）
- 保留“技术详情”作为折叠区/次级信息（用于排障与迭代）
**取舍**：牺牲一点“全量可见”，换取“默认可理解”。  
**风险**：部分高级用户可能想看全部技术字段。  
**建议**：默认用户视角 + 技术详情降级（必要时再加“开发者模式”开关）。

### 2.2 决策：AI 洞察要不要形成“可进化闭环”？

**背景**：用户认为“看了也不能让系统升级”，导致这页没有意义。  
**约束**：短期不做复杂在线学习；必须可控、可解释、可回滚。  
**方案**：
- 先做“结构化反馈收集 + 个性化偏好写入”（可控升级）
- 再做“基于反馈的策略选择/提示词选择”自动化（可度量升级）
**取舍**：短期不会让模型立刻变强，但能让系统“更贴合用户”。  
**风险**：反馈太重会降低使用率。  
**建议**：反馈入口做成 1-2 次点击完成（thumb + 原因标签）。

---

## 3. 目标与验收标准（面向普通用户）

### 3.1 用户侧价值（必须能一句话说明白）

用户打开 `/profile/ai-insights` 后能得到：

- “哪类 AI 建议对我最有效”（按场景/生成方式）
- “我为什么不采纳”（阻力标签统计 + 提示）
- “我下一步怎么用 AI 更省事”（给 1 条可执行建议）

### 3.2 验收标准

- 页面顶部有“这页是干什么的”的一句话说明（中文自然表达）
- 场景/状态/阻力/置信度/兜底都用用户语言展示（不露内部 key）
- 技术字段存在但降级（折叠区/灰字），不抢主内容
- 用户能对单条建议做反馈：
  - 有用/没用
  - 没用原因（标签）
  - 反馈写入 `ai_recommendation_outcomes.feedback_label`
- 后续可用这些反馈做个性化：至少能在策略层读到并影响推荐（最小闭环）

---

## 4. 实施方案（按阶段拆分，避免大改）

### Phase A：定位与解释（不改数据层）

**目标**：让用户知道这页“对我有什么用”。  
**改动点**：
- 在概览页增加“你能从这里得到什么”的解释卡片
- 在场景页增加“这个场景是什么”的说明（已有 `AISceneHeader`，补更用户化表述）
- 把技术表格标题改成“技术参考（可忽略）”，并加说明文案

**涉及文件（已存在）**
- `src/app/(authenticated)/profile/ai-insights/page.tsx`
- `src/app/(authenticated)/profile/ai-insights/[scene]/page.tsx`
- `src/components/AISceneHeader.tsx`
- `src/i18n/zh.json`
- `src/i18n/en.json`

### Phase B：结构化反馈闭环（轻量、可控）

**目标**：用户能给系统“提意见”，并可用于后续自动优化。  
**方案**：
- 在单条建议回放（`AIRecommendationDetail`）加入 2 个动作：
  - 👍 有用（feedback_label = `useful`）
  - 👎 没用（弹出原因标签：`no_time`/`not_fit`/`too_hard`/`already_planned`/`other`）
- 反馈写入 `ai_recommendation_outcomes.feedback_label`（无需迁移，字段已存在）
- 同时继续上报 `/api/ai/feedback`（用于行为分析，但不是主闭环）

**涉及文件（存在/需新增路由）**
- `src/components/AIRecommendationDetail.tsx`（新增 UI 与调用）
- `src/app/api/ai/recommendations/[id]/feedback/route.ts`（新增：写 feedback_label）
- `src/lib/ai/recommendationStore.ts` 或新建 `src/lib/ai/outcomeStore.ts`（封装 upsert outcome）
- `src/i18n/zh.json` / `src/i18n/en.json`（反馈文案与标签）

### Phase C：最小“自动升级”（策略层个性化）

**目标**：让用户感知“系统在变贴合”。  
**方案**：
- 在构建 coach context / strategy 决策时，读取近 N 条 `feedback_label` + adopted/completed
- 生成一个 **UserPreferenceSignals**（纯规则、可回滚）：
  - `prefers_short`：用户更常采纳 5m/10m 还是 20m
  - `low_trust_scene`：哪个 scene 采纳率长期偏低
  - `top_reject_reason`：最常见的“没用原因”
- 在 `strategy` 选择时引入权重（不改 prompt 结构）：
  - 对低信任场景，优先给“更低摩擦版本/更短版本”
  - 对 `top_reject_reason = not_fit` 的场景，优先给更贴合 goals/actionContext 的策略分支
- 把变化透明化：在洞察页展示一句“系统最近根据你的反馈做了什么调整”（避免黑箱）

**涉及文件（存在）**
- `src/lib/ai/contextBuilder.ts`（已做上下文聚合，可加反馈摘要）
- `src/lib/ai/strategy.ts`（策略选择，可接入偏好信号）
- `src/lib/ai/coachOrchestrator.ts`（把偏好信号纳入 inputSummary）

---

## 5. 风险与控制

- 风险：反馈入口太多导致用户烦  
  - 控制：只放在“单条回放”里，且不强制
- 风险：反馈噪声大  
  - 控制：先做“个性化策略权重”这种软影响，不做自动改 prompt 直写
- 风险：用户期待“模型立刻变聪明”  
  - 控制：在 UI 明确说明：这是个性化与节奏优化，不是模型训练

---

## 6. 验证步骤

- 本地：`npm run lint`、`npm run build`
- 手动验收：
  - 打开 `/profile/ai-insights`：能用一句话讲清用途
  - 点击进入 `/profile/ai-insights/weekly_insight`：看到“回放 + 反馈”
  - 提交反馈后刷新：反馈状态可见（按钮置灰/展示已反馈）
  - 数据库检查：`ai_recommendation_outcomes.feedback_label` 发生变化
