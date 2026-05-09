# AI Today Plan Grounding Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `AI 今日核心行动（草案）` 优先基于用户今天/逾期未完成的真实 action 生成建议，而不是仅基于 goal 标题发散。

**Architecture:** 将 `/today` 页面已查到的 action 上下文精简后传给 `AITodayPlanButton` 和 `/api/ai/today-plan`；服务端策略层新增 action 级别 grounding；Prompt 强制优先围绕现有 action 生成 5/10/20 分钟推进建议；前端弹窗展示“基于当前任务”。

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, OpenAI/DeepSeek JSON output

---

### Task 1: 扩展 Today Plan 输入契约

**Files:**
- Modify: `src/components/AITodayPlanButton.tsx`
- Modify: `src/app/(authenticated)/today/page.tsx`
- Modify: `src/app/api/ai/today-plan/route.ts`
- Modify: `src/lib/ai/types.ts`

- [ ] 定义精简的 action context 类型，限定只传 `id/title/description/goal_id/goal_title/type/priority/completed/start_date/end_date`
- [ ] 在 `/today` 页面把已查出的 `actions` 收敛为轻量数组并传给 `AITodayPlanButton`
- [ ] 在按钮组件请求 body 中加入 `actions`
- [ ] 在 API route 中校验和收敛 `actions`，避免把无效字段传给 AI

### Task 2: 构建服务端 action grounding context

**Files:**
- Modify: `src/lib/ai/contextBuilder.ts`
- Modify: `src/lib/ai/types.ts`

- [ ] 为 `CoachContext` 增加 `actionContext` 字段
- [ ] 在 `buildCoachContext()` 中查询近 14 天 open actions / 今日 actions / overdue actions / 最近完成 actions
- [ ] 对 action context 做数量限制和去噪，只保留最相关 3-5 条

### Task 3: 升级 Today Strategy 为 goal + action 双层选择

**Files:**
- Modify: `src/lib/ai/strategy.ts`
- Modify: `src/lib/ai/types.ts`

- [ ] 在策略输出中增加 `selectedActionId` / `selectedActionTitle`
- [ ] 优先从 today/overdue/core actions 中选出一个最应推进的 action
- [ ] 若没有合适 action，再退回现有 selectedGoal 逻辑
- [ ] 将 action grounding 信息写入 `groundingHints`

### Task 4: 改造 Today Plan Prompt 与输出

**Files:**
- Modify: `src/lib/ai/phase2a.ts`
- Modify: `src/lib/ai/phase2aSchemas.ts`
- Modify: `src/lib/ai/coachOrchestrator.ts`

- [ ] 给 `aiTodayPlan()` 增加 `candidate_actions` 输入
- [ ] 更新 prompt：存在 candidate actions 时，core recommendation 必须优先围绕其中一条 action
- [ ] 为输出 schema 增加 `source_action_id` / `source_type`
- [ ] 在 orchestrator 中把 action context 和 strategy.selectedAction* 传给模型

### Task 5: 优化弹窗与 adoption 表达

**Files:**
- Modify: `src/components/AITodayPlanButton.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

- [ ] 在推荐卡片中显示“基于当前任务 / 所属目标 / 建议方式”
- [ ] 如果 recommendation 来源于已有 action，采用 description 首行写明 `Based on: ...`
- [ ] 保持现有 adopt/dismiss 埋点链路不变

### Task 6: 验证与回归

**Files:**
- Verify: `src/app/(authenticated)/today/page.tsx`
- Verify: `src/components/AITodayPlanButton.tsx`
- Verify: `src/lib/ai/*.ts`

- [ ] 运行 lint / build，确保 schema、类型、页面无回归
- [ ] 手动验证：有 today actions 时，推荐明显引用现有 action；无 actions 时，仍退回 goal-based 推荐

