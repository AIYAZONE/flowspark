# 计划：人生项目向导（蓝图 + 计划 + 记忆）

## Summary
- 新增一个独立入口的“人生项目向导”（Wizard），把用户的模糊想法先结构化成“项目蓝图”，再生成可执行计划，并在最终确认后导入为现有系统中的「路径(Goal)+行动(Actions)」。
- 向导生成过程允许调用现有“系统画像/行为记忆”（growth profile、自我模型、近期采纳/完成/摩擦等）来个性化建议，确保更像一个真正的 Life OS / Agent。

## Current State Analysis（基于仓库现状）
- 目标创建已支持 AI 两阶段拆解（Step A 澄清 / Step B 生成草案），入口在 [NewGoalForm.tsx](file:///Users/ht-2502/Documents/My-Code/flowspark/src/components/NewGoalForm.tsx)，API 在：
  - [goal-setup/step-a](file:///Users/ht-2502/Documents/My-Code/flowspark/src/app/api/ai/goal-setup/step-a/route.ts)
  - [goal-setup/step-b](file:///Users/ht-2502/Documents/My-Code/flowspark/src/app/api/ai/goal-setup/step-b/route.ts)
- 系统已具备“AI 原生记忆/画像”能力与落库：
  - growth profile 等表：`user_growth_profiles / user_behavior_daily_snapshots / user_friction_events`（见 `supabase/20~23`）
  - “自我模型”生成： [self-model.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/self-model.ts)
  - Coach 上下文拼装（读取画像/行为/摩擦/近期 AI 信号）：[contextBuilder.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/ai/contextBuilder.ts)
- 当前 onboarding 更偏“引导去创建目标”，无独立“前期梳理/项目规范化”入口（Dashboard Stage0 仅展示 Hero）。
- 数据模型层面目前只有 goals/actions 的核心结构（见 [00_init_tables.sql](file:///Users/ht-2502/Documents/My-Code/flowspark/supabase/00_init_tables.sql#L18-L56)），尚无“项目蓝图/向导会话”类表；但已有可参考的会话快照表：`potential_sessions`（见 [13_potential_sessions.sql](file:///Users/ht-2502/Documents/My-Code/flowspark/supabase/13_potential_sessions.sql)）。

## Intent & Decisions（已在对话中确认）
- 入口范围：独立“人生项目向导”，而非仅嵌入目标创建页。
- 产出：蓝图 + 计划（推荐方案）。
- 个性化：允许使用现有系统画像/记忆信号（推荐方案）。
- 交互形态：混合（对话收集信息 + 结构化卡片归档 + 末尾预览编辑）。
- 落地方式：两步确认（末尾预览页确认后再创建 Goal + Actions）。

## Proposed Changes

### 1) 新增路由与页面（Wizard UI）
- 新增路由组（建议）：
  - `src/app/(authenticated)/wizard/page.tsx`：入口页（解释向导价值、展示最近向导记录/继续上次、开始新向导）
  - `src/app/(authenticated)/wizard/new/page.tsx`：新建向导（对话 + 结构化归档 + 生成按钮）
  - 可选：`src/app/(authenticated)/wizard/[sessionId]/page.tsx`：继续某一次向导会话（便于“记忆系统”持续迭代）
- 新增组件（建议放 `src/components/`，命名与现有一致）：
  - `ProjectWizardShell`：玻璃化壳层（沿用项目 Premium Life OS 材质语言）
  - `ProjectWizardChat`：对话区（收集信息、逐轮追问）
  - `ProjectWizardMemorySidebar`：实时结构化归档卡片（“我理解的你/项目”）
  - `ProjectWizardPreview`：蓝图+计划预览与编辑、以及“导入为路径”确认

### 2) 新增 AI 场景：Project Wizard Step A/B
复用 Goal Setup 的成熟模式（严格 JSON 输出 + 解析校验 + 单次修复）：
- 复用 LLM 调用： [ai/client.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/ai/client.ts)
- 复用修复器： [phase2aQuality.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/ai/phase2aQuality.ts)（`generateWithSingleRepair`）
- 新增 schema + parse（参照 [phase2aSchemas.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/ai/phase2aSchemas.ts) 的“非 zod、硬约束解析器”风格）：
  - `src/lib/ai/projectWizardSchemas.ts`
    - `ProjectWizardBriefInput`：用户当前描述（可非常模糊）+ 项目类型（可选）+ 时间范围偏好 + 约束/资源初始值 + locale + today
    - `ProjectWizardStepAOutput`：系统理解摘要 + clarifying questions（带 id/type/options/required）+ missing/阻塞判定
    - `ProjectWizardStepBOutput`：
      - `blueprint`：定位/目标/约束/资源/风险/里程碑/衡量指标/策略等（适配“传统文化 IP 训练营 → IP 打造”这类项目）
      - `plan`：按阶段拆成行动建议（可直接映射为 Goal + Actions）
      - `import_suggestion`：建议创建的 Goal 标题、日期范围、优先级、分类、以及 actions 草案（沿用 `actions` 的 type/priority/minutes 体系）
- 新增 AI 编排函数：
  - `src/lib/ai/projectWizard.ts`：构建 prompt（包含记忆上下文）、调用与解析
- 新增 API 路由：
  - `src/app/api/ai/project-wizard/step-a/route.ts`
  - `src/app/api/ai/project-wizard/step-b/route.ts`

### 3) 个性化记忆注入（把“系统更懂你”落到向导）
目标：向导不只是生成“正确模板”，而是生成“符合你节奏/偏好/摩擦点”的蓝图与计划。
- 新增一个专用的向导上下文拼装器（避免污染 Coach Context）：
  - `src/lib/ai/projectWizardContext.ts`
  - 内容来源（尽量复用现有读取函数）：
    - `getGrowthProfile`（见 [contextBuilder.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/ai/contextBuilder.ts) 的调用方式）
    - `buildSelfModelCards`（见 [self-model.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/self-model.ts)）
    - 近期摩擦 `user_friction_events`（已有表 + RLS）
    - 近期采纳/完成信号（ai_recommendations_outcomes，通过现有 contextBuilder 类似查询方式）
- Prompt 规则（硬规则）：
  - 只输出严格 JSON
  - 不泄露用户隐私字段，不回显任何敏感信息
  - 计划必须“可执行”（避免泛化词，如“提升/优化/努力”等；可借鉴 `isExecutableTitle` 的校验理念）

### 4) 数据库：新增“向导会话/蓝图”持久化表（Memory 的载体）
目标：让向导成为“长期可复用的 Agent 会话”，可继续迭代，并能追溯“为什么系统这么建议”。
- 新增迁移（建议编号 `39_...` 之后，按仓库约定递增）：
  - `supabase/39_project_wizard_sessions.sql`
    - 表：`project_wizard_sessions`
      - `id uuid pk`
      - `user_id / owner_id`
      - `title text`（可为空，Step B 生成后回填）
      - `initial_input text`（用户最初的模糊描述）
      - `answers_json jsonb`（Step A 问答的结构化答案）
      - `blueprint_json jsonb`（项目蓝图）
      - `plan_json jsonb`（项目计划）
      - `import_preview_json jsonb`（映射到 Goal/Actions 的草案，便于前端预览/编辑）
      - `derived_goal_id uuid null`（最终导入后关联创建的 goal）
      - `created_actions_json jsonb default []`（创建的 action ids/标题等）
      - `status text default 'active'`
      - `created_at/updated_at`
    - 索引：`owner_id, created_at desc`
  - `supabase/40_project_wizard_sessions_rls.sql`
    - RLS 策略参照 [14_potential_sessions_rls.sql](file:///Users/ht-2502/Documents/My-Code/flowspark/supabase/14_potential_sessions_rls.sql)

### 5) 导入落地：从“计划草案”创建 Goal + Actions
目标：不破坏现有目标/行动体系，最大化复用。
- 服务端落地建议优先复用现有 server actions：
  - `createGoal/createAction` 已在 [goals/actions.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/app/(authenticated)/goals/actions.ts) 被使用（见 [NewGoalForm.tsx](file:///Users/ht-2502/Documents/My-Code/flowspark/src/components/NewGoalForm.tsx#L5-L151)）
- 新增一个“导入动作”入口（两种可选实现，最终实现时二选一）：
  - A. Server Action：`src/app/(authenticated)/wizard/actions.ts`（更贴近现有 Goal 创建模式）
  - B. API Route：`src/app/api/wizard/import/route.ts`（更像通用 API）
- 行为：
  - 前端预览页允许编辑：Goal 标题/描述、日期范围、优先级、分类、Actions 勾选与时间安排
  - 用户点击确认后：创建 goal → 批量创建 actions → 回写 `project_wizard_sessions.derived_goal_id/created_actions_json`

### 6) 导航与文案（保证系统一致性）
- Sidebar 增加入口（核心组），并与移动端导航保持一致：
  - [Sidebar.tsx](file:///Users/ht-2502/Documents/My-Code/flowspark/src/components/Sidebar.tsx)
  - [MobileNavBar.tsx](file:///Users/ht-2502/Documents/My-Code/flowspark/src/components/MobileNavBar.tsx)
- i18n 增加字段：
  - [zh.json](file:///Users/ht-2502/Documents/My-Code/flowspark/src/i18n/zh.json)
  - `en.json`
  - 新增 `sidebar.wizard`（中文建议：“向导”或“项目向导”；英文建议：“Wizard”）

### 7) Feature Flag（可控发布）
- 复用现有 feature flag/实验分流基础设施：[featureFlags.ts](file:///Users/ht-2502/Documents/My-Code/flowspark/src/lib/featureFlags.ts)
- 策略：
  - 默认对未开启用户隐藏 Sidebar 入口
  - 路由层也做兜底（未开启则返回 404 或显示“尚未开放”）
  - 实验 key 建议：`project_wizard`

### 8) 埋点与反馈闭环（让系统“越用越懂你”）
- 复用现有埋点工具：
  - `logEvent`（见 [NewGoalForm.tsx](file:///Users/ht-2502/Documents/My-Code/flowspark/src/components/NewGoalForm.tsx#L22-L346)）
  - `sendAIFeedback`
- 事件建议（示例）：
  - `project_wizard_start`
  - `project_wizard_stepA_need_more / project_wizard_stepA_success`
  - `project_wizard_stepB_success`
  - `project_wizard_import_confirm / project_wizard_import_apply`
  - `project_wizard_save_only`

## Assumptions（实现期默认前提）
- 向导目前只需产出“单一主项目”的蓝图与计划（一次向导 = 一个主项目），先不做“一个蓝图拆多条路径”的高级用法。
- 蓝图/计划的编辑器先做轻量：文本字段 + actions 勾选/排序 + 日期范围调整，不做复杂的富文本/可视化甘特图。
- 首版不引入第三方向量库或外部记忆服务；仅使用 Supabase 表作为“原生记忆载体”，保持部署与安全简单。

## Verification Steps（实现后如何验收）
- 数据库：
  - 迁移可在 Supabase 正常执行，RLS 生效（用户只能读写自己的 sessions）
- API：
  - Step A：在输入极其模糊时能返回 `need_more_info` 阻塞并给出高质量问题列表
  - Step B：在信息足够时能生成严格 JSON，且解析器通过；触发一次 repair 也能成功
- UI：
  - 能完成完整闭环：开始向导 → 回答问题 → 生成蓝图+计划 → 预览编辑 → 确认导入 → 在 Goals/Today 可见创建结果
  - 桌面/移动端布局与 Premium Life OS 壳层一致（玻璃材质、渐变描边、克制高光）
- 测试（按仓库现状使用 `node --test`）：
  - schema parse 的单元测试（StepA/StepB JSON 校验、边界值）
  - 导入映射函数的单元测试（actions 时间范围裁剪、必填字段）

