# Landing `Trajectory Health` 面板设计

## Summary

- 目标：在首页中段新增一个 `Trajectory Health` 数据化轨迹面板，补上 `Premium Life OS` 世界观中的“证据层”。
- 这不是新功能开发，也不是接入真实用户计算，而是一次品牌叙事与视觉证据增强。
- 面板用于回答一个关键问题：`FlowSpark` 为什么不是普通任务工具，而是会判断你人生轨迹状态的系统。
- 第一版以静态展示数据和结构化文案实现，不引入真实埋点、服务端计算或复杂图表依赖。

## Background

- 当前 landing 已完成三层基础叙事：
  - Hero：建立 `Premium Life OS` 的身份认知。
  - `System Capabilities`：解释 `Direction / Execution / Intelligence` 三种系统能力。
  - CTA：承接“进入我的 Life OS”。
- 现阶段缺口在于：
  - 页面已经会“说自己是系统”，但还缺少一块足够可信的、像系统监测面板的模块。
  - 用户还没有在 landing 中直接看到“系统如何判断你是否走在正确轨道上”。
- 因此需要在 Hero 与 CTA 之间新增一层“系统证据”，把“系统判断”具象化。

## Problem Statement

- 如果 landing 只有概念文案和 feature card，用户仍可能把产品理解为“更高级一点的效率工具”。
- 如果直接上复杂图表，会造成理解成本过高，反而削弱首页的高级感与秩序感。
- 需要一个兼具以下特征的中段模块：
  - 一眼可懂
  - 有系统判断感
  - 有数据化证据感
  - 不像运营后台或 SaaS KPI 仪表盘

## Goals

- 让用户在 landing 中段明确感知：系统不仅帮助执行，还会判断轨迹健康度。
- 强化 `Premium Life OS` 的“长期、克制、理解你”的高级感。
- 在不增加真实产品复杂度的前提下，补足“Trajectory”这条叙事线。
- 与现有 Hero、Capabilities、CTA 形成连贯的信息层级。

## Non-Goals

- 不接入真实用户数据或实时计算。
- 不引入新的图表库或复杂可视化交互。
- 不做登录态差异化展示。
- 不扩展到 Dashboard、Today、Profile 的功能改造。
- 不在本轮定义长期轨迹评分算法。

## User Story

- 作为第一次访问首页的潜在用户，我希望快速理解这个系统不仅能帮我做事，还能判断我的人生推进状态，这样我才会觉得它值得被当作“个人操作系统”而不是普通工具。

## Approaches Considered

### 方案 A：单一总分 + 3 个子信号（推荐）

- 结构：
  - 一个核心指标：`Trajectory Health`
  - 三个子信号：`Direction / Rhythm / Stability`
  - 一句系统判断总结
- 优点：
  - 最符合首页的认知效率要求，3 秒内可读懂。
  - 最像“高级系统面板”，不需要用户先理解图表语法。
  - 最容易与现有 landing 的叙事结构融合。
- 缺点：
  - 需要非常克制的文案和视觉处理，否则容易落回 KPI 卡片堆叠。

### 方案 B：趋势图主导

- 结构：
  - 以 7/30 天趋势线为视觉核心，旁边配健康度说明。
- 优点：
  - 数据感更强，具备 `intelligence layer` 的科技感。
- 缺点：
  - 首次访问者不如总判断直观。
  - 容易让用户先研究图，而不是先理解产品是什么。

### 方案 C：雷达/象限面板

- 结构：
  - 用多维图形表示人生轨迹平衡度。
- 优点：
  - 视觉冲击强，容易显得“高级”。
- 缺点：
  - 理解成本最高。
  - 更容易显得炫技，不利于可信系统感。

### 决策

- 采用 **方案 A：单一总分 + 3 个子信号**。
- 理由：
  - 它最适合当前 landing 阶段。
  - 它能最大程度提升“系统感”，同时不增加产品理解负担。

## Information Architecture Placement

- 模块放置位置：
  - 当前 `System Capabilities` 区块之后
  - 底部 CTA 之前
- 页面角色分工：
  - Hero：建立世界观
  - Capabilities：解释系统能力
  - `Trajectory Health`：提供“系统判断”的可视化证据
  - CTA：完成转化承接
- 视觉权重：
  - 它应成为 landing 的第二主模块
  - 视觉权重高于三张 feature card
  - 视觉权重低于 Hero 主舞台

## Content Design

### 模块命名

- 中文：`轨迹健康度`
- 英文：`Trajectory Health`

### 内容结构

- 顶部标签：
  - 用于说明这是系统层判断，而非普通统计信息。
  - 示例文案：
    - 中文：`System Read`
    - 英文：`System Read`
- 主标题：
  - 中文：`你的轨迹正在变得更清晰`
  - 英文：`Your trajectory is becoming more legible`
- 说明文案：
  - 表达系统会持续监测方向稳定性、节奏完整性与连续性风险。
- 核心指标：
  - 一个醒目的健康度数值，例如 `86`
- 系统判断：
  - 一句判断型总结，例如：
    - 中文：`方向稳定，但节奏轻微失衡，建议优先保护连续性。`
    - 英文：`Direction is stable, but your rhythm shows mild drift. Protect continuity first.`
- 三个子信号：
  - `Direction`
  - `Rhythm`
  - `Stability`
- 每个子信号包含：
  - 指标名
  - 分值或强度
  - 简短状态词
  - 极简趋势条或状态条

### 状态词建议

- `Direction`
  - 中文：`对齐中`
  - 英文：`Aligned`
- `Rhythm`
  - 中文：`轻微波动`
  - 英文：`Slight Drift`
- `Stability`
  - 中文：`稳定恢复`
  - 英文：`Stable Recovery`

## Visual Design

### 视觉目标

- 看起来像：
  - 高级系统监测面板
  - 私人认知仪表层
  - `Life OS` 的中段证据层
- 不像：
  - 运营后台
  - 通用 SaaS 数据看板
  - 花哨的 AI demo

### 材质与风格

- 复用当前 landing 已建立的语言：
  - 轻玻璃
  - 微边框
  - 柔和背景光
  - 克制的渐变材质
- 避免：
  - 过多高饱和色块
  - 厚重阴影
  - 复杂网格背景
  - 强交互图表

### 布局

- 桌面端推荐三栏结构：
  - 左侧：模块标题与说明
  - 中间：大号健康度指数与系统判断
  - 右侧：三个子信号列表
- 移动端改为纵向堆叠：
  - 标题与说明
  - 大号指标
  - 系统判断
  - 三个子信号

### 图形表达

- 使用以下轻量图形元素即可：
  - 细刻度线
  - 短趋势条
  - 圆点状态标记
  - 微弱高光分隔
- 不使用：
  - 雷达图
  - 复杂折线图
  - 坐标轴
  - 图例系统

## Component Design

### 首选实现

- 新建一个轻量展示组件：
  - `src/components/TrajectoryHealthPanel.tsx`
- 在 `src/app/page.tsx` 中引入并放置到 `System Capabilities` 后方。

### 组件职责

- 只负责展示 landing 用的静态轨迹面板。
- 接收结构化文案与展示数据。
- 不负责真实数据计算、登录判断或异步请求。

### Props 方向

- `label`
- `title`
- `subtitle`
- `score`
- `judgment`
- `signals`

### 数据结构建议

```ts
type TrajectorySignal = {
  label: string
  value: string
  state: string
  trend: number[]
}
```

- `trend` 仅用于渲染极简状态条，不代表真实业务算法。

## Localization Design

- 在以下文件新增 `landing.trajectory` 节点：
  - `src/i18n/zh.json`
  - `src/i18n/en.json`
- 该节点应包含：
  - label
  - title
  - subtitle
  - scoreLabel
  - judgment
  - signals
- 目标：
  - 避免继续在 `page.tsx` 中散落 `isZh ? ... : ...`
  - 为后续文案迭代和实验提供统一入口

## Data Strategy

### 第一版

- 使用静态演示数据。
- 这些数据服务于叙事和视觉表达，而不是业务准确性。
- 示例：
  - 总分：`86`
  - `Direction`：`91`
  - `Rhythm`：`74`
  - `Stability`：`88`

### 后续扩展位

- 如果未来要接真实系统判断，可从以下来源组合：
  - Today 主线路径对齐度
  - 连续性与护盾状态
  - AI recommendation outcome
  - 周维度 insight
- 但这些都不属于本轮范围。

## Copy Principles

- 用“系统判断”语气，而不是“AI 生成”语气。
- 强调：
  - 系统理解
  - 节奏校正
  - 长期轨迹
- 避免：
  - 功能营销腔
  - 过强承诺
  - 技术炫耀

## Accessibility

- 保证数值与状态词在浅色/深色背景上有足够对比度。
- 微趋势图不能作为唯一信息来源，必须有文本状态词。
- 移动端优先保证阅读顺序清晰，而不是保留桌面布局形式。

## Risks

- 风险 1：太像普通数据看板
  - 应对：减少表格感和卡片堆叠感，只保留一个主中心。
- 风险 2：太像虚构炫技数据
  - 应对：让文案更像系统判断，不用夸张增长曲线。
- 风险 3：与 Hero 争夺主视觉
  - 应对：控制体量、色彩和阴影，明确其为 landing 第二主模块。
- 风险 4：静态数据被误解为真实个性化结果
  - 应对：文案保持普适性，避免暗示“这是你的实时个人数据”。

## Validation

- 用户滚动到该区块时，应在 3-5 秒内理解：
  - 这不是普通效率工具
  - 这是一个会判断人生轨迹状态的系统
  - 系统关注的不是任务数量，而是方向、节奏和稳定性
- 页面整体不应出现：
  - 过多图表学习成本
  - 多个强视觉中心
  - 与 Hero 风格割裂的问题

## Implementation Scope

- 本轮改动目标文件：
  - `src/app/page.tsx`
  - `src/i18n/zh.json`
  - `src/i18n/en.json`
  - `src/components/TrajectoryHealthPanel.tsx`（建议新增）
- 本轮不改动：
  - Dashboard
  - Today
  - Profile
  - 任意服务端计算逻辑
  - 任意埋点与数据库结构

## Final Recommendation

- 先用一个克制但有判断感的 `Trajectory Health` 面板，补齐 landing 中“Trajectory”这条叙事线。
- 它应该像一个高级系统正在安静地读懂你，而不是另一个功能模块在争取注意力。
- 只要这块做对，首页就会从“会讲自己是系统”，升级为“看起来真的像系统”。
