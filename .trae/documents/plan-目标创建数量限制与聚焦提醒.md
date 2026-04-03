## Summary
为“创建目标”增加硬性数量上限（仅统计进行中 active 目标，上限=5），并在触发上限时给出善意、可理解的提示，阻止保存。覆盖所有创建入口（/goals/new 全页、路由弹窗、以及 AddActionDialog/SetCoreActionSheet 等复用 NewGoalForm 的入口）。

---

## Phase 1：现状分析（基于代码）
### 创建入口与链路
- /goals/new 全页：`src/app/(authenticated)/goals/new/page.tsx` → `src/components/NewGoalFullPage.tsx` → `src/components/NewGoalForm.tsx`
- 路由级 Modal：`src/app/(authenticated)/@modal/(...)goals/new/page.tsx` → `src/components/NewGoalRouteModal.tsx` → `src/components/NewGoalForm.tsx`
- 其他入口（复用 NewGoalForm + createGoalModal）：
  - `src/components/AddActionDialog.tsx`
  - `src/components/SetCoreActionSheet.tsx`

### Server Actions（真正的创建写入口）
- `createGoal(formData)`：`src/app/(authenticated)/goals/actions.ts`（成功后 redirect /goals）
- `createGoalModal(formData)`：`src/app/(authenticated)/goals/actions.ts`（成功后返回 `{ success:true, goalId, title }`，不 redirect）

### 当前缺口
- NewGoalForm 的 `handleSubmit` 对 server action 的 throw / `{ error }` 返回都没有兜底展示：用户触发错误时不一定能看到清晰提示（例如 invalid_date_range / operation_failed / 未登录）。
- 目标创建没有任何数量限制。

---

## Phase 2：意图与验收标准
### 目标
- 目标创建存在硬限制：进行中（active）目标达到 5 个后禁止新建。
- 触发限制时给出“善意提醒”：说明目标过多会稀释注意力，建议先完成/归档再创建。

### 成功标准（可验收）
- 当 active 目标数 >= 5：
  - /goals/new（全页）点击保存：不创建新目标；表单内出现提示；页面不跳转。
  - /goals/new（路由弹窗）点击保存：不创建新目标；弹窗不关闭；提示可见。
  - AddActionDialog / SetCoreActionSheet 的“先创建目标”流程同样阻断并提示。
- 当 active 目标数 < 5：行为保持不变（成功后走原有 onSuccess / redirect 逻辑）。
- 文案存在中英文 i18n 键，且不输出英文硬编码到 UI。

---

## Phase 3：技术方案（背景 → 约束 → 方案 → 取舍 → 风险 → 建议）
### 背景
目标创建写入口集中在 `createGoal`/`createGoalModal` 两个 server action；同时多个 UI 入口复用 `NewGoalForm`，因此“写侧强制 + 表单统一错误提示”可以一次覆盖所有入口。

### 约束
- 不新增依赖。
- 不改变现有页面路由与主要交互（成功后的 redirect/router.push 保持现状）。
- 需要服务端强制（不能只靠前端禁用，避免绕过）。

### 方案（推荐）
1) **服务端强制限制（hard gate）**
   - 在 `createGoal` 与 `createGoalModal` 写入前增加 count 检查：仅统计当前用户 `status='active'` 的 goals 数量。
   - 若 `count >= 5`：抛出 `new Error('goal_limit_reached')`（两处一致）。
2) **前端统一展示善意提醒（可见、可复用）**
   - 在 `NewGoalForm` 增加 `submitError` state + UI 区域（与 `aiError` 同级/同风格）。
   - `handleSubmit` 中对 submitAction 增加 try/catch：
     - 捕获 throw：按 `error.message` 映射到 `dict.common.errors[message]` 展示
     - 处理 `{ error: string }` 返回（兼容未来/历史行为）
   - 当错误为 `goal_limit_reached`：展示 i18n 文案（含“聚焦”解释），并阻止 onSuccess/后续动作创建。
3) **i18n 文案补齐**
   - 在 `src/i18n/zh.json` 与 `src/i18n/en.json` 的 `common.errors` 下新增 `goal_limit_reached`。

### 取舍
- 优点：改动集中（2 个 action + 1 个表单组件 + i18n），覆盖面大，diff 小；服务端强制可防绕过。
- 缺点：用户只有在点击“保存”时才知道触发限制（不做提前提示，避免扩大改动面）。

### 风险
- 并发边界：极短窗口内并发创建可能导致超限（低概率）。如需“绝对强一致”需 DB 侧约束/事务（本次不做）。
- 统计口径：仅 active；若未来有更多状态，需要同步调整口径与文案。

### 建议
按“写侧强制 + 表单内提示”先落地；若后续需要更友好体验，再考虑在 /goals 页面提前禁用“新建目标”按钮并展示当前 active 计数（属于第二阶段优化）。

---

## Phase 4：具体改动清单（文件级）
### 1) `src/app/(authenticated)/goals/actions.ts`
- 新增常量：`const ACTIVE_GOAL_LIMIT = 5`
- 新增内部 helper：`assertActiveGoalLimit(supabase, userId)`（或内联实现）
  - 查询 `goals` 表中 `user_id=userId AND status='active'` 的数量
  - 达到上限抛 `Error('goal_limit_reached')`
- 在 `createGoal` 与 `createGoalModal` 的 insert 前调用该检查
- （可选小修）把 `createGoalModal` 未登录返回的 `{ error: 'User not authenticated' }` 统一为 `{ error: 'unauthenticated' }` 或改为 throw；并在 NewGoalForm 兼容两种形态

### 2) `src/components/NewGoalForm.tsx`
- 增加 `submitError` state（与 `aiError` 分离）
- `handleSubmit`：
  - 先清空 `submitError`
  - try/catch 包裹 `await submitAction(formData)`
  - 若返回 `{ error }` 或 catch 到错误：设置 `submitError`（优先用 `dict.common.errors[code]`，fallback `dict.common.errors.operation_failed`）
  - 出错时直接 return（不执行后续 draftActions 创建与 onSuccess）
- 在 UI 中新增一段 error 展示区（例如表单顶部或保存按钮上方），样式对齐已有 `aiError` 展示方式

### 3) i18n
- `src/i18n/zh.json`：
  - `common.errors.goal_limit_reached`: 建议文案（示例）“进行中的目标已达到上限（5 个）。目标太多会稀释注意力，建议先完成/归档一些目标再创建。”
- `src/i18n/en.json`：
  - `common.errors.goal_limit_reached`: 对应英文文案

---

## Phase 5：验证步骤
### 本地验证（手动）
1. 登录后创建 5 个 `active` 目标（可用最小字段）。
2. 在以下入口尝试创建第 6 个目标：
   - /goals/new 全页
   - /goals/new 路由弹窗
   - AddActionDialog 的“创建目标”
   - SetCoreActionSheet 的“创建目标”
3. 期望：
   - 不发生目标创建（回到 goals 列表也看不到新增记录）
   - 表单出现 `goal_limit_reached` 的善意提示
   - modal 不会因失败自动关闭
4. 将其中 1 个目标置为非 active（例如 archived），再次创建应成功（用于确认“仅 active 计数口径”）。

### 工具验证
- `npm run lint` 通过（允许现有 warnings，但不引入 errors）
- TS 诊断无新增错误
