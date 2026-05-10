# 目标进展指标与展示优化（Dashboard）

## 1. 结论（先回答你的问题）

- 当前「目标进展」百分比 **就是按行动完成数 ÷ 总行动数** 计算，并做四舍五入与 0~100 的 clamp：
  - 计算发生在 [dashboard/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/dashboard/page.tsx#L218-L246)：`completed = actions.filter(a => a.completed).length`、`total = actions.length`、`progress = calcCompletionPercent(completed, total)`。
  - 百分比函数在 [progress.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/progress.ts#L1-L5)：`Math.round((completed/total)*100)`。
  - UI 展示在 [GoalProgressList.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/GoalProgressList.tsx#L65-L92)：显示 `completed/total`、`剩余N天`、`xx%` 与进度条宽度。

## 2. 背景 → 约束 → 方案 → 取舍 → 风险 → 建议（关键决策）

### 2.1 决策：Dashboard 的「进展」展示口径

**背景**
- 目前只展示「行动完成率」，对“边做边拆解（总行动不断增加）”的目标会产生误导：完成数在上升，但百分比可能下降。
- 目标存在 `start_date/end_date`，但当前 UI 仅用 `end_date` 展示“剩余N天”，未告诉用户是否“按节奏在推进”。

**约束**
- 不新增依赖。
- 现有数据结构：goals/actions 有 `start_date/end_date/completed/priority/type`；目标成功标准（success_criteria）是文本，无法直接量化。
- Dashboard 卡片需要“扫一眼就懂”（你选择：紧凑 + 剩余项优先）。

**方案**
- 维持主计算口径：`行动完成率 = completed / total`（用于进度条填充）。
- 调整信息层级（展示更友好）：
  1. 主信息突出「剩余 X 项」（而不是只突出 %）。
  2. 次信息展示「已完成/总数」与「剩余N天」。
  3. 若同时存在 `start_date + end_date`，增加一个极简节奏提示：`超前 / 正常 / 落后`（比较行动完成率 vs 时间进度）。

**取舍**
- ✅ 优点：既保留量化（%/进度条）又避免动态拆解误导（剩余项更直观）；节奏提示解决“快慢感”问题。
- ❌ 缺点：节奏提示是启发式（阈值），不是严格预测；当开始日期缺失或不合理时需要降级显示。

**风险**
- 用户对“超前/落后”的理解可能与预期不同（例如目标本就不按线性推进）。
- 目标没设置起止日期时，节奏无法计算，需要清晰降级。

**建议**
- 采用“完成率 + 节奏”的混合方案；默认紧凑展示，节奏仅在日期齐全时出现；无日期或无行动时给出更明确状态（如“待拆解”）。

## 3. 当前状态分析（基于代码现状）

### 3.1 数据来源与计算

- Dashboard 拉取活跃目标并 join actions：`select('..., actions(id, completed)')`  
  见 [dashboard/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/dashboard/page.tsx#L218-L246)。
- 当前 progress 仅与 `actions.completed` 有关，不考虑日期、类型、优先级、子行动。

### 3.2 UI 现状

- 列表项显示：
  - `completed/total 项行动`
  - `剩余N天`
  - 右侧 `xx%`（再次 `Math.round`）
  - 进度条颜色随截止紧急度变化（`getUrgencyProgressColor(daysLeft)`）  
  见 [GoalProgressList.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/GoalProgressList.tsx#L65-L92) 与 [progress.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/progress.ts#L12-L19)。
- 文案提示已写为“基于行动完成率”，见 [zh.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/zh.json#L344-L352)。

## 4. 目标与验收标准（Success Criteria）

### 4.1 目标

- Dashboard 的每个目标卡片项，用户扫一眼能同时回答：
  - 还剩多少要做（剩余项）
  - 大致完成到哪里（完成率）
  - 时间上是否在节奏内（超前/正常/落后）

### 4.2 验收标准

- 任一目标项展示信息满足：
  - 有行动：展示「剩余 X 项」+ 次级信息「已完成/总数」。
  - 有截止日期：继续展示「剩余 N 天 / 已逾期」。
  - 同时有 start_date+end_date：展示节奏标签（超前/正常/落后）并与计算一致。
  - 无行动：不展示误导性的 0% 完成率主文案，改为“待拆解”（或同等含义）。
- 进度条仍按行动完成率填充，视觉一致且不抖动。

## 5. 设计方案（信息架构 + 文案）

### 5.1 列表项信息层级（紧凑版）

每个目标项：
- 第一行：目标标题（不变）
- 第二行（紧凑一行）：
  - 主：`剩余 {remaining} 项`
  - 分隔点
  - 次：`{completed}/{total} 项行动`
  - 若有 end_date：再加一个分隔点 + `剩余 N 天 / 已逾期`
- 右侧数字区：
  - 主：`{progress}%`（保留，方便快速比较）
  - 次：节奏标签（仅当日期齐全）：`超前/正常/落后`（小号 badge/文本）

### 5.2 节奏（Pace）定义

- 时间进度（timeProgress%）：
  - 仅当 `start_date` 与 `end_date` 同时存在且 `end_date > start_date` 才计算。
  - `timeProgress = round( clamp((now-start)/(end-start), 0..1) * 100 )`
- 行动进度（actionProgress%）：沿用现有 `calcCompletionPercent`。
- 节奏差值：`delta = actionProgress - timeProgress`
- 节奏分类（阈值可调，先给稳定默认）：
  - `delta >= +10`：超前
  - `-10 < delta < +10`：正常
  - `delta <= -10`：落后

## 6. 拟修改点（具体到文件）

### 6.1 数据与计算

- [progress.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/progress.ts)
  - 新增 `calcTimeProgressPercent(startDate?: string | null, endDate?: string | null): number | null`
  - 新增 `getPaceStatus(actionProgress: number, timeProgress: number): 'ahead' | 'onTrack' | 'behind'`
  - 新增 `getPaceLabelKey(status): string` 或直接在组件层映射到 i18n key（避免过度抽象）

- [dashboard/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/dashboard/page.tsx#L218-L264)
  - 在 `goalProgressList` map 里计算：
    - `remainingActions = Math.max(total - completed, 0)`
    - `timeProgress = calcTimeProgressPercent(g.start_date, g.end_date)`（若 null 则不展示 pace）
    - `paceStatus = timeProgress == null ? null : getPaceStatus(progress, timeProgress)`
  - 扩展传给 `GoalProgressList` 的 item shape（新增 remainingActions、start_date、paceStatus）

### 6.2 UI（GoalProgressList）

- [GoalProgressList.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/GoalProgressList.tsx#L21-L102)
  - 扩展 `GoalProgress` interface：加入 `remainingActions: number`、`start_date?: string`、`paceStatus?: 'ahead'|'onTrack'|'behind'|null`
  - 第二行文案调整为“剩余项优先”，并在日期齐全时显示 pace 标签
  - 百分比展示保留，但不再是唯一主感知（与“剩余项”共同呈现）

### 6.3 i18n 文案

- [zh.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/zh.json)
  - `dict.dashboard.goals.progressTip` 从“基于行动完成率”调整为更准确的描述（如“完成率 + 节奏参考”）
  - 新增：
    - `remaining`: "剩余 {count} 项"
    - `paceAhead`: "超前"
    - `paceOnTrack`: "正常"
    - `paceBehind`: "落后"
    - `needsBreakdown`: "待拆解"
- [en.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/en.json)
  - 同步新增对应英文 key（保持结构一致）

## 7. 边界情况与降级策略（决策已锁定）

- `totalActions <= 0`：
  - `progress = 0`
  - 展示 `needsBreakdown`（替代“0/0 项行动 + 0%”的误导感）
  - 不展示 pace
- `end_date` 缺失：
  - 继续展示完成/剩余项
  - 不展示 daysLeft 与 pace（或仅隐藏 pace；daysLeft 当前逻辑也会隐藏）
- `start_date` 缺失但有 `end_date`：
  - 只展示 daysLeft，不展示 pace（避免用 created_at 猜 start）
- `end_date <= start_date`：
  - pace 视为不可计算（null）

## 8. 验证步骤（实现后）

- 静态检查：`npm run lint`
- 构建检查：`npm run build`
- 手工验收（本地 dev）：
  - Dashboard 目标进展列表：有行动/无行动、有日期/无日期、逾期/未逾期三类目标都能正确展示
  - 随机抽一个目标：对照 actions 完成数与 UI 数字一致；节奏标签与“时间进度 vs 行动进度”一致

