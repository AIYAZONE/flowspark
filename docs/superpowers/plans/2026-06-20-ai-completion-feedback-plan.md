# AI Completion Feedback Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 AI 已采纳行动补上完成后的即时反馈，提升 `Today Plan` 从 `core_action_set` 到 `core_action_completed` 的闭环概率。

**Architecture:** 复用现有 `sessionStorage + window event` 的轻反馈模式，新建一个全局 `AICompletionToast`，在用户把带 `ai_recommendation_id` 的行动从未完成切到已完成时推送反馈。完成数据仍由既有 `toggleActionWithReward` 和 `setRecommendationCompletion(...)` 落库，不新增数据库结构和主流程分支。

**Tech Stack:** Next.js App Router, React Client Components, TypeScript, existing authenticated layout and action toggles

---

### Task 1: 新建 AI 完成轻反馈组件

**Files:**
- Create: `src/components/AICompletionToast.tsx`

- [ ] 定义 `AICompletionFeedback` 载荷，最小字段只包含 `title` 和 `createdAt`。
- [ ] 复用 `sessionStorage + EventTarget` 模式，保持与 `XpFeedbackToast` 一致。
- [ ] 输出轻 toast：标题强调“已完成 AI 核心行动”，副文案强调“系统会用这次完成继续优化推荐”。
- [ ] 让 toast 自动消失，不阻断现有页面交互。

### Task 2: 在全局布局接入反馈组件

**Files:**
- Modify: `src/app/(authenticated)/layout.tsx`

- [ ] 引入 `AICompletionToast`。
- [ ] 将其挂在认证布局里，与 `XpFeedbackToast` 并存。
- [ ] 调整位置避免与 XP toast 完全重叠。

### Task 3: 在完成动作成功后触发反馈

**Files:**
- Modify: `src/components/ActionItem.tsx`
- Modify: `src/components/ActionListCompact.tsx`

- [ ] 在 `toggleActionWithReward` 成功后，仅当 `!action.completed && action.ai_recommendation_id` 时触发 `pushAICompletionFeedback(...)`。
- [ ] 不在取消完成或普通行动上触发该反馈。
- [ ] 不修改现有 XP、streak、reward 分支顺序，只在成功完成后追加 AI 反馈。

### Task 4: 补齐文案与验证

**Files:**
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`
- Verify: `src/components/AICompletionToast.tsx`
- Verify: `src/components/ActionItem.tsx`
- Verify: `src/components/ActionListCompact.tsx`
- Verify: `src/app/(authenticated)/layout.tsx`

- [ ] 新增中英文 toast 标题与说明文案。
- [ ] 跑 diagnostics，修正类型与样式问题。
- [ ] 运行 `npm run build` 确认通过。
- [ ] 手动验证：完成一条 AI 已采纳行动后，页面顶部出现 AI 完成反馈。
