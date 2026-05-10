## 目标
- 重规划并重构 `/profile/ai-insights/[scene]?rid=...#detail` 的“单条建议详情”体验：信息聚焦、层级清晰、首屏可读、反馈不打断阅读。
- 不改数据接口与后端查询结构，主要通过页面信息架构（IA）与组件展示层重排实现。

## 当前状态（基于代码现状）
### 入口与渲染
- 场景页：[(authenticated)/profile/ai-insights/[scene]/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/profile/ai-insights/%5Bscene%5D/page.tsx#L174-L372)
  - `rid` 解析：`searchParams.rid` → `detailId`，并用 `selectedId = rid || recent[0]` 默认选中一条详情（无 rid 也展示详情）。
  - 详情组件：`<AIRecommendationDetail />` 在 Recent 列表之前渲染（用户在表格里点“查看详情”后，视觉上会觉得“没发生变化”）。
  - `#detail`：仅在带 `rid` 的链接上拼接 hash，但页面主滚动容器在 authenticated layout 的 `<main className="... overflow-y-auto">` 内部，hash 滚动不一定能驱动内部滚动容器定位到 `id="detail"`。
- 详情组件： [AIRecommendationDetail.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/AIRecommendationDetail.tsx#L191-L456)
  - 首屏第一块是“是否有用”的反馈操作，随后是三卡摘要，再是 Output + Outcome（其中 Outcome 标题重复且内容混杂）。
  - Output 的行 label 有大量 `'-'` 或 `minutes`，并使用 `uppercase` 样式，整体呈现“字段噪音”。

### 主要问题（与“杂乱”直接相关）
- 信息层级错位：交互（反馈）先于内容（建议本身），打断理解路径。
- 命名冲突：`aiAnalyticsDetailOutcome` 既表示“结果状态”又作为右侧卡标题，导致语义重复。
- 内容呈现颗粒过细：Output 被拆成多张小卡 + 不稳定 label，导致阅读碎片化。
- 详情模式不聚焦：rid 模式仍展示大量场景概览/表格/技术信息，视觉与心智负担高。
- hash 定位不稳定：在内部滚动容器布局下，`#detail` 可能不滚动到详情区。

## 需求确认（来自本次沟通）
- 详情布局：聚焦详情（rid 模式下进入“回放详情”视角），不把用户困在全貌。
- 默认信息：信息要聚焦，并重构建议内容的详情展示 UI。
- 反馈位置：放底部，避免打断阅读。

## 设计方案（IA 与交互）
### 1) 页面级：rid 进入“聚焦详情模式”
**背景 → 约束 → 方案 → 取舍 → 风险 → 建议**
- 背景：用户从“查看详情”进入后仍看到大量概览与表格，且详情不一定滚动到位，产生“杂乱/没变化”的体验。
- 约束：不改数据查询接口；尽量少改页面结构；保持现有路由与链接兼容。
- 方案：
  - A（执行方案）：当 `rid` 存在时，页面切换为“聚焦详情模式”：
    - 顶部增加“返回最近建议/返回场景页概览”入口（按钮或链接）。
    - 默认只展示：标题/说明（轻）→ 详情卡（建议内容）→ 反馈（底部）。
    - 场景概览（指标卡、使用说明、阻力 Top3、Recent 列表、技术参考）整体移入一个折叠区（`<details>`），默认收起。
  - B（次优）：仍单列展示所有模块，但把详情区移动到 Recent 列表下方并尝试依赖 hash 滚动定位。
- 取舍：A 最符合“详情聚焦”，也能显著降低信息噪音；B 改动更小但对“杂乱”改善有限。
- 风险：折叠过多会让用户找不到历史列表；需要明显的“展开更多”提示与返回入口。
- 建议：采用方案 A。

### 2) 组件级：详情卡重排为“内容优先 + 渐进披露”
**背景 → 约束 → 方案 → 取舍 → 风险 → 建议**
- 背景：当前详情卡把反馈/状态/输出/生成配置混在一起，且 Output 的 label 噪音大，导致难读。
- 约束：不改 `AIRecommendationDetailRow`；不引入新依赖；尽量复用现有 UI 组件（Card/Button/Dialog/details）。
- 方案（以“模块化”重排）：
  - 顶部：标题区（仍复用 `aiAnalyticsDetailTitle`），紧凑展示“结果状态 + 生成时间”。
  - 主体：建议内容（按 scene 做稳定结构）：
    - today_plan：把 variants 以“版本列表”呈现（每个版本一个卡片），默认只露出 `minutes + title`，展开显示“第一步/完成标准”；`reason` 作为“为什么这样建议”单独块展示。
    - rescue：突出 `minimal_variant.title/first_step/done`；`if_then` 折叠或次级展示；`reason_tag` 映射后的阻力作为“你当前卡点”。
    - review：突出 `summary_sentence`；`tomorrow_card.risk`、`if_then`、`suggested_core_action_direction` 分组展示。
    - weekly_insight：突出 `summary`；`recommendation`、`topFriction` 次级展示。
  - 关键指标（聚焦版）：fallback、confidence、completion_minutes、selected option（保持“适中信息量”）。
  - 生成配置（折叠）：strategy/prompt/model + 原始版本号（默认收起）。
  - 技术诊断（折叠）：保留现有 strategy_summary + quality_labels（继续折叠）。
  - 反馈（底部）：保留现有 Dialog 方案，仅把块移动到末尾，并提供“反馈已提交”的轻量显示。
- 取舍：模块化会增加少量组件内部逻辑，但能显著提升可读性并降低“字段噪音”。
- 风险：today_plan variants 折叠后，用户可能看不到“第一步/完成标准”；需保证至少默认展开第一条或提供“展开全部”的明确入口（实现时二选一，详见实施步骤）。
- 建议：按上面模块顺序重构，并移除 Output 行的 `uppercase` 与 `'-'` label 依赖。

### 3) 定位：保证“查看详情”进入后一定定位到详情区
**背景 → 约束 → 方案 → 取舍 → 风险 → 建议**
- 背景：authenticated layout 使用内部滚动容器，hash 滚动可能不生效，造成“点击详情后没跳到详情卡”。
- 约束：不改整体 layout；不引入路由侧副作用；保持 `#detail` 兼容。
- 方案：在 `AIRecommendationDetail` 内用 `useEffect` 在 `detail.recommendation_id` 变化后调用 `element.scrollIntoView()`，确保内部滚动容器也会滚动到 `id="detail"`。
- 取舍：会产生一次自动滚动行为，但只在 rid 切换/加载详情时触发，符合预期。
- 风险：如果用户在页面中部切换 rid，可能出现轻微跳动；需仅在 URL 含 `#detail` 时触发（实现时从 `window.location.hash` 判断）。
- 建议：实现“仅 hash=detail 时滚动”的保护。

## 具体实施步骤（文件级）
### A. 场景页进入“聚焦详情模式”
- 修改文件：[(authenticated)/profile/ai-insights/[scene]/page.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/profile/ai-insights/%5Bscene%5D/page.tsx)
  - 增加 `isDetailMode = Boolean(detailId)`，并按模式重排渲染顺序：
    - Detail mode：Header（含返回）→ `AIRecommendationDetail` → 反馈（已在组件内）→ `<details>` 包裹 “更多信息：概览/阻力/最近建议/技术参考”。
    - Non-detail mode：保持当前顺序或仅做小幅优化（可选：把 `selectedId` 仅在 detail mode 才默认 recent[0]，避免无 rid 也展示详情；此项属于体验优化，若担心行为变化则先不做）。
  - “查看详情”链接维持 `rid + #detail` 不变。
  - detail mode 增加“返回最近建议”按钮：回到不带 rid 的场景页（保留 range 参数）。

### B. 重构 AIRecommendationDetail：内容优先 + 渐进披露
- 修改文件：[AIRecommendationDetail.tsx](file:///Users/brucewang/Documents/AIYA/goals/src/components/AIRecommendationDetail.tsx)
  - 重排模块顺序：标题/状态/时间 → 建议内容（按 scene）→ 关键指标 → 更多信息（折叠：生成配置 + 技术诊断）→ 反馈（底部）。
  - today_plan 输出展示重构：
    - 用 `variantRows()` 生成版本列表，渲染为“版本卡片 + details 折叠第一步/完成标准”。
    - `reason` 改成单独的“为什么这样建议”块（不再作为 outputRows 的一行）。
  - rescue/review/weekly_insight 输出展示重构：
    - 移除 label 为 `'-'` 的行；给每块稳定标题（来自 dict 或本地短文案）。
  - 右侧/次级信息卡不再使用 `aiAnalyticsDetailOutcome` 作为标题，避免与“结果状态”冲突；改用新的 dict key（如 `aiAnalyticsDetailSignalsTitle`、`aiAnalyticsDetailGenerationTitle`）。
  - 加入 `useEffect`：当 `window.location.hash === '#detail'` 且 `detail.recommendation_id` 变化时，滚动到 `id="detail"`。

### C. 文案与 i18n
- 修改文件：
  - [zh.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/zh.json)
  - [en.json](file:///Users/brucewang/Documents/AIYA/goals/src/i18n/en.json)
- 新增/调整的 profile 字段（示例命名，执行时会与现有风格对齐）：
  - `aiAnalyticsDetailSignalsTitle`（关键指标）
  - `aiAnalyticsDetailGenerationTitle`（生成配置）
  - `aiAnalyticsDetailWhyTitle`（为什么这样建议）
  - `aiAnalyticsDetailVariantsTitle`（可选：不同版本）
  - `aiAnalyticsDetailMoreTitle`（更多信息/查看系统生成方式）
  - 保留并复用现有 `aiAnalyticsFeedback*` 文案。

## 验收标准（可直接对照检查）
- rid 模式首屏只看到“建议内容 + 状态/时间 + 关键指标”，不会被概览/表格/技术信息淹没。
- 反馈入口在详情底部，且反馈提交状态清晰可见。
- 不再出现“Outcome”标题重复；“结果状态”与“生成配置/关键指标”语义明确区分。
- Output 不再出现大量 `'-'` label；中文不再被 `uppercase` 强制样式破坏可读性。
- 从 Recent 表格点击“查看详情”后，页面能稳定滚动定位到详情卡（即使主滚动容器是内部 overflow-y）。
- 不改后端接口与数据结构；仅调整前端展示与 i18n 文案。

## 验证步骤（执行阶段会逐条跑）
- 本地手动验收：
  - 进入 `/profile/ai-insights/today_plan?rid=...#detail`：检查首屏信息层级与滚动定位。
  - 在 Recent 列表中点不同条目的“查看详情”：确认自动定位与内容刷新无异常。
  - 逐个场景（today_plan/rescue/review/weekly_insight）都验证：详情结构稳定、折叠逻辑合理。
  - 反馈：点“有用/没用原因”确认能提交并展示“已反馈”。
- 构建验证：
  - `npm run lint`
  - `npm run build`

