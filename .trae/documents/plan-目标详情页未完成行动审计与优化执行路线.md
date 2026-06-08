# 计划：目标详情页未完成行动审计与优化执行路线

## Summary
- 目标：识别 `http://localhost:3000/goals/ce9efbb5-923c-41d6-b576-53c836075fe5` 下所有“当前未完成筛选”可见行动，按 `Bug / UI优化 / 功能优化` 分类形成优化清单，并生成后续逐项落地顺序。
- 当前页面状态：页面可正常访问，已存在登录态；目标详情页默认落在“行动 + 未完成”筛选。
- 本次计划产出：不是直接改代码，而是先把“问题清单 -> 文件映射 -> 执行顺序 -> 验证方式”定死，待你确认后按顺序执行。

## 执行状态

### 已完成
- `P0-3` Dashboard / Today 空态弹窗一致性修复：已完成，统一到 `AddActionDialog`
- `P0-1` 移动端新增目标入口修复：已完成，`/goals` 相关页面 FAB 已补 `新建目标`
- `P1-4` 连续火花/统计逻辑校验：已完成，规则已确认并补充到 `StreakCard`
- `P0-2` 移动端弹窗软键盘遮挡治理：已完成，已抽通用 keyboard inset 并接入主要弹窗
- `P1-2` 折叠箭头、全屏/关闭/标题对齐统一：已完成，`ActionItem` 已统一
- `P2-1` 灵感/心路旅程创建体验升级：已完成，列表卡片、页面层级、创建/编辑弹窗尺寸与查看态都已重做
- `P1-1` 目标详情页快速切换其他目标：已完成，桌面端和移动端都已接入
- `P1-3` AI 采纳后的状态反馈可视化：已完成，行动卡片和详情态已增加 `AI 已采纳`
- `P2-3` 移动端 Select 统一：已完成，`ActionItem`、`NewGoalForm` 等关键原生下拉已替换为统一 `Select`

### 部分完成
- `P2-2` 灵感/心路旅程富文本能力扩展：已完成 HTML 富文本正文编辑与查看；图片上传/附件持久化仍未接入
- `P3-1` 微信友好分享：已完成首轮 Web 分享增强，包含分享页 metadata、首屏摘要与过期链接续期；更深入的微信生态适配仍未开始
- `P3-2` PC 快捷入口 + AI 助手入口整理：已完成 Web/PWA 第一轮，新增桌面快捷面板与 manifest shortcuts；原生桌面壳/系统级快捷键仍未开始
- `P3-3` 外部日历同步：已完成第一阶段 ICS 导出，支持从目标详情页导出未完成行动到系统日历；Google/Apple 直连同步仍未开始
- `P3-4` 重复任务 / 周期任务：已完成第一阶段，创建/编辑支持 `daily` / `weekly` / `monthly`，规则先序列化到 `description` 隐藏标记中；行动完成后会自动生成下一条实例并复制子行动骨架；列表卡片与详情面板都已展示周期 badge；已完成真实浏览器链路验证并清理验证数据。更深层的规则配置、跳过/暂停、批量编辑和数据库正式建模仍未开始

### 未开始
- `P3-5` 报告输出与下载

## Current State Analysis

### 1. 页面与数据链路
- 目标详情页入口：`src/app/(authenticated)/goals/[id]/page.tsx`
- 桌面端布局：`GoalDetailsCard + GoalSubItemsTabs`
- 移动端布局：`GoalDetailMobileLayout`
- 行动列表筛选与渲染：`GoalSubItemsTabs -> ActionListFilter -> ActionItem`
- 行动详情面板、编辑、删除、子行动折叠、全屏、AI救援：`src/components/ActionItem.tsx`

### 2. 实际识别到的未完成行动清单
- 已通过浏览器快照确认：当前“未完成”视图下可见 12 条未完成行动。
- 证据截图：
  - 整页截图：`/var/folders/w3/2r3fmf8j66d4r99xp4pdmfy00000gn/T/trae/screenshots/goal-detail-unfinished-actions-fullpage.png`
  - `UI、逻辑优化` 详情面板截图：`/var/folders/w3/2r3fmf8j66d4r99xp4pdmfy00000gn/T/trae/screenshots/goal-detail-ui-logic-optimization-dialog.png`

### 3. 未完成行动分类审计

| 序号 | 行动标题 | 分类 | 识别到的内容/意图 | 截图情况 |
| --- | --- | --- | --- | --- |
| 1 | 可分享到微信？ | 功能优化 | 目标分享能力希望更贴近微信/小程序传播场景 | 无截图 |
| 2 | bug | Bug | 移动端目标列表右下角加号无法创建目标；移动端创建行动/灵感/心路旅程弹窗被软键盘遮挡 | 无截图 |
| 3 | PC端需要一个快捷入口，类似home系统那样 | 功能优化 | 需要 PC 快速入口 + 更明显的 AI 助手入口 | 无截图 |
| 4 | UI、逻辑优化 | 混合项：Bug + UI优化 + 功能优化 | 连续火花统计逻辑/提示说明；目标详情 title 快速切换目标；折叠箭头提示；AI采纳后的 UI 状态变化 | 5 张截图 |
| 5 | 没有将行动同步到我的日历中，粘性不强很容易遗忘 | 功能优化 | 外部日历同步或导出能力 | 无截图 |
| 6 | bug修复 | Bug | 今日行动为空时，仪表盘拉起“添加今日活动”弹窗与 Today 页不一致 | 1 张截图 |
| 7 | 我发现有些行动是每周或每月例行的 | 功能优化 | 重复任务/周期任务设计与落地 | 无截图 |
| 8 | 看看这个怎么样 | 混合项：Bug + UI优化 + 功能优化 | 移动端富文本无法加图；灵感支持富文本；移动端下拉选择不易点击 | 无截图 |
| 9 | 灵感和心路旅程页面 UI 实在是不好看 | UI优化 | 灵感/心路旅程整体样式需要重做 | 无截图 |
| 10 | UI优化 | UI优化 | 折叠标题缺少箭头 icon；全屏/关闭/icon 与标题顶部未对齐 | 2 张截图 |
| 11 | 心路旅程的创建弹窗要够大 | UI优化 | 心路旅程创建弹窗尺寸偏小，需要更大或全屏 | 无截图 |
| 12 | 我的目标系统希望能够增加报告输出功能 | 功能优化 | 报告生成、导出、下载 | 1 张截图 |

### 4. 已从代码确认的能力边界
- 目标详情页主入口已确认：`src/app/(authenticated)/goals/[id]/page.tsx`
- 行动列表切换与新增入口：`src/components/GoalSubItemsTabs.tsx`
- 行动筛选默认状态是 `incomplete`：`src/components/ActionListFilter.tsx`
- 行动详情面板已经具备：查看/编辑/删除/全屏/复制/AI救援/子行动折叠：`src/components/ActionItem.tsx`
- 目标详情描述区已存在“展开/收起”，但只有目标详情卡片有显式箭头：`src/components/GoalDetailsCard.tsx`
- 移动端弹窗键盘适配并不统一：`QuickCaptureDialog` 最完整，其它弹窗多数只做 `scrollIntoView`
- 行动描述富文本 + 图片上传已存在，但仅覆盖行动：`src/components/ActionDescriptionEditor.tsx`
- 灵感/心路旅程创建仍是轻量弹窗 + `Textarea`，未接入富文本：`src/components/AddGoalEntryDialog.tsx`
- 统一 Select 组件已存在，但 `ActionItem` 编辑态等区域仍混用原生 `<select>`：`src/components/ui/select.tsx`、`src/components/ActionItem.tsx`
- 日历同步、重复任务、报告导出基本缺失，仅有内部日期字段和 AI 洞察展示，没有真正外部能力

## 决策表达

### 背景
- 当前目标详情页下的未完成行动，本质上既是“需求池”也是“缺陷池”。
- 这些项混杂在一个目标内，粒度不统一，既有阻断型 Bug，也有长期功能项。
- 如果直接逐条开改，容易出现顺序混乱、基础设施重复返工、改一半又回头重构的问题。

### 约束
- 需要优先保证现有接口不变，避免无必要重构。
- 部分诉求依赖公共基础设施，不能只在单一页面做一次性修补。
- 有些功能属于真正新能力（如日历同步、重复任务、报告导出），不是“小修小补”，需要单独分阶段。
- 计划必须基于真实代码和真实页面，而不是凭标题想象。

### 方案
- 先按你要求的优先级分组：`Bug -> UI优化 -> 功能类行动`。
- 每个分组内部，再按“实现难度从低到高”排序，而不是按行动创建时间执行。
- 这样可以确保：
  1. 先恢复可用性
  2. 再提升体验一致性
  3. 最后进入需要新模型/新接口/新能力的功能建设

### 取舍
- 优先公共基础设施：一次修 `keyboard inset`、弹窗尺寸和交互规范，可同时覆盖多条行动项。
- 延后中大型能力：日历同步、重复任务、报告导出、PC 快捷入口不适合和 UI 修补混做。
- 将混合项拆开执行：比如 `UI、逻辑优化` 里的统计逻辑、标题切换、折叠 icon、采纳态 UI 不应被视为一条改动。

### 风险
- 某些行动标题描述的是产品意图，而不是现成缺陷，实施时仍需二次定义验收标准。
- 移动端软键盘问题如果只在单个弹窗修，会导致其它弹窗继续不一致。
- 日历同步、重复任务、报告导出都涉及数据模型或新接口，属于中高风险功能，不适合混在第一批提交。

### 建议
- 第一轮只做“用户立即可感知且能明显降低摩擦”的项。
- 第二轮做目标详情和内容创建体验统一。
- 第三轮再做产品能力扩展。
- 每一轮都尽量合并相同基础设施改动，减少重复返工。

## Proposed Changes

### Phase 0：先修阻断型 Bug

#### P0-1 移动端目标列表加号无法创建目标
- 关联行动：`bug`
- 目标：修复移动端目标列表页右下角/新增入口无法进入新建目标的问题。
- 核心文件：
  - `src/app/(authenticated)/goals/page.tsx`
  - `src/components/GoalListFilter.tsx`
  - `src/components/AddGoalDialog.tsx`
  - 必要时排查 `src/components/QuickCaptureSpeedDial.tsx`
- 怎么改：
  - 先定位移动端新增入口是“页面内按钮失效”还是“路由弹层冲突”。
  - 统一目标新建入口到 `/goals/new` 路由模式，避免不同入口行为不一致。
  - 验证目标列表空态、新建按钮、移动端快捷入口三个入口全部可达。

#### P0-2 移动端创建弹窗被软键盘遮挡
- 关联行动：`bug`、`看看这个怎么样`、`心路旅程的创建弹窗要够大`
- 目标：为创建行动 / 灵感 / 心路旅程等弹窗建立统一键盘顶起方案。
- 核心文件：
  - `src/components/ui/use-mobile-input-visible.ts`
  - `src/components/QuickCaptureDialog.tsx`（参考现有较完整方案）
  - `src/components/AddActionDialog.tsx`
  - `src/components/AddGoalEntryDialog.tsx`
  - `src/components/EditGoalEntryDialog.tsx`
  - 必要时补 `src/components/ui/dialog.tsx`、`src/components/ui/sheet.tsx`
- 怎么改：
  - 抽象 `visualViewport` + safe-area 的统一 keyboard inset 能力。
  - 让底部 sheet / fullscreen dialog 在移动端都能对标题、输入区、提交按钮同时生效。
  - 优先覆盖标题输入、文本框、富文本区、底部提交操作区。

#### P0-3 Dashboard 空今日行动时弹窗行为不一致
- 关联行动：`bug修复`
- 目标：保证 Dashboard 与 Today 页面拉起的“设定今日行动”体验一致。
- 核心文件：
  - `src/components/DailyPlanningCard.tsx`
  - `src/components/SetCoreActionSheet.tsx`
  - `src/app/(authenticated)/today/page.tsx`
  - `src/components/TodayActionList.tsx`
- 怎么改：
  - 对齐 Dashboard 空态 CTA 与 Today 页 CTA 的入口、默认参数和弹层模式。
  - 统一空态时的引导文案和触发路径，避免两个页面行为分叉。

### Phase 1：统一目标详情与行动详情 UI 交互

#### P1-1 目标详情页增加“快速切换其他目标”
- 关联行动：`UI、逻辑优化`
- 目标：在目标详情页标题区增加目标切换入口，减少来回返回列表。
- 核心文件：
  - `src/app/(authenticated)/goals/[id]/page.tsx`
  - `src/components/GoalDetailMobileLayout.tsx`
  - 必要时补一个轻量选择组件，优先复用 `src/components/ui/select.tsx`
- 怎么改：
  - 在桌面端标题行和移动端标题区加入“切换目标”控件。
  - 数据直接复用现有 `activeGoals` 查询结果，不新增接口。
  - 切换时只跳转目标详情页路由，保持当前页模型简单。

#### P1-2 统一折叠箭头、全屏按钮、关闭按钮与标题对齐
- 关联行动：`UI优化`、`UI、逻辑优化`
- 目标：让折叠/展开、全屏、关闭等关键控件的 affordance 更明显。
- 核心文件：
  - `src/components/ActionItem.tsx`
  - `src/components/GoalDetailsCard.tsx`
  - `src/components/TodayActionList.tsx`
  - `src/components/GoalListFilter.tsx`
- 怎么改：
  - 所有可折叠区域显式展示箭头图标和状态变化。
  - 调整 `ActionItem` 桌面/移动端详情面板头部，让标题、全屏 icon、关闭 icon 垂直对齐。
  - 检查已存在 `Collapsible` 的区域是否都用了统一视觉样式。

#### P1-3 AI 采纳后的状态反馈可视化
- 关联行动：`UI、逻辑优化`
- 目标：当“已生成并采纳”发生后，列表态/详情态应有明显状态提示。
- 核心文件：
  - `src/components/ActionItem.tsx`
  - `src/components/AITodayPlanButton.tsx`
  - 视需要检查 `src/lib/ai/recommendationStore.ts`
- 怎么改：
  - 利用已有 recommendation/adopt 数据，在 UI 上补“已采纳”“来源于 AI”之类的状态层。
  - 只做状态可视化，不改变既有 AI 业务流程。

#### P1-4 连续火花/统计逻辑增加解释与校验
- 关联行动：`UI、逻辑优化`
- 目标：澄清 streak/火花统计规则，避免用户误解。
- 核心文件：
  - 待执行阶段进一步确认统计展示组件，优先排查 `StreakCard.tsx`、`ScoreCard.tsx`、`lib/gamification.ts`
- 怎么改：
  - 先校验当前统计逻辑是否与产品预期一致。
  - 若逻辑本身正确，则补充说明提示；若逻辑不正确，则先修逻辑再加提示。

### Phase 2：补齐创建链路与内容编辑体验

#### P2-1 灵感/心路旅程升级为更完整的创建体验
- 关联行动：`心路旅程的创建弹窗要够大`、`灵感和心路旅程页面 UI 实在是不好看`
- 目标：提升灵感/心路旅程的创建与编辑弹窗层级，必要时支持全屏。
- 核心文件：
  - `src/components/AddGoalEntryDialog.tsx`
  - `src/components/EditGoalEntryDialog.tsx`
  - `src/components/GoalEntryRow.tsx`
  - `src/components/GoalSubItemsTabs.tsx`
- 怎么改：
  - 让心路旅程优先支持更大弹窗或移动端全屏。
  - 重构灵感/心路旅程卡片和详情区视觉层级，避免现在“轻表单 + 简单列表”显得过于粗糙。

#### P2-2 富文本与图片能力向灵感/心路旅程扩展
- 关联行动：`看看这个怎么样`
- 目标：将行动已有的富文本/图片上传链路复用到灵感或心路旅程。
- 核心文件：
  - `src/components/ActionDescriptionEditor.tsx`
  - `src/components/RichTextContentView.tsx`
  - `src/components/RichTextImagePreviewDialog.tsx`
  - `src/components/AddGoalEntryDialog.tsx`
  - `src/components/EditGoalEntryDialog.tsx`
- 怎么改：
  - 先抽离通用富文本能力，再按需接入灵感/心路旅程。
  - 避免复制一套新的编辑器逻辑。

#### P2-3 统一移动端 Select 体验
- 关联行动：`看看这个怎么样`
- 目标：解决移动端下拉过小、点击不便、样式不一致的问题。
- 核心文件：
  - `src/components/ui/select.tsx`
  - `src/components/AddActionDialog.tsx`
  - `src/components/ActionItem.tsx`
  - `src/components/NewGoalForm.tsx`
- 怎么改：
  - 统一优先使用同一套 Select，不再混用原生 `<select>` 与 Radix 风格。
  - 同步提升移动端触达面积、列表项高度和弹层层级。

### Phase 3：中大型功能能力建设

#### P3-1 微信友好分享与目标传播优化
- 关联行动：`可分享到微信？`
- 目标：增强目标分享链接在微信场景下的可传播性。
- 核心文件：
  - `src/components/GoalDetailsCard.tsx`
  - `src/app/share/goals/[token]/page.tsx`
  - `src/components/PublicGoalReadonlyView.tsx`
- 怎么改：
  - 优先从分享页体验、分享元信息、微信打开友好度切入。
  - 若要做小程序，不纳入第一轮，需单独立项。

#### P3-2 PC 快捷入口与 AI 助手入口整理
- 关联行动：`PC端需要一个快捷入口，类似home系统那样`
- 目标：先补 Web/PWA 层面的快捷入口，再决定是否要原生桌面壳。
- 核心文件：
  - `src/components/QuickCaptureSpeedDial.tsx`
  - `src/components/QuickCaptureDialog.tsx`
  - `src/app/manifest.ts`
  - `src/components/AITodayPlanButton.tsx`
- 怎么改：
  - 先整理站内快捷入口和 AI 入口层级。
  - 原生桌面端快捷能力（如全局快捷键）不放在第一轮。

#### P3-3 外部日历同步
- 关联行动：`没有将行动同步到我的日历中`
- 目标：补足行动到外部日历的同步/导出能力。
- 核心文件：
  - `src/app/(authenticated)/goals/actions.ts`
  - `src/lib/actionScheduling.ts`
  - 后续可能新增 `/api/calendar/*` 相关路由
- 怎么改：
  - 第一阶段建议先做导出或单向同步，再评估双向同步。
  - 这是新增能力，不与第一批 UI/Bug 混做。

#### P3-4 重复任务 / 周期任务
- 关联行动：`我发现有些行动是每周或每月例行的`
- 目标：为行动增加 recurrence 能力。
- 核心文件：
  - `src/app/(authenticated)/goals/actions.ts`
  - `src/lib/actionScheduling.ts`
  - `supabase/` 下相关 actions 表结构迁移文件
- 怎么改：
  - 需要从数据模型、创建表单、实例生成、完成后续发四个层面设计。
  - 这是独立功能主题，必须单开实施阶段。

#### P3-5 报告输出与下载
- 关联行动：`我的目标系统希望能够增加报告输出功能`
- 目标：补“生成可下载报告”的专业化输出能力。
- 核心文件：
  - `src/app/(authenticated)/profile/ai-insights/page.tsx`
  - `src/components/AIAnalyticsOverview.tsx`
  - 后续可能新增导出 route 与模板文件
- 怎么改：
  - 第一阶段优先 HTML/Markdown 可导出，再看 PDF。
  - 需要定义报告模板、导出格式和数据来源。

## 建议执行顺序（按：Bug -> UI -> 功能；每类内按难度升序）

### A. Bug 优先

| 顺序 | 难度 | 对应行动 | 实施项 | 说明 |
| --- | --- | --- | --- | --- |
| 1 | 低 | `bug修复` | `P0-3` Dashboard / Today 空态弹窗一致性修复 | 主要是入口与弹层行为对齐，改动面相对集中 |
| 2 | 低-中 | `bug` | `P0-1` 移动端新增目标入口修复 | 先定位是按钮失效、层级遮挡还是路由弹层冲突 |
| 3 | 中 | `UI、逻辑优化` | `P1-4` 连续火花/统计逻辑校验 | 先校验逻辑是否有误，再决定是修逻辑还是补说明 |
| 4 | 中-高 | `bug`、`看看这个怎么样`、`心路旅程的创建弹窗要够大` | `P0-2` 移动端弹窗软键盘遮挡统一治理 | 涉及多个弹窗与公共基础设施，是第一批里最重的一项 |

### B. UI 优化

| 顺序 | 难度 | 对应行动 | 实施项 | 说明 |
| --- | --- | --- | --- | --- |
| 5 | 低 | `UI优化`、`UI、逻辑优化` | `P1-2` 折叠箭头、全屏/关闭/标题对齐统一 | 纯界面规范统一，收益高、风险低 |
| 6 | 低-中 | `心路旅程的创建弹窗要够大` | `P2-1` 心路旅程弹窗尺寸/全屏优化 | 先做弹窗尺寸和层级，不先碰富文本 |
| 7 | 中 | `UI、逻辑优化` | `P1-1` 目标详情页快速切换其他目标 | 依赖现有 `activeGoals` 数据，属于效率型 UI 增强 |
| 8 | 中 | `UI、逻辑优化` | `P1-3` AI 采纳后的状态反馈可视化 | 主要是状态展示层，不改底层 AI 流程 |
| 9 | 中 | `看看这个怎么样` | `P2-3` 移动端 Select 统一 | 需要统一不同表单里的选择器样式和触达面积 |
| 10 | 中-高 | `灵感和心路旅程页面UI实在是不好看` | `P2-1` 灵感/心路旅程页面与卡片 UI 重做 | 需要统一列表、详情、弹窗三个层次的视觉语言 |

### C. 功能类行动

| 顺序 | 难度 | 对应行动 | 实施项 | 说明 |
| --- | --- | --- | --- | --- |
| 11 | 中 | `看看这个怎么样` | `P2-2` 灵感/心路旅程富文本与图片能力扩展 | 可复用行动编辑器能力，但需要抽组件 |
| 12 | 中 | `可分享到微信？` | `P3-1` 微信友好分享 | 优先做 Web 分享链路增强，不直接上小程序 |
| 13 | 中 | `PC端需要一个快捷入口，类似home系统那样` | `P3-2` PC 快捷入口 + AI 助手入口整理 | 先整理站内/PWA 入口，不直接做原生桌面壳 |
| 14 | 中-高 | `我的目标系统希望能够增加报告输出功能` | `P3-5` 报告输出与下载 | 需要定义模板、导出格式、下载接口 |
| 15 | 高 | `没有将行动同步到我的日历中` | `P3-3` 外部日历同步 | 属于新增外部集成能力 |
| 16 | 高 | `我发现有些行动是每周或每月例行的` | `P3-4` 重复任务 / 周期任务 | 涉及数据模型、生成逻辑、表单设计，是最重的功能项 |

### 审核建议
- 如果你希望“最快看到明显效果”，建议先批准前 6 项。
- 如果你希望“先把目标详情页做顺”，建议批准前 10 项。
- 如果你希望“把产品能力补齐”，再继续审后 6 项功能类行动。

## Assumptions & Decisions
- 假设当前页面“未完成”筛选下的 12 条可见行动，就是本轮要先审计和拆解的待办集合。
- 对于混合项，执行时会拆成多个独立子任务，而不会按原文案整条硬做。
- 第一轮实施优先解决真实可复现的交互缺陷，不直接进入高风险新能力开发。
- 所有大功能项（微信深度分享、日历同步、重复任务、报告导出）在实施前都需要再写单独的小计划或拆分任务。

## Verification
- 页面验证：
  - 目标详情页桌面端 / 移动端都检查
  - 目标列表页、Dashboard、Today 页联动回归
- 交互验证：
  - 新建目标 / 新建行动 / 新建灵感 / 新建心路旅程
  - 折叠/展开、全屏/退出全屏、目标切换、AI采纳状态展示
- 能力验证：
  - 富文本图片上传与查看
  - 移动端键盘弹出后的输入区与底部按钮可见性
  - Dashboard 与 Today 入口行为一致
- 文档输出：
  - 按上述顺序逐项实现，不跳步，不混做超范围功能。
