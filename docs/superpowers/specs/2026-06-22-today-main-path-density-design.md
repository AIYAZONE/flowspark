# Today 主线路径推进密度卡设计

## Summary
- 目标：把 `Today` 里的 `Main Path Card` 从“主线入口”升级成“主线驾驶舱”，让用户看到当前主线最近是否在推进、还剩多少动作、以及今天推进这一步的意义。
- 本次范围：
  - 在现有 `Main Path Card` 内新增轻量 `推进密度层`
  - 只使用现有 `goals + actions + primaryPathContext` 数据派生，不新增 schema
  - 保持 `Today` 顶部 hero、`recent / must / overdue / other / completed` 结构不变
- 约束：不新增依赖；不改数据库 schema；不引入复杂图表；不改 AI API；不把 `Today` 变成分析页。

## Background
- 已完成状态：
  - 第 7 批已让 `Today` 能解释“当前主线路径是什么，为什么今天它最重要”。
  - 第 8 批已让主线路径在执行层和 AI fallback 中获得优先权。
  - 第 9 批已把主线路径从 `other` 中独立托起成 `Main Path Card`。
- 当前问题：
  - 主线卡虽然已经是独立容器，但仍偏“路径入口”，缺少“这条主线最近推进得怎么样”的动态感。
  - 用户看得到主线路径，但还看不到主线是否在持续推进、当前剩余多少推进空间、以及今天这一步的含义。
- 已确认方向：
  - 第 10 批不做新的系统模块，不做时间调度，也不继续堆解释文案，而是做“主线路径推进密度卡”。

## Goals（成功标准）
- 用户进入 `Today` 后，能够立刻回答：
  - 这条主线最近 7 天有没有在推进
  - 当前这条主线还剩多少动作、已完成多少
  - 今天推进主线的意义是什么
- 工程验收层面能够回答：
  - 密度信号是否基于现有真实数据派生
  - 主线卡是否仍保持为轻量驾驶舱，而不是演变成 dashboard
  - `Main Path Card` 的现有动作区、CTA、深链能力是否完整保留

## Non-goals（不做）
- 不做复杂图表，不做 mini chart，不做 hover trend。
- 不新增“周视图”“历史趋势”“阶段切换历史”等新模块。
- 不修改 `Today Main Thread` 顶部 hero 的职责。
- 不修改 `AITodayPlanButton` 或 `api/ai/today-plan`。
- 不新增埋点和数据库表。

## 方案比较

### 方案 A（本次采用）
- 在现有 `Main Path Card` 内增加一层轻量密度区：
  - 最近 7 天推进频率
  - 当前动作密度
  - 今日推进意义
- 服务端先派生 `mainPathDensityContext`，客户端只负责展示。

### 为什么选它
- 与已有主线路径卡天然兼容，不需要重做版式。
- 数据风险最低：服务端可以直接使用 `actions` 与 `activeGoals` 派生，避免客户端现场拼接复杂判断。
- 产品感更强：不是单纯显示 KPI，而是“节奏 + 剩余空间 + 今日意义”组合。

## 用户路径

### 进入 Today
1. 服务端继续生成 `primaryPathContext`。
2. 服务端针对 `primaryPathContext.goalId` 额外查询主线路径最近 7 天的轻量动作时间窗数据。
3. 服务端在此基础上生成 `mainPathDensityContext`。
3. 页面继续把这两个上下文一起透传给 `TodayActionList`。

### 查看 Main Path Card
1. 只要存在 `primaryPathContext`，用户就能看到主线卡头部与密度层。
2. 用户先看到已有：
  - `Main Path`
  - 路径标题
  - 阶段说明
3. 然后看到新增密度层：
  - 最近 7 天推进频率
  - 当前动作密度
  - 今日推进意义
4. 再往下按条件看到：
  - 若 `mainPathGroup.items.length > 0`，显示当前主线路径 action 列表
  - 若没有 residual action，显示轻量 fallback 文案而不是整张卡消失
5. 最后仍保留 CTA。

## 信息结构

### Main Path Card
- 第一层：主线身份
  - `Main Path` micro label
  - 主线路径标题
  - 阶段说明
- 第二层：推进密度
  - 指标 1：最近 7 天推进
  - 指标 2：当前已完成 / 剩余动作
- 第三层：今日推进意义
  - 1 条解释句，语气是“系统判断”，不是报表注释
- 第四层：主线 action 列表
  - 继续复用 `ActionItem`
- 第五层：CTA
  - 继续保留已有路径入口

## 数据来源

### 输入数据
- `primaryPathContext`
  - 已存在，提供主线路径 id、阶段文案、说明文案
- `activeGoals`
  - 已存在，提供主线路径总动作数、完成数
- `mainPathRecentActions`
  - 新增一个只针对 `primaryPathContext.goalId` 的轻量查询
  - 只取最近 7 天窗口内主线路径 action 所需字段：
    - `goal_id`
    - `completed`
    - `created_at`
    - `updated_at`
- `actions`
  - 继续作为 `Today` 执行层动作来源，不承担“主线路径完整 7 天时间窗”统计职责

### 派生信号

#### 1. 最近 7 天推进频率
- 优先定义：
  - 最近 7 天内，主线路径专属轻量查询结果中 `completed === true` 且 `updated_at` 落在近 7 天窗口内的 action 数
- 降级策略：
  - 如果可靠完成时间不足，则退为最近 7 天主线路径 action 活跃数
- 输出文案示例：
  - zh：`近 7 天推进 3 次`
  - en：`3 moves in the last 7 days`

#### 2. 当前动作密度
- 直接使用主线路径的：
  - 总动作数
  - 已完成动作数
  - 剩余动作数
- 输出文案示例：
  - zh：`已完成 2 / 共 6`
  - zh：`还剩 4 个动作待推进`

#### 3. 今日推进意义
- 不做复杂预测
- 基于以下输入生成一句解释：
  - `primaryPathContext.titleText`
  - `primaryPathContext.body`
  - 主线路径剩余动作数
  - 最近 7 天推进频率
- 目标是把“今天推进一步的含义”说清楚，而不是生成伪精准 forecast

## 展示原则

### 视觉层级
- 主线卡仍低于顶部 hero，不抢主视觉
- 密度层使用 2 个轻指标块，不做大图表
- 今日推进意义只有 1 条解释句，不堆文字

### 为什么这样不会 low
- 不是告诉用户“你有多少任务”
- 而是告诉用户：
  - 主线最近是不是活着
  - 当前推进空间还有多大
  - 今天这一步是不是在延续主线
- 它是“主线驾驶舱”，不是“任务统计面板”

## 数据边界

### 建议新增上下文对象
- 新增 `MainPathDensityContext`，建议字段：

```ts
type MainPathDensityContext = {
  goalId: string
  recentCompletedCount7d: number
  completionCount: number
  remainingCount: number
  totalCount: number
  recentSummary: string
  progressSummary: string
  meaningSummary: string
}
```

### 生成位置
- 推荐在服务端生成，放在 `today/page.tsx` 对 `primaryPathContext` 的后续派生中。
- 为了保证近 7 天频率可靠，允许在服务端新增一段只针对 `primaryGoalId` 的轻量 action 查询。
- 若逻辑变长，可新增轻量 helper，例如：
  - `src/lib/main-path-density.ts`

### 为什么服务端生成
- 避免 `TodayActionList` 内再叠一层数据派生逻辑
- 保证文案与密度判断由同一处统一生成
- 降低客户端组件继续膨胀的风险
- 避免把“Today 动作列表”误用成“主线路径完整时间窗统计源”

## Empty / Fallback 策略

### 不展示场景
- `primaryPathContext` 不存在时，不展示主线卡与密度层。

### 降级展示
- 如果最近 7 天推进频率无法稳定得出：
  - 仍展示动作密度与今日推进意义
- 如果主线路径总动作数为 0：
  - 主线卡仍存在
  - 常规密度指标降级
  - 回到“先把路径变成可执行”的语义
- 如果剩余动作数为 0：
  - 主线卡仍存在
  - 今日推进意义切换为“主线当前已接近收口”的语义
- 如果 `mainPathGroup` 不存在或 `items.length === 0`：
  - 密度层与 CTA 仍显示
  - action 列表区域切换为 fallback 文案，例如：
    - zh：`今天这条主线没有落在 residual 动作区，说明它当前更多体现在 must / overdue / recent 或已接近收口。`

## Implementation Boundaries

### 需要改动
- `src/app/(authenticated)/today/page.tsx`
  - 额外查询主线路径最近 7 天轻量 action 时间窗数据
  - 在现有数据基础上生成 `mainPathDensityContext`
  - 透传给 `TodayActionList`
- `src/components/TodayActionList.tsx`
  - 接收并渲染 `mainPathDensityContext`
  - 在现有 `Main Path Card` 内插入密度层
  - 把卡片拆为“始终显示的 header + density”与“按存在性显示的 action list / fallback”
- `src/lib/main-path-density.ts`（推荐新增）
  - 统一封装密度派生逻辑与文案输出

### 暂不改动
- `src/components/ActionItem.tsx`
- `src/components/AITodayPlanButton.tsx`
- `src/lib/path-context.ts`
- `api/ai/today-plan`
- `all` 视图

## Acceptance Criteria（验收标准）
- `Main Path Card` 中新增推进密度层。
- 密度层至少包含：
  - 最近 7 天推进频率
  - 当前已完成 / 剩余动作
  - 今日推进意义
- 最近 7 天推进频率来自主线路径专属轻量查询，而不是直接复用 `Today` 动作列表。
- 主线卡原有：
  - 标题
  - 阶段说明
  - action 列表
  - CTA
  - 深链展开能力
  仍保持不变。
- 若主线路径不存在，密度层不展示。
- 若主线路径存在但 `mainPathGroup` 为空，主线卡仍显示 header + density + CTA，并展示 fallback 文案。
- 若最近 7 天推进频率无法稳定计算，密度层仍可降级展示其余两项。
- 不新增依赖；`npm run build` 通过。

## Risks & Mitigations
- 风险：看起来像 dashboard
  - 约束为“2 个轻指标 + 1 条意义句”，不做复杂图表。
- 风险：数据不够稳定导致文案失真
  - 明确降级策略，宁可少一项，不展示伪精准趋势。
- 风险：客户端组件继续变大
  - 推荐把派生逻辑提到服务端 helper 中，组件只展示。
