# AI 分析页可读性重构实施计划

> **For agentic workers:** REQUIRED: 按本计划执行，使用 checkbox 跟踪；先做用户可读性改造，再补技术信息降级，不要把内部字段继续直接暴露到主信息层。

**Goal:** 把 `/profile/ai-insights` 及其场景详情页从“内部 AI 运营看板”调整为“普通用户能看懂、能获得行动意义”的 AI 洞察页。

**Architecture:** 保留现有数据查询链路与页面路由，不改 Supabase 查询结构；在展示层新增“术语映射 + 人话解释 + 技术信息降级”能力，优先改 overview、scene table、detail card 三层 UI。技术字段不删除数据源，只从主路径移到弱化区域或折叠区。

**Tech Stack:** Next.js App Router、TypeScript、现有 `Card` / `Button` UI 组件、现有 `analyticsStore` 数据聚合逻辑、`zh/en` 字典。

---

## Summary

- 目标页面：
  - `/profile/ai-insights`
  - `/profile/ai-insights/[scene]`
- 核心问题：
  - 英文/内部枚举值直接展示，如 `today_plan`、`weekly_insight`
  - 技术字段无解释，如 `phase_c_v1`、`today_plan_v2`、`fallback_rule_v1`
  - 页面结构偏“内部分析台”，缺少“这对我意味着什么”的说明
- 目标结果：
  - 主界面先讲“这类 AI 建议是什么、效果怎么样、最近发生了什么”
  - 技术信息降级到二级信息，不再占据主要视觉层
  - 所有场景、状态、关键字段都有人话化映射与说明

## Current State Analysis

### 1. 页面与组件现状

- `src/app/(authenticated)/profile/ai-insights/page.tsx`
  - 直接把 `scene`、`strategy_version`、`prompt_version`、`model` 渲染进主表格
  - 顶部描述仍使用英文术语：`recommendation / strategy / model`
- `src/app/(authenticated)/profile/ai-insights/[scene]/page.tsx`
  - 场景页顶部标题已做部分场景中英描述
  - 但策略表、模型表、最近记录仍直接展示内部版本名和模型名
- `src/components/AIAnalyticsOverview.tsx`
  - 仅展示总建议数、采纳率、完成率、fallback 占比
  - 没有解释这些指标的意义
- `src/components/AIAnalyticsTable.tsx`
  - 纯表格容器，无术语映射、无说明层
- `src/components/AISceneHeader.tsx`
  - 已有场景标题和描述，但 `fallback` 仍是英文词
- `src/components/AIRecommendationDetail.tsx`
  - 输出详情中仍有大量内部字段和英文标签，如 `Yes/No`、`difficulty`、`risk`、`schema`
  - `strategy_summary` / `quality_labels` 目前更像调试信息而非用户信息

### 2. 数据与术语现状

- `src/lib/ai/analyticsStore.ts`
  - 当前返回的数据足以支持“人话化展示”，无需改查询层
  - `scene`、`strategy_version`、`prompt_version`、`model`、`confidence`、`fallback_used` 等都可在展示层做映射/解释
- `src/lib/ai/coachOrchestrator.ts`
  - 技术字段来源可确认：
    - `strategyVersion`: 如 `phase_c_v1`、`phase_d_v1`
    - `promptVersion`: 如 `today_plan_v3`、`weekly_insight_v1`
    - `model`: 可能为 `fallback_rule_v1`、`deepseek-*`、`openai-*`
- `src/i18n/zh.json` / `src/i18n/en.json`
  - 当前已有 AI 分析页基础文案
  - 但页面描述、字段标题、状态文案仍偏技术化，缺少解释型文案

### 3. 结论

- 当前问题不只是翻译缺失，而是：
  - 信息层级错误
  - 用户目标与页面表达错位
  - 内部实现字段直接上屏

## Assumptions & Decisions

- Audience：默认面向普通终端用户，而不是内部 AI 运营/研发人员。
- In Scope：
  - 概览页与场景详情页的文案、字段映射、信息层级调整
  - 技术信息降级展示
  - 状态/场景/模型/策略的人话说明
- Out of Scope：
  - 不修改 AI 推荐写入逻辑
  - 不新增数据库字段
  - 不重做 analyticsStore 查询
  - 不新增独立后台分析系统
- 已确认决策：
  - `strategy/prompt/model/phase_x_v1` 类技术信息采用“降级展示”
  - 主界面优先展示对用户有意义的信息，不再让版本号充当主内容

## Proposed Changes

### 变更组 1：建立统一的展示映射与解释层

**Files:**
- Create: `src/lib/ai/analyticsPresentation.ts`
- Modify: `src/app/(authenticated)/profile/ai-insights/page.tsx`
- Modify: `src/app/(authenticated)/profile/ai-insights/[scene]/page.tsx`
- Modify: `src/components/AISceneHeader.tsx`
- Modify: `src/components/AIRecommendationDetail.tsx`

**What / Why / How:**

- 新建统一 presentation helper，集中处理：
  - 场景映射：`today_plan` -> `今日建议`，`weekly_insight` -> `周洞察`
  - 状态映射：`Generated / Adopted / Completed / Dismissed / Fallback`
  - 技术名解释：
    - `strategy_version` -> “策略方案（内部版本）”
    - `prompt_version` -> “提示词方案（内部版本）”
    - `model` -> “生成方式”
  - 技术值解释：
    - `fallback_rule_v1` -> `规则兜底`
    - `deepseek-*` / `openai-*` -> `AI 模型`
    - `phase_c_v1` 等版本号 -> 保留原值，但加人话描述或弱化样式
- 所有页面统一调用该 helper，避免同一术语在不同位置翻译不一致。

**实施步骤：**

- [ ] 梳理 `scene / status / model / strategy / prompt / fallback / confidence` 的现有值与映射规则
- [ ] 新建 `src/lib/ai/analyticsPresentation.ts`，实现纯函数：
  - `formatAISceneLabel()`
  - `formatAIStatusLabel()`
  - `formatAIModelLabel()`
  - `formatAIStrategyLabel()`
  - `formatAIPromptLabel()`
  - `formatAIFallbackLabel()`
  - `getAIFieldHelpText()`
- [ ] 在 overview 页与 scene 页替换直接输出的原始值，统一走 formatter
- [ ] 在 detail 页复用同一套 formatter，消除 `Yes/No`、`difficulty`、`risk`、`schema` 等裸字段输出

### 变更组 2：把概览页改成“用户可读”的信息架构

**Files:**
- Modify: `src/app/(authenticated)/profile/ai-insights/page.tsx`
- Modify: `src/components/AIAnalyticsOverview.tsx`
- Modify: `src/components/AIAnalyticsTable.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

**What / Why / How:**

- 顶部说明从技术术语改成人话：
  - 当前：`查看 recommendation、strategy、model 的表现`
  - 目标：强调“查看 AI 建议在哪些场景最有帮助、你最近更容易采纳哪类建议”
- Overview 卡片增加指标解释副文案，避免“采纳率/完成率/兜底占比”只有数字没有意义。
- Scene 表保留为主表：
  - 用中文场景名替代 `today_plan`
  - 增加短说明或副标题，告诉用户每个场景代表什么
- Strategy / Model 表降级：
  - 默认标题改成“生成方式参考”或“系统工作方式”
  - 明确标注“供深入查看，普通使用可忽略”
  - 版本号与 prompt 采用弱化文字，不再作为主链接/主视觉

**实施步骤：**

- [ ] 改写概览页标题区文案，使其围绕“什么建议更有帮助”表达
- [ ] 在 `AIAnalyticsOverview` 为 4 个指标增加 `helpText` 或小字解释
- [ ] 调整概览页表格顺序：先场景表现，再最近记录，最后技术参考
- [ ] Scene 列显示用户名称；若需要保留原始 key，只放在次级灰字中
- [ ] Strategy / Model 表标题、说明、单元格样式弱化，避免用户误以为必须理解这些值

### 变更组 3：把场景页改成“能看懂的一条建议回放”

**Files:**
- Modify: `src/app/(authenticated)/profile/ai-insights/[scene]/page.tsx`
- Modify: `src/components/AISceneHeader.tsx`
- Modify: `src/components/AIRecommendationDetail.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

**What / Why / How:**

- 场景页 header 文案继续保留，但将 `fallback` 改为中文可读表达，如“规则兜底”。
- 最近记录表保留“查看详情”，但详情卡片要从“Recommendation 明细”改为“这次 AI 建议回放”一类的人话标题。
- `AIRecommendationDetail` 分三层：
  - 第一层：这次建议是什么、结果如何、什么时候生成
  - 第二层：用户看到/执行到的关键内容
  - 第三层：技术详情（折叠或弱化块）
- `strategy_summary`、`quality_labels` 不再直接以裸字段展示：
  - 默认折叠或标题标为“技术详情”
  - 字段名改为中文解释
  - 布尔值改为 `是 / 否`

**实施步骤：**

- [ ] 修改 `AISceneHeader` 中含 `fallback` 的说明文案
- [ ] 改写 `AIRecommendationDetail` 的标题、分区标题和字段文案
- [ ] 将 `outputSummary()` 中的内部标签结果统一走 presentation formatter
- [ ] 将 `strategyRows()` / `qualityRows()` 改成解释型标签，且放入低优先级区域
- [ ] 为 `fallback_used`、`confidence`、`option_selected` 做人话化展示

### 变更组 4：文案体系补齐与一致性校验

**Files:**
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

**What / Why / How:**

- 新增/改写以下类型文案：
  - 页面说明
  - 表格标题与副说明
  - 技术详情折叠标题
  - 指标解释
  - 场景说明
  - 状态映射
  - 布尔值与兜底说明
- 保证中英文两套文案语义一致，但中文优先自然表达，不强行直译内部术语。

**实施步骤：**

- [ ] 清点当前 AI 分析页所需所有字典 key
- [ ] 补齐中文文案，优先“人话”
- [ ] 同步补齐英文文案
- [ ] 检查页面中是否仍残留 `recommendation / strategy / prompt / fallback / phase_x_v1` 裸显示

## Verification Steps

- [ ] 打开 `/profile/ai-insights`
  - 确认顶部说明改为用户可理解表述
  - 确认场景名不再显示 `today_plan` / `weekly_insight` 原始 key
  - 确认主信息区不再把 `phase_c_v1`、`today_plan_v3`、`fallback_rule_v1` 当作核心内容展示
- [ ] 打开 `/profile/ai-insights/[scene]`
  - 确认标题、说明、最近记录、详情卡片均为用户可读语言
  - 确认技术信息被降级到次级区域或折叠区域
- [ ] 检查中英文 locale
  - `zh` 下无明显英文漏出
  - `en` 下无中文误混
- [ ] 针对以下值做映射验证：
  - `today_plan`
  - `weekly_insight`
  - `phase_c_v1`
  - `weekly_insight_v1`
  - `fallback_rule_v1`
  - `Generated / Adopted / Completed / Dismissed`
- [ ] 运行检查：
  - `GetDiagnostics` 检查变更文件
  - `npm run lint -- src/app/(authenticated)/profile/ai-insights/page.tsx src/app/(authenticated)/profile/ai-insights/[scene]/page.tsx src/components/AISceneHeader.tsx src/components/AIRecommendationDetail.tsx src/components/AIAnalyticsOverview.tsx src/components/AIAnalyticsTable.tsx src/lib/ai/analyticsPresentation.tsx`

## Notes For Executor

- 不要直接在多个组件里散落写死映射；统一收口到展示 helper。
- 不要删除底层技术字段；只是降级展示，保留排查能力。
- 如果发现 `strategy_summary` / `quality_labels` 字段对普通用户完全无意义，优先折叠，不要继续强化其视觉权重。
