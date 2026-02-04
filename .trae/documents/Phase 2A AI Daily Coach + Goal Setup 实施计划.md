## 背景
- Phase 2A 要把 AI 从“低频拆解”迁移到 Today 高频闭环：Today Plan / Rescue / Review，目标是提升 D7/D30 留存；同时 Goal Setup AI 升级为“两阶段（先澄清→再拆解）”以降低“随意感”。
- 代码现状已具备：
  - 目标拆解 AI v0：/api/ai/breakdown + lib/ai/breakdown.ts（严格 JSON + 容错解析）
  - Dashboard/Today 关键承载点：DailyPlanningCard / ActionItem / ScoreCard
  - 写入路径：server actions（createGoal/createAction/updateAction/toggleAction）

## 约束
- 不破坏现有流程：不用 AI 也能完整创建 goal/action（保持现有组件/接口可用）。
- 两周 MVP：不新增 DB 表；AI 产出仅草案，用户确认后才落库。
- 质量门槛硬执行：信息不足拒绝进入拆解；输出不合格自检重写一次，仍失败则降级为 need_more_info。
- 埋点最小化：payload 不含敏感全文，优先 id/枚举/长度。

## 方案
### 1) AI 输出结构与校验（先打地基）
- 新增一组“schema parser + hard rules validator”工具（不引入新依赖），覆盖：
  - Goal Setup StepA（understanding + clarifying_questions + need_more_info）
  - Goal Setup StepB（actions + success/stop + if_then）
  - Today Plan（recommendations/variants 5-10-20）
  - Rescue（5 分钟最小版本 + if_then）
  - Review（一句总结 + 明日防翻车卡）
- 把“自检重写一次”的逻辑抽成通用 helper：第一次生成失败→把失败原因与硬规则回传→再生成一次→仍失败返回 need_more_info。
- 复用现有 strict JSON/容错解析模式（见 breakdown.ts），避免引入 Zod 等新依赖。

### 2) 新增 Phase 2A AI API Routes（服务端鉴权 + 调用 lib/ai）
- 以“一个能力一个 endpoint”落地（易观测、易埋点、易调参）：
  - POST /api/ai/goal-setup/step-a
  - POST /api/ai/goal-setup/step-b
  - POST /api/ai/today-plan
  - POST /api/ai/rescue
  - POST /api/ai/review
- 每个 route：
  - Supabase 鉴权（复用 /api/ai/breakdown/route.ts 模式）
  - 只接收必要字段（goal brief / action context / answers / locale），做基本校验
  - 调用 lib/ai/* 返回结构化 JSON；错误码延续现有风格（unauthenticated/invalid_json/invalid_ai_output 等）

### 3) Goal Setup AI（NewGoalForm 两阶段交互）
- 在现有“AI 帮我拆解”基础上升级为 PRD 两阶段：
  - StepA：点击按钮→展示理解摘要（目标/约束/阻力/杠杆点）+ 2–3 个澄清问题；若 need_more_info.blocking=true，仅展示最小补充项并阻止进入 StepB
  - StepB：用户回答后生成草案：
    - actions：继续复用现有 draftActions UI（可勾选/编辑）
    - success_criteria / stop_criteria：自动填入表单 textarea（markdown bullet：结果型/过程型、资源/方向），用户可再编辑
    - if-then：写入 actions.description 的可读块（Why/DoD/If-Then），并在 UI 中可见
- 保持“只有点击创建目标才会落库”：现有 createGoal + createAction 循环逻辑保留。

### 4) Daily Coach：Today Plan / Rescue / Review（嵌入现有卡片）
- Today Plan（Dashboard 的 DailyPlanningCard）
  - 新增按钮“AI 给我一个今日核心行动（草案）”
  - 交互：弹出 Sheet/Dialog 展示 1 个核心推荐 + 最多 2 个备选，每个包含 5/10/20 三档（标题/first_step/DoD + 极短理由）
  - Apply：用户选中某档后调用 createAction 创建 type='core' action（goal_id 由 AI 返回；若为空则按 priority/end_date 在本地兜底选一个 goal）
- Rescue（ActionItem 的 core action 详情面板）
  - 在详情 view（Dialog/Sheet）中为未完成的 core action 加入口“我卡住了/太难/没时间”
  - 先让用户选 reason_tag（枚举），再请求 /api/ai/rescue
  - Apply 两条路：
    - Replace：updateAction 替换当前 action 的 title/description（保留日期与 goal_id）
    - Add：createAction 新增一个最小行动（默认 type='maintenance' 以避免出现多个 core；如你更偏好也可让用户选择 core/maintenance）
- Review（ScoreCard）
  - 新增按钮“AI 帮我总结今天 & 给明天策略（草案）”
  - A/B2：通过稳定分流决定问 1 个或 2 个问题（优先选择题）；允许跳过（低确信度）
  - 调用 /api/ai/review 返回：一句总结（<=30 字）+ 明日防翻车卡（risk + if_then + 建议方向）

### 5) Instrumentation + A/B 开关（不新增 DB 表的最小实现）
- 埋点：在关键节点加入 logEvent（触发/建议/采纳/关闭），事件名按 PRD/实验计划：
  - ai_goal_setup_click / stepA_success / stepA_need_more / stepB_success / apply
  - ai_today_plan_click / suggested / apply
  - ai_rescue_click / apply
  - ai_review_click / generated / dismiss
- 分流与开关（两套方案并存，先上次优再补最佳）：
  - 次优（本次实现）：环境变量全量开关 + user_id hash 分桶决定 A/B（不需要 DB）
  - 最佳（后续补齐）：feature_flags 表服务端下发（支持灰度/回滚/运营配置）

## 取舍
- Endpoint 选择“拆开”而不是一个万能 /api/ai/coach：
  - 优点：调试与埋点链路更清晰；失败隔离；更贴合实验漏斗
  - 缺点：文件数会增加，但可控（每个 endpoint 很薄）
- Review 问题生成：
  - 先用“固定题库 + 分流决定 1/2 问”来降低实现复杂度与不确定性；后续再演进为 AI 动态问答。

## 风险
- LLM 输出不稳定：即使 strict JSON 也可能漏字段/超字数/分钟数不合规。
  - 缓解：硬规则校验 + 自检重写一次 + 最终降级 need_more_info。
- createAction 需要 goal_id：Today Plan 若 AI 返回 null 会导致无法落库。
  - 缓解：prompt 约束只能从候选 goal_id 中选择；同时本地兜底选择。
- i18n 键一致性导致构建失败：新增文案需要同步 en/zh（项目已发生过此类失败）。

## 建议（下一步要执行的最小闭环）
1) 先实现“Goal Setup StepA/StepB + NewGoalForm 升级”，确保质量门槛与落库映射成立。
2) 再实现“Today Plan + Apply 创建 core action”，打通每日入口。
3) 最后补“Rescue + Review + 埋点 + A/B2”，形成完整留存闭环。

## 预期改动点（便于你快速 Review）
- 新增/调整：lib/ai 下新增 Phase2A 模块与校验工具；新增 5 个 api/ai 路由
- 修改 UI：
  - NewGoalForm.tsx（两阶段 + 填充 success/stop + if-then）
  - DailyPlanningCard.tsx（新增 AI Plan 入口与展示/应用）
  - ActionItem.tsx（Rescue 入口与 apply 逻辑）
  - ScoreCard.tsx（Review 入口与展示/问答）
- 修改 i18n：en.json + zh.json 增补所需文案键（保持键集合一致）

确认后我会按以上顺序开始落地实现，并在每个 Epic 完成后给你可审的最小 diff 与验证方式。