## 目标
- 产出一份可落地、可维护的“项目技术架构说明”，覆盖：技术栈、目录/模块边界、关键数据流（Auth / Supabase / AI / Gamification）、部署与运行、关键约束与风险。
- 输出形式以 Markdown 文档为主，并提供 C4（Context/Container）Mermaid 图；必要处补充关键流程的 Dynamic 图。

## 背景 → 约束 → 方案 → 取舍 → 风险 → 建议（关键决策）
### 1) 架构呈现粒度（C4 级别）
- 背景：项目包含 Next.js App Router、Supabase、AI Route Handlers、PWA、Analytics 等多个边界，口头说明很难复用。
- 约束：文档要能给新加入开发者快速上手；也要能给产品/运营理解系统边界；同时避免过度细节导致维护成本高。
- 方案：
  - A：仅 Context + Container（默认）
  - B：Context + Container + 关键域 Component（仅对 AI / Auth / Goals 选 1-2 个）
- 取舍：A 维护成本最低、覆盖面足；B 能更好解释复杂域，但图多易过时。
- 风险：B 若覆盖过多组件图，会随着重构快速失真。
- 建议：采用 A 为主，增补 1-2 张 Dynamic 图描述高价值请求流（Auth 回调、AI breakdown/goal-setup）。

### 2) 文档落点与结构
- 背景：目前信息分散在 README、next.config、middleware、src/lib、supabase SQL。
- 约束：不改动现有接口与实现；尽量只新增 docs，不引入依赖。
- 方案：
  - A：新增 `docs/architecture/` 下的若干 md（推荐）
  - B：在 README 追加长篇架构章节
- 取舍：A 更模块化，便于持续维护；B 更集中但 README 会膨胀。
- 风险：A 需要建立文档索引与命名规范。
- 建议：采用 A，并在 README 仅加一段“架构文档入口链接”（可选）。

## 执行步骤（只读调研 → 生成文档）
### Step 1：仓库扫描与事实清单（只读）
- 读取并提炼：`package.json`、`next.config.ts`、`middleware.ts`、`tsconfig.json`、`eslint.config.mjs`、`vercel.json`、`src/app` 路由树、`src/lib` 核心库、`supabase/*.sql`。
- 输出“事实表”：技术栈版本、关键依赖、运行脚本、环境变量清单（仅列名称与用途，不记录值）。

### Step 2：模块边界与目录地图
- 按领域划分并映射到目录：
  - Auth（(auth) 路由 + middleware + callback）
  - Authenticated Shell（(authenticated) layout + 导航）
  - Goals / Today / Dashboard（页面、组件、server actions）
  - AI（/api/ai/* + src/lib/ai/* + 反馈/埋点）
  - Gamification（xp/level、reward、DB/RLS）
  - i18n、Analytics、PWA
- 给出“职责/输入输出/依赖”的三列表格，明确哪些是 UI、哪些是 Server Actions、哪些是 Route Handlers、哪些是纯 lib。

### Step 3：关键数据流与访问控制说明
- Auth 访问控制：middleware 的路由保护策略、email confirm 规则、重定向行为。
- Supabase 数据访问：server/client client 封装、RLS 约束、owner_id/user_id 兼容策略。
- AI 请求链路：鉴权→输入校验→provider 调用→schema/质量门槛→输出→落库反馈（若有）。

### Step 4：绘制 C4 图（Mermaid）
- C4 Context：用户/系统/外部系统（Supabase、AI Provider、Vercel Analytics）。
- C4 Container：Next.js Web（App Router + Server Actions + Route Handlers）、Supabase（Auth/DB/Storage）、外部 AI Provider、Analytics、PWA 缓存边界。
- C4 Dynamic（2 张以内）：
  - 登录/回调 exchangeCodeForSession
  - AI breakdown 或 goal-setup step-a/step-b（择一）

### Step 5：落地输出（新增 docs，尽量不改代码）
- 新增：
  - `docs/architecture/overview.md`：一页式架构总览（目录地图 + 关键约束）
  - `docs/architecture/c4-context.md`
  - `docs/architecture/c4-containers.md`
  - `docs/architecture/flows.md`：Dynamic 图 + 关键流程解释
  - `docs/architecture/data-model.md`：核心表/关系/RLS 要点（摘要级）
- 可选：在 README 加“架构文档入口”短链接段落（不展开内容）。

## 验收标准
- 文档能回答：项目是什么、有哪些边界、核心数据怎么流、鉴权在哪里做、AI/DB/存储如何接入、部署运行依赖什么。
- 每个结论都能追溯到具体文件路径（文档中以相对路径引用）。
- Mermaid 图在 GitHub/常见渲染器可渲染（不使用实验性语法）。

## 不做事项（避免范围蔓延）
- 不新增依赖、不改动现有接口、不重构业务逻辑。
- 不写“理想架构”，只总结“现状架构 + 风险点 + 可改进项（可选）”。
