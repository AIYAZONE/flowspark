# AI Funnel Validation Panel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/profile/ai-insights` 中增加一个最小可用的 AI 留存漏斗验证面板，让团队能按时间范围观察总入口、Plan/Review/Rescue 链路表现，并按 `source/scene/variant` 查看以事件数和 user-day 数表达的可解释分层结果。

**Architecture:** 复用现有 `ai-insights` 页面作为承载容器，在 `src/lib/ai/analyticsStore.ts` 新增针对 `public.ai_funnel_daily` 的查询与聚合函数，再新增一个轻量展示组件输出漏斗概览卡片和对比表格。第一版严格区分两类口径：总览卡片按 `user_id + event_date` 去重；分层表格只展示维度完整的事件链路，不把 page views 强行塞进 `scene + variant` 行。

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase View (`ai_funnel_daily`), existing analytics components

---

### Task 1: 定义漏斗数据契约与查询函数

**Files:**
- Modify: `src/lib/ai/analyticsStore.ts`

- [ ] 先在文件头部写明指标合同：`views` 口径、`next-day return` 去重规则、为什么分层表不直接使用 page views 作为分母。
- [ ] 新增 `AIFunnelDailyRow`、`AIFunnelOverviewRow`、`AIFunnelBreakdownRow` 类型，字段只覆盖当前 view 已稳定输出的数据。
- [ ] 新增 `getAIFunnelDailyRows({ supabase, userId, options })`，从 `ai_funnel_daily` 读取 7/30/90/all 数据，并支持按 `scene`、`source` 过滤。
- [ ] 在查询函数里做数值清洗，避免 `unknown/null` 直接污染 UI。
- [ ] 为 `ai_funnel_daily` 缺表/缺列增加降级逻辑；若 view 不可用，则返回空数组而不是让 `/profile/ai-insights` 报错。
- [ ] 新增 `getAIFunnelOverview()`，按 `user_id + event_date` 去重后聚合总 page-view days、plan exposed、plan click、plan apply、review exposed、rescue click、next-day return。
- [ ] 新增 `getAIFunnelBreakdown()`，按 `source + scene + variant` 聚合关键链路事件，避免把没有相同维度的 page views 混进同一表行。
- [ ] 明确分层表字段定义：展示 `plan_exposed_user_days`、`plan_apply_user_days`、`review_exposed_user_days`、`rescue_click_user_days`、`returned_next_day_user_days`，不在第一版展示百分比。

### Task 2: 增加漏斗展示组件

**Files:**
- Create: `src/components/AIFunnelOverview.tsx`

- [ ] 定义组件 props：`dict`、`overview`、`locale`。
- [ ] 输出 4-6 个概览卡片，至少包含：访问 user-day、Plan 曝光率、Plan 采纳率、次日回访率。
- [ ] 在帮助文案里明确指标口径，避免把“曝光率”和“采纳率”混淆。
- [ ] 复用现有卡片视觉风格，保持与 `AIAnalyticsOverview` 一致，不另起一套设计语言。

### Task 3: 在 AI Insights 页面接入最小漏斗面板

**Files:**
- Modify: `src/app/(authenticated)/profile/ai-insights/page.tsx`
- Modify: `src/components/AIAnalyticsTable.tsx`

- [ ] 在页面级读取当前 `range` 参数，并复用现有 7/30/90/all 过滤逻辑。
- [ ] 并行请求 `getAIFunnelOverview()` 与 `getAIFunnelBreakdown()`。
- [ ] 在 `AIAnalyticsOverview` 之后插入新的 `AIFunnelOverview` 区块。
- [ ] 复用 `AIAnalyticsTable` 增加一张“source / scene / variant 漏斗对比表”，列至少包含：source、scene、variant、plan exposed user-days、plan apply user-days、review exposed user-days、rescue click user-days、returned next-day user-days。
- [ ] 不在分层表里展示 page views，避免用不一致分母制造伪转化率。
- [ ] 第一版必须同时把 Plan、Review、Rescue 三条链路都展示出来；如果某条链路无数据，显示 `0` 而不是直接省略列。
- [ ] 若漏斗数据为空，显示低干扰 empty state，不影响原有推荐质量分析区块。

### Task 4: 增加漏斗文案与解释

**Files:**
- Modify: `src/app/(authenticated)/profile/ai-insights/page.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

- [ ] 为漏斗区块补标题、描述、列名、空状态文案。
- [ ] 中文文案强调“验证链路”而不是“精准 BI”，避免用户误解为正式数据后台。
- [ ] 英文文案与中文保持同口径，不新增产品承诺。

### Task 5: 验证与回归

**Files:**
- Verify: `src/lib/ai/analyticsStore.ts`
- Verify: `src/components/AIFunnelOverview.tsx`
- Verify: `src/app/(authenticated)/profile/ai-insights/page.tsx`

- [ ] 为漏斗聚合补最小纯函数测试或可复用夹具验证，至少覆盖 user-day 去重与 `returned_next_day` 去重。
- [ ] 运行 diagnostics，修正新引入的类型或语法问题。
- [ ] 手动检查 7/30/90/all 下页面是否都能渲染。
- [ ] 确认无漏斗数据时不会破坏现有 `AIAnalyticsOverview`、`AIAnalyticsTable`、`AIAnalyticsFrictionTop`。
- [ ] 保持本轮改动只读，不新增埋点和数据库写入。
