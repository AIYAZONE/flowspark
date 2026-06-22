# Premium Life OS 品牌与体验重塑规划

## Summary

- 结论：当前规划方向本身是对的，但产品感知层级明显低于你的真实野心。
- 你想做的不是又一个 TODO / Habit / AI 工具，而是一个 `Premium Life OS`:
  - 更懂你
  - 更少打扰
  - 更像长期人生策略系统
  - AI 不是一个按钮，而是隐形大脑
- 现在之所以会有“别人的 vibecoding 作品更惊艳、自己的感觉很 low”的体感，不是因为你没有功能，而是因为：
  - 品牌叙事还停留在“效率工具”
  - 首页与已登录壳层没有传达高端系统感
  - Dashboard / Today / Profile 的层级感与角色边界不够高级
  - AI 能力存在，但还没有被包装成“真正懂你的人生系统”
- 本次规划不主张继续堆功能，而是做一轮 `品牌与体验重塑`：
  - 重新定义产品气质
  - 重新定义信息架构
  - 重新定义页面角色
  - 重新定义 UI/UX 语言
  - 重新定义 AI 在用户心智中的位置

## Current State Analysis

### 1. 当前方向为什么不 low，但看起来 low

- 从文档和代码看，产品真实方向已经很接近正确答案：
  - 高频核心不是 Goals，而是 `Today + Dashboard + AI Coach`
  - AI 已经从“新奇功能”走向“每日执行增强层”
  - 留存主线也已经锁定在 `Today Plan / Rescue / Review / Weekly Insight / Tomorrow Handoff`

- 但用户为什么依然会觉得“不够高级”：
  - **第一层问题：品牌外观错位**
    - 公开首页 [page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/page.tsx) 仍然更像一款“做事工具”的 landing page，而不是一套“人生系统”的入口。
    - 核心卖点虽然有 AI / growth / insight，但没有形成一种“这是你未来十年的个人操作系统”的压迫感与吸引力。

  - **第二层问题：信息架构还是工具思维**
    - 当前主导航在 [Sidebar.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/Sidebar.tsx) 和 [MobileNavBar.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/MobileNavBar.tsx) 中，仍然是：
      - `Dashboard`
      - `Today`
      - `Goals`
      - `Inbox`
      - `Profile`
    - 这是一套很标准的效率工具 IA，不是一套“人生系统”的 IA。

  - **第三层问题：页面价值层级不够清晰**
    - `Dashboard` 像杂糅的信息看板。
    - `Today` 像执行页，但还没有成为“你今天生命主线的控制台”。
    - `Profile` 更像设置页，不像“自我模型 / AI 认知画像 / 系统洞察中心”。

  - **第四层问题：高级感只停留在 token，没有形成气质**
    - 现有设计规范 [UI_UX设计规范.md](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/%E8%AE%BE%E8%AE%A1%20-%2003%20UI_UX%E8%AE%BE%E8%AE%A1%E8%A7%84%E8%8C%83.md) 其实是对的：
      - 极简
      - 科技感
      - Premium Feel
      - 微边框 / 玻璃拟态 / 呼吸感
    - 但代码实现仍偏“轻量效率产品默认长相”，没有拉出真正的高级系统感。

  - **第五层问题：AI 是功能，不是世界观**
    - 现在用户看到的是：
      - AI Today Plan
      - AI Rescue
      - AI Review
      - Weekly Insight
    - 但用户还感受不到：
      - “这个系统在理解我”
      - “这个系统在记住我的模式”
      - “这个系统在替我管理人生节奏”

### 2. 已有基础其实很强

- 路线图与定价文档已经给出正确方向：
  - [定位与定价验证一页纸](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/%E4%BA%A7%E5%93%81%20-%2016%20%E5%AE%9A%E4%BD%8D%E4%B8%8E%E5%AE%9A%E4%BB%B7%E9%AA%8C%E8%AF%81%E4%B8%80%E9%A1%B5%E7%BA%B8.md)
  - [项目执行进度与竞争力冲刺计划](file:///Users/brucewang/Documents/AIYA/goals/.trae/documents/2026-06-20-%E9%A1%B9%E7%9B%AE%E6%89%A7%E8%A1%8C%E8%BF%9B%E5%BA%A6%E4%B8%8E%E7%AB%9E%E4%BA%89%E5%8A%9B%E5%86%B2%E5%88%BA%E8%AE%A1%E5%88%92.md)
- 代码层也已经有不少可以直接放大的能力：
  - `Today` 执行中枢
  - AI Today Plan / Rescue / Review / Weekly Insight
  - streak / shield / reward / completion feedback
  - AI insights / analytics / recommendation pipeline

- 所以问题不是“这个产品值不值得做”，而是：
  - **现在的呈现方式，配不上它的终局愿景。**

### 3. 背景 → 约束 → 方案 → 取舍 → 风险 → 建议

- 背景
  - 用户终极目标是做成“最懂你的、甚至可以规划你人生”的系统。
  - 当前要解决的问题不是短期留存优化，而是产品整体气质与市场感知偏低。

- 约束
  - 不能忘初心：核心仍是成长、行动、复盘、长期系统。
  - 不能跑偏成“花哨 AI 展示器”或“泛陪伴聊天应用”。
  - 不能一上来做成大而全人生平台，必须分阶段落地。
  - 必须兼容现有的 `Today / Dashboard / Profile / AI Coach` 主线。

- 方案
  - 以 `Premium Life OS` 为统一定位，重塑：
    - 品牌叙事
    - 信息架构
    - 核心页面角色
    - 视觉语言
    - AI 人设与系统角色

- 取舍
  - 不走“大众效率爆款”路线。
  - 不走“强游戏化炫技”路线。
  - 不走“泛情绪陪伴”路线。
  - 选择“高级、克制、长期、深度理解”的市场位置。

- 风险
  - 如果只重做视觉，不改信息架构，最后只是“更好看的工具”。
  - 如果只讲愿景，不改核心页面层级，最后只是“更虚的故事”。
  - 如果把 AI 做得太显眼，会稀释“系统感”，让产品变成普通 AI 产品。

- 建议
  - 这次重塑要先定世界观，再定导航，再定页面，再定视觉。
  - 核心不是“更炫”，而是“更像一个高级系统，而不是功能集合”。

## Proposed Changes

### 1. 重定义产品定位：从 FlowSpark 工具感，升级为 Premium Life OS

- 涉及文件
  - `src/app/page.tsx`
  - `src/i18n/zh.json`
  - `src/i18n/en.json`
  - 相关品牌/landing 文案资源文件

#### What

- 重写对外定位文案和首页叙事。
- 不再强调“任务管理、习惯坚持、AI 小功能”。
- 改为强调：
  - 这是你的个人操作系统
  - 它帮你决定今天最重要的一步
  - 它理解你的节奏、偏好、执行波动
  - 它不是记录你的人生，而是在协助你设计人生

#### Why

- 你现在最大的问题不是功能不够，而是首屏没有建立足够高的心智。
- 如果首页看起来还是高配效率工具，后面再怎么做都很难被当成“人生系统”。

#### How

- 首页 Hero 叙事改成三层：
  - **层 1：身份认知**
    - “你的个人人生操作系统”
  - **层 2：结果承诺**
    - “把长期人生方向收敛成今天最重要的一步”
  - **层 3：AI 角色**
    - “AI 在幕后理解你、提醒你、重排你的人生节奏”

- 首页 Feature 区不再按“功能模块”讲，而按“系统能力”讲：
  - Direction：长期方向感
  - Execution：今日推进力
  - Intelligence：AI 理解与复盘

- CTA 不再只是“开始使用”，而要像进入一个更高级系统：
  - 例如“进入我的 Life OS”

### 2. 重构信息架构：从效率工具导航，升级为人生系统导航

- 涉及文件
  - `src/components/Sidebar.tsx`
  - `src/components/MobileNavBar.tsx`
  - `src/app/(authenticated)/layout.tsx`

#### What

- 重新定义主导航，而不是继续沿用传统效率工具 IA。

#### Why

- 当前 `Dashboard / Today / Goals / Inbox / Profile` 的命名方式太像常规 productivity app。
- 你要做的是系统，不是栏目集合。

#### How

- 推荐导航重塑方向：
  - `Today`：今日生命主线，保留且强化
  - `System` 或 `OS`：替代 Dashboard，作为人生系统总览
  - `Paths`：替代 Goals，强调人生路径/长期方向，而不是孤立目标
  - `Signals`：替代 Inbox / 通知 / 洞察聚合，承载系统提示、AI 观察、待处理输入
  - `You`：替代 Profile，强调自我模型，而非账户设置

- 如果暂时不能全部改名，至少做两级策略：
  - 路由层可继续沿用原路径，降低改动风险
  - UI 显示名先升级，先改用户心智层

### 3. 重新定义三大核心页面角色

- 涉及文件
  - `src/app/(authenticated)/dashboard/page.tsx`
  - `src/app/(authenticated)/today/page.tsx`
  - `src/app/(authenticated)/profile/page.tsx`
  - `src/app/(authenticated)/profile/ai-insights/page.tsx`

#### What

- 把当前三大主页面重新定位。

#### Why

- 页面角色不清，用户会觉得“功能很多，但没有一个明显高级中心”。

#### How

- `Today`
  - 定位升级为：**今天的人生主控台**
  - 页面目标不是列任务，而是把今天最值得完成的事情放到绝对中心
  - 只保留与“今天该怎么过”强相关的信息
  - 所有非今日高频信息都应降噪或移出

- `Dashboard` → 未来建议改为 `System`
  - 定位升级为：**人生系统总览**
  - 不再是普通数据看板
  - 应该包含：
    - 当前人生阶段
    - 本周系统判断
    - 方向偏移提示
    - 执行稳定度
    - 关键成长趋势

- `Profile` → 未来建议改为 `You`
  - 定位升级为：**你的系统画像**
  - 不只是头像与设置
  - 而是：
    - 你的偏好模型
    - 你的行为模式
    - AI 如何理解你
    - 你的节奏与风险点

### 4. 重新定义 AI：从显性功能，升级为隐形大脑

- 涉及文件
  - `src/components/AITodayPlanButton.tsx`
  - `src/components/WeeklyInsightCard.tsx`
  - `src/components/ScoreCard.tsx`
  - `src/lib/ai/coachOrchestrator.ts`
  - `src/app/(authenticated)/today/page.tsx`
  - `src/app/(authenticated)/dashboard/page.tsx`

#### What

- 重塑 AI 在系统中的呈现方式。

#### Why

- 当前 AI 入口太像独立 feature。
- 真正高级的产品不会一直喊“看我有 AI”，而是让用户感觉“系统真的懂我”。

#### How

- AI 呈现原则改为：
  - **少入口、多渗透**
  - **少炫技、多判断**
  - **少生成、多理解**

- 具体策略：
  - 减少明显“AI Button”式存在感
  - 增强“系统建议”语气，而不是“AI 生成”语气
  - 把 AI 输出包装成：
    - 系统判断
    - 今日建议
    - 节奏提醒
    - 偏差纠正
    - 长期趋势观察

- AI 心智重塑目标：
  - 用户不是“在用 AI 功能”
  - 而是“在被一个懂自己的系统长期辅助”

### 5. 重塑视觉语言：从轻量效率应用，升级为高级系统气质

- 涉及文件
  - `src/app/globals.css`
  - `src/components/ui/button.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/Sidebar.tsx`
  - `src/components/MobileNavBar.tsx`
  - `src/app/page.tsx`
  - 核心页面局部卡片组件

#### What

- 不推翻当前设计 token，而是在现有规范基础上真正拉出高级层次。

#### Why

- 现在的问题不是配色错了，而是使用方式仍偏普通。

#### How

- 视觉升级原则：
  - 更少廉价“工具感”
  - 更强秩序、留白、中心感
  - 更统一的光泽、材质、边界
  - 更强调主次层级，而不是均匀卡片堆叠

- 具体策略：
  - 让页面中永远只有一个绝对主模块
  - 降低次级卡片的视觉存在感
  - 强化标题、数字、节奏信息的 typographic authority
  - 减少“列表 UI”感觉，增加“系统面板”感觉
  - 导航更像设备系统边栏，而不是 SaaS 左侧栏

- 页面级气质目标：
  - 看起来像：
    - 高端个人操作系统
    - 认知增强工具
    - 私人战略仪表盘
  - 而不是：
    - 任务 App
    - 打卡 App
    - 模板化 SaaS

### 6. 增加“人生系统”真正该有的产品叙事层

- 涉及文件
  - `src/app/page.tsx`
  - `src/app/(authenticated)/dashboard/page.tsx`
  - `src/app/(authenticated)/today/page.tsx`
  - `src/app/(authenticated)/profile/page.tsx`
  - 相关文案/i18n

#### What

- 增加产品级叙事，不是增加功能。

#### Why

- 一个产品能不能显得高级，取决于它是否在用户脑中形成“世界观”。

#### How

- 系统叙事从三个层面展开：
  - **Today**
    - 今天要把什么推进
  - **Trajectory**
    - 你的人生轨迹正在往哪里偏移
  - **Intelligence**
    - 系统如何持续理解你并帮你校正

- 后续所有体验文案都围绕这三条主线，不再散乱命名。

### 7. 规划一条“从现在到终局”的产品演进路线

- 涉及文件
  - 新战略文档
  - 后续页面/IA/spec 文档

#### What

- 把终极愿景拆成分阶段可落地路线，而不是直接跳到“AI 规划人生”。

#### Why

- “人生系统”不是一句 slogan，而要分层建设能力。

#### How

- 建议分三阶段：

- Phase A：Premium Execution System
  - 目标：把它做成最高级的“今日推进系统”
  - 重点：Today、System 总览、反馈、连贯性、视觉气质

- Phase B：Personal Intelligence Layer
  - 目标：让系统真正记住你的行为模式
  - 重点：AI 画像、长期趋势、偏好建模、人生节奏理解

- Phase C：Life Planning Layer
  - 目标：从“帮你完成今天”升级为“帮你设计未来阶段”
  - 重点：方向规划、阶段目标、风险预警、周期性战略建议

## Assumptions & Decisions

- 假设 1
  - 用户本次要的是“整体规划与重塑建议”，不是立刻改某一个页面。

- 假设 2
  - 本轮最重要的是把产品从“工具感”提升到“系统感”，而不是继续扩充功能数量。

- 决策 1
  - 市场定位选择 `Premium Life OS`，不是大众效率爆款。

- 决策 2
  - 核心体验中心保留 `Today`，因为它最符合“系统每天推动你前进”的主线。

- 决策 3
  - AI 的角色定位为隐形大脑，而不是高频显性功能按钮。

- 决策 4
  - 后续如果进入执行，优先顺序应为：
    - 先重塑品牌叙事与 IA
    - 再重塑核心页面
    - 再统一视觉语言
    - 最后补充 AI 系统叙事与高级能力包装

## Verification Steps

### 1. 规划验收

- 这份规划必须能回答以下问题：
  - 我们到底是在做什么产品？
  - 为什么它不是普通效率工具？
  - 为什么它不是普通 AI 应用？
  - 为什么用户会觉得它更高级？
  - 为什么它最终有机会成为“人生系统”？

### 2. 品牌验收

- 首页改版后，用户应在 5 秒内感知：
  - 这是高端产品
  - 这是系统，不是列表工具
  - 这是长期陪伴，而不是一次性 AI

### 3. IA 验收

- 导航与页面命名应减少工具语义，增加系统语义。
- 用户进入产品后，应明显感受到：
  - Today 是今日主线
  - System 是总览和判断
  - You 是自我模型与长期理解中心

### 4. 体验验收

- 新的 UI/UX 必须满足：
  - 更少密集卡片堆叠
  - 更强中心感
  - 更高留白质量
  - 更统一的材质与动效语言
  - 更少“功能区块感”，更多“系统面板感”

### 5. 商业化验收

- 后续若走订阅，用户必须能自然理解：
  - 付费不是为了解锁按钮
  - 而是进入更高级的人生系统体验

## 最终建议

- 这条路是行的，而且方向上比很多“看起来惊艳的 vibecoding 作品”更有长期价值。
- 但你现在最大的问题是：
  - **内核比外壳高级**
  - **能力比叙事高级**
  - **方向比呈现高级**
- 所以后面不是怀疑规划，而是要做一次真正的 `品牌与体验重塑`。
- 下一步最合理的动作不是直接改代码，而是继续拆出一份：
  - 页面级 IA 重塑方案
  - 首页品牌重构方案
  - `Today / System / You` 三大核心页面的高级化设计方案
- 如果这三件事做对了，你的产品就会从“一个不错的 AI 效率产品”，真正跃迁到“像人生系统雏形的产品”。
