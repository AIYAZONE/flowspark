# Today智能化与策略层实施计划

**Goal:** 补齐 Today / Rescue / Review 的策略层、质量标签与个性化决策。

**Architecture:** 新增 `strategy.ts` 作为显式策略决策层；扩展 recommendation 持久化结构；升级 prompt 输入、fallback 触发条件与 analytics detail 展示。

**Tech Stack:** Next.js App Router、TypeScript、Supabase、现有 AI orchestrator/store、Tailwind。

---

## 文件

### 新增

- `src/lib/ai/strategy.ts`
- `supabase/27_ai_recommendation_quality_labels.sql`

### 修改

- `src/lib/ai/coachOrchestrator.ts`
- `src/lib/ai/phase2a.ts`
- `src/lib/ai/recommendationStore.ts`
- `src/lib/ai/analyticsStore.ts`
- `src/components/AIRecommendationDetail.tsx`
- `src/lib/snapshots.ts`
- `src/i18n/zh.json`
- `src/i18n/en.json`

## 任务

### 1. 新增策略层

- [ ] 新增 `buildTodayStrategy`
- [ ] 新增 `buildRescueStrategy`
- [ ] 新增 `buildReviewStrategy`
- [ ] 输出统一策略摘要与版本号

### 2. recommendation 持久化增强

- [ ] migration 为 `ai_recommendations` 增加 `quality_labels` 与 `strategy_summary`
- [ ] `createRecommendation` 支持写入上述字段

### 3. Today grounding 升级

- [ ] 使用策略层选择 primary goal 与 difficulty mode
- [ ] 把 grounding hints 明确传入 `aiTodayPlan`
- [ ] 合法但低质量时触发 fallback

### 4. Rescue / Review 升级

- [ ] Rescue 接入策略层与质量门
- [ ] Review 接入策略层与质量门
- [ ] 让重复 friction 与 score 更直接影响建议

### 5. Analytics 回放增强

- [ ] recommendation detail 显示 strategy summary 与 quality labels

### 6. 验证

- [ ] `GetDiagnostics`
- [ ] `npm run build`
