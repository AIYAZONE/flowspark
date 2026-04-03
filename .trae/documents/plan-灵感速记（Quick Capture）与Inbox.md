# /plan：灵感速记（Quick Capture）与 Inbox（方案 1 + 列表 A）

## Summary
- 新增“灵感速记”最小闭环：全局悬浮入口（Speed Dial）→ 速记弹窗（默认一句话，可展开备注+标签）→ 保存到 Inbox → 在 /inbox 里“转为 Action + 归属 Goal”或归档/删除
- 入口形态：与现有移动端右下角“新增行动(＋)”合并为一个 Speed Dial（避免双悬浮按钮抢位）
- 列表入口：Today/Dashboard 各加一个 Inbox 卡片入口，统一跳转到 /inbox 页面处理

## Current State Analysis（基于仓库现状）
- 现有“快速新增”能力：已有 AddActionDialog + createAction（Server Action）闭环，但 createAction 目前强制要求 goal_id + start/end date（不能直接当 Inbox 用）
- 现有数据模型：Supabase 仅有 user_profiles/goals/actions/daily_scores 等表，无 inbox/notes 表
- 现有布局：AuthenticatedLayout 是 server 组件，负责 Sidebar/MobileNavBar；Today 页面在 md:hidden 下有固定右下角＋按钮

## 背景 → 约束 → 方案 → 取舍 → 风险 → 建议（关键决策）
### 决策 1：用独立 Inbox 表，而不是复用 actions/goals
- **背景**：灵感通常不具备“目标归属/日期范围”等字段，但需要先收集再消化
- **约束**：最小可用、低耦合、保持现有 actions/goals 语义不变；RLS 必须完备
- **方案**：
  - A（选定）：新增 public.inbox_items 表（open/archived），后续转 Action 时再补全 goal/date/type/priority
  - B（次优）：复用 actions 表，允许 goal_id/date 为空并用 type 标识 inbox（会污染 actions 语义与筛选）
  - C（次优）：把 inbox 作为 user_profiles JSON（查询/索引/统计都弱）
- **取舍**：A 最清晰、后续扩展（标签/搜索/归档/转化）成本最低；B 最省表但技术债高；C 实现快但很快卡死
- **风险**：需要新增 SQL + RLS + 索引；需要在 UI 上处理“转 Action”流程
- **建议**：按 A 落地

### 决策 2：与“新增行动”合并为 Speed Dial
- **背景**：Today 页已有右下角＋，若再加“灵感”会出现双浮按钮
- **约束**：移动端不遮挡底部导航；交互尽量一致；最小改动
- **方案**：
  - A（选定）：全局一个 Speed Dial，包含「新增行动」「灵感速记」
  - B：保留两个按钮（需要位移/遮挡策略）
- **取舍**：A 最干净；B 最简单但 UI 体验差
- **风险**：需要在 layout 里提供 activeGoals 给 AddActionDialog（会新增一次查询）
- **建议**：A

### 决策 3：转 Action 的默认日期
- **背景**：转化时必须满足 createAction 的必填字段（goal_id/start_date/end_date）
- **约束**：默认要合理，避免“今天塞爆”也避免落入过去
- **方案**：
  - A（选定）：默认 start=今天，end=今天+7 天（你选择）
  - B：默认今天→今天
  - C：强制用户必选
- **取舍**：A 兼顾“快速转化”与“不过载今天”；C 最严谨但最慢
- **风险**：用户可能忘了改日期导致延后
- **建议**：A，并在转化弹窗显示日期可编辑

## Proposed Changes（具体改动点，按文件列出）

### 1) 数据库：新增 Inbox 表 + RLS
- 新增 [07_inbox.sql](file:///Users/brucewang/Documents/AIYA/goals/supabase/07_inbox.sql)
  - 表：public.inbox_items
  - 字段（拟定）：
    - id uuid PK default gen_random_uuid()
    - user_id uuid nullable（兼容）
    - owner_id uuid nullable（主使用）
    - content text NOT NULL（“一句话”）
    - note text DEFAULT ''（展开的备注）
    - tags text[] DEFAULT '{}'（逗号输入后 split）
    - status text DEFAULT 'open' CHECK (status IN ('open','archived'))
    - converted_action_id uuid NULL REFERENCES public.actions(id) ON DELETE SET NULL
    - created_at/updated_at timestamptz DEFAULT now()
  - 索引：
    - (owner_id, status, created_at desc)
    - GIN(tags)（可选，若先不做标签搜索可不建）
- 新增 [08_inbox_rls.sql](file:///Users/brucewang/Documents/AIYA/goals/supabase/08_inbox_rls.sql)
  - ENABLE RLS
  - SELECT/INSERT/UPDATE/DELETE 策略：auth.uid() = user_id OR auth.uid() = owner_id（与 goals/actions 一致）
- 更新 [supabase/README.md](file:///Users/brucewang/Documents/AIYA/goals/supabase/README.md) 顺序说明（新增 07/08）

### 2) 路由：新增 /inbox 页面（server 渲染）
- 新增 [src/app/(authenticated)/inbox/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/inbox/page.tsx)
  - server 端查询：open items（分页/limit 先用 50）
  - 渲染：列表 A（卡片列表 + 行内按钮）
- 新增 [src/app/(authenticated)/inbox/actions.ts](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/inbox/actions.ts)
  - createInboxItem(formData)
  - archiveInboxItem(id)
  - deleteInboxItem(id)
  - convertInboxItemToAction(formData)（内部调用 goals/actions.ts 的 createAction 或复刻其 insert 逻辑；成功后更新 inbox_items.status='archived' + converted_action_id）
  - revalidatePath：/today /dashboard /inbox

### 3) UI：全局 Speed Dial + 速记弹窗 + 转化弹窗
- 新增 [QuickCaptureSpeedDial](file:///Users/brucewang/Documents/AIYA/goals/src/components/QuickCaptureSpeedDial.tsx)
  - 固定右下角按钮（全局），点击展开 2 个动作：
    - 新增行动：复用 AddActionDialog（需要 activeGoals/dict）
    - 灵感速记：打开 QuickCaptureDialog
- 新增 [QuickCaptureDialog](file:///Users/brucewang/Documents/AIYA/goals/src/components/QuickCaptureDialog.tsx)
  - 默认：一句话输入（content）
  - “更多”展开：note（textarea）+ tags（逗号输入）
  - 提交：createInboxItem（Server Action）
- 新增 [ConvertInboxToActionDialog](file:///Users/brucewang/Documents/AIYA/goals/src/components/ConvertInboxToActionDialog.tsx)
  - 预填：title=content；description=note + tags 拼接
  - 必填：goal、start_date（默认今天）、end_date（默认今天+7 天）
  - 可选：type/priority（沿用 AddActionDialog 的选项）

### 4) 列表入口：Today/Dashboard Inbox 卡片
- 新增 [InboxCard](file:///Users/brucewang/Documents/AIYA/goals/src/components/InboxCard.tsx)
  - 展示：未处理数量 + 最近 3 条（content + tags）
  - 点击：跳转 /inbox
- 修改：
  - [today/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/today/page.tsx)：移除当前 md:hidden 的固定右下角＋（由全局 Speed Dial 统一提供）
  - [dashboard/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/dashboard/page.tsx)：加 InboxCard

### 5) Layout：挂载全局 Speed Dial
- 修改 [AuthenticatedLayout](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/layout.tsx)
  - server 端额外查询 activeGoals（仅 select id,title；status='active'）
  - 在 MobileNavBar 旁挂载 QuickCaptureSpeedDial（传 activeGoals + dict）

### 6) i18n：补齐文案
- 修改：
  - [src/i18n/zh.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/zh.json)
  - [src/i18n/en.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/en.json)
- 新增 key（拟定）：inbox.title / inbox.empty / inbox.convert / inbox.archive / inbox.delete / quickCapture.title / quickCapture.more / quickCapture.tagsPlaceholder 等

### 7) 仓库卫生（建议）
- 修改 [.gitignore](file:///Users/brucewang/Documents/AIYA/goals/.gitignore)：加入 `.superpowers/`（避免可视化草图文件被提交）

## Edge Cases & Failure Modes
- 未登录：所有 server actions 直接抛错；页面由 AuthenticatedLayout redirect 兜底
- RLS 拦截：insert/update/delete 必须带 owner_id/user_id；server action 写库时统一写 owner_id=user.id 并兼容 user_id
- 转 Action 失败：inbox item 不应被归档；需要事务一致性（先写 action 成功后再更新 inbox_items）
- 标签解析：逗号分隔需 trim/去空/去重；空输入存 []

## Verification（执行时的验收步骤）
- 数据库：
  - SQL 执行后，能在 supabase 里看到 inbox_items 表，RLS 启用且策略生效
- 功能路径：
  - 任意登录页面右下角 Speed Dial → 灵感速记 → 保存后 /inbox 可见
  - Today/Dashboard 的 InboxCard 显示未处理数量，并可跳转 /inbox
  - /inbox 点击“转为行动”→ 选择 Goal + 日期 → 创建成功后：
    - actions 表新增记录
    - inbox_items.status 变为 archived，converted_action_id 写入
    - Today 列表能看到新 action（视日期范围与筛选逻辑）
- 工程质量：
  - `npm run lint`、`npm run typecheck`（或仓库现有等价命令）

