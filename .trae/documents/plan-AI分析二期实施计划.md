# AI分析二期实施计划

> **For agentic workers:** REQUIRED: Use `executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 AI 分析系统补齐 scene 下钻、recommendation 明细回放与结果解释能力。

**Architecture:** 在现有 `/profile/ai-insights` 总览页基础上，新增 `scene` 详情路由和 recommendation detail 组件。数据层继续基于 `ai_recommendations`、`ai_recommendation_outcomes` 与现有 `analyticsStore` 聚合，避免引入新的核心业务表。

**Tech Stack:** Next.js App Router、TypeScript、Supabase、现有 AI analytics service/store、Tailwind、现有 UI 组件。

---

## 文件结构

### 新增

- `src/app/(authenticated)/profile/ai-insights/[scene]/page.tsx`
  - 场景详情页，承接 scene 下钻
- `src/components/AISceneHeader.tsx`
  - 场景页头部与返回入口
- `src/components/AIRecommendationDetail.tsx`
  - recommendation 结构化详情卡/面板

### 修改

- `src/app/(authenticated)/profile/ai-insights/page.tsx`
  - scene 表与 recent recommendations 增加下钻入口
- `src/lib/ai/analyticsStore.ts`
  - 增加 scene detail 与 recommendation detail 读取函数
- `src/components/AIAnalyticsTable.tsx`
  - 支持可点击单元格和更复杂 cell
- `src/i18n/zh.json`
- `src/i18n/en.json`
  - 补场景页、详情页文案

## Task 1: 扩展 analyticsStore

**Files:**
- Modify: `src/lib/ai/analyticsStore.ts`

- [ ] 新增 `AIRecommendationDetailRow` 类型
- [ ] 新增 `getRecommendationDetail({ supabase, userId, recommendationId })`
- [ ] 新增 `getAISceneDetail({ supabase, userId, scene, days })`
- [ ] 保持与现有 recommendation recent view 和 fallback 查询兼容
- [ ] 让 scene 详情聚合与总览口径一致

**Verification**

- 调用新函数不报类型错误
- `GetDiagnostics` 检查 `analyticsStore.ts`

## Task 2: 新增 recommendation detail 组件

**Files:**
- Create: `src/components/AIRecommendationDetail.tsx`

- [ ] 展示 recommendation 基本信息
- [ ] 按 scene 解析并展示结构化 output 摘要
- [ ] 展示 outcome 状态与 completion / dismiss 信息
- [ ] UI 以卡片形式实现，不显示原始 JSON 噪音

**Verification**

- 组件支持 `today_plan / rescue / review / weekly_insight`
- `GetDiagnostics` 检查新组件

## Task 3: 新增 scene header 组件

**Files:**
- Create: `src/components/AISceneHeader.tsx`

- [ ] 提供 scene 标题、描述、返回总览入口
- [ ] 支持显示当前时间范围标签

**Verification**

- 页面头部可复用，不依赖场景专用逻辑

## Task 4: 新增 scene 详情页

**Files:**
- Create: `src/app/(authenticated)/profile/ai-insights/[scene]/page.tsx`
- Modify: `src/lib/ai/analyticsStore.ts`
- Modify: `src/components/AIAnalyticsTable.tsx`

- [ ] 接收 `[scene]` 路由参数
- [ ] 支持时间范围筛选
- [ ] 展示该 scene 的核心指标
- [ ] 展示 strategy / prompt / model 对比
- [ ] 展示该 scene 的 recent recommendations
- [ ] 默认展示最近一条 recommendation detail

**Verification**

- `/profile/ai-insights/today_plan`
- `/profile/ai-insights/rescue`
- `/profile/ai-insights/review`
- `/profile/ai-insights/weekly_insight`
  页面都能打开并渲染

## Task 5: 增强总览页下钻能力

**Files:**
- Modify: `src/app/(authenticated)/profile/ai-insights/page.tsx`
- Modify: `src/components/AIAnalyticsTable.tsx`

- [ ] scene 指标表第一列支持进入 scene 详情
- [ ] recent recommendations 支持“查看详情/跳场景页”
- [ ] 保持现有筛选与排序逻辑

**Verification**

- 从总览页可以进入任意 scene
- 从总览页可以定位到某条 recommendation 的 scene 详情

## Task 6: 补文案

**Files:**
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

- [ ] 增加 scene 详情页标题文案
- [ ] 增加 recommendation detail 字段文案
- [ ] 增加返回总览、无数据状态文案

**Verification**

- 页面无硬编码中文/英文缺口

## Task 7: 全量验证

**Files:**
- Verify only

- [ ] 跑 `GetDiagnostics` 检查新增/修改文件
- [ ] 跑 `npm run build`
- [ ] 手动检查总览页与 scene 详情页跳转链路

**Expected**

- build 通过
- 总览页 -> scene 详情页 -> recommendation detail 链路成立
