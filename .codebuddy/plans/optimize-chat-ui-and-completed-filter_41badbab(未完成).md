---
name: optimize-chat-ui-and-completed-filter
overview: 优化 /chat 页面：把聊天 UI 从硬编码深色+靛紫统一到系统主题（Emerald 主色 + 亮/暗自适应 CSS 变量），消除顶部/底部多余空白，用户消息改为靠右，并加固"绝不推荐已完成任务"的提示词约束。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - System OS
    - Minimalism
    - Emerald Accent
    - Light-first
    - Clean Card
    - Subtle Glow
  fontSystem:
    fontFamily: Geist
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#059669"
      - "#10b981"
    background:
      - "#ffffff"
      - "#09090b"
      - "#18181b"
    text:
      - "#09090b"
      - "#fafafa"
      - "#71717a"
      - "#a1a1aa"
    functional:
      - "#10b981"
      - "#ef4444"
      - "#e4e4e7"
      - "#27272a"
todos:
  - id: theme-tokens
    content: 用主题 token 重写 ChatSurface/Composer/Message/ActionCard/CompleteCard/EmptyState 配色，对齐 primary(emerald)，去除硬编码色
    status: pending
  - id: layout-fix
    content: 重构 ChatSurface 布局：去除重复顶部 padding、面板填充可用高度、弱化顶部渐变、收紧底部留白
    status: pending
    dependencies:
      - theme-tokens
  - id: bubble-align
    content: ChatMessage 用户消息右对齐、助手左对齐带系统标识，气泡改用主题 token
    status: pending
    dependencies:
      - theme-tokens
  - id: prompt-harden
    content: 增强 prompt.ts 硬约束：已完成项零可见性、不从历史复活、空列表只给方向不编造
    status: pending
  - id: verify
    content: 运行 lint/typecheck/单测，并用 [skill:playwright-cli] 截图验收主题一致性与布局、气泡对齐
    status: pending
    dependencies:
      - theme-tokens
      - layout-fix
      - bubble-align
      - prompt-harden
---

## 用户需求

用户针对 `localhost:3000/chat` 页面提出四点优化诉求：

## 核心功能

- **主题统一**：当前聊天页大量硬编码深色与靛紫配色（如 `#0B0E14`、`#7C8CFF`、`#9AA8FF`），与系统主题（Emerald 主色 + Zinc 中性色、CSS 变量驱动、默认亮色）完全不搭，视觉突兀。需改用系统主题 token，使聊天页在亮/暗模式下都与系统一致。
- **消除上下空白**：页面顶部与底部存在大块留白，源于布局层（`layout.tsx` 内层 `pt-8 pb-12`）与 `ChatSurface` 外层重复 padding、固定高度 `h-[calc(100vh-8rem)]`、以及 `h-44` 装饰渐变共同造成。需重构为填充可用高度的紧凑布局。
- **对话气泡靠右**：当前用户消息左对齐（`items-start`），不符合常规对话习惯。需将用户消息改为右侧、助手消息保持左侧并保留"系统"标识。
- **杜绝推荐已完成任务**：用户作为提问方问"接下来要做什么"时，不应再推荐已完成的任务。数据层过滤（`context.ts` 已 `filter((a) => !a.completed)`，`/today` 也按 `completed` 分组）在代码层已正确，需在提示词层再加固：对已完成项零可见性、不得从对话历史"复活"已完成项、待推进列表为空时只给方向不编造任务。

## 技术栈

- 前端：Next.js（App Router）+ React + TypeScript + Tailwind CSS
- 样式：复用系统主题 CSS 变量（`globals.css` 的 `--background`/`--foreground`/`--card`/`--muted-foreground`/`--border`/`--primary`，shadcn 体系），不再硬编码色值
- 字体：Geist（根布局已注入）

## 实现方案

### 关键决策

1. **配色去硬编码、对齐主题**：将 `ChatSurface`/`ChatComposer`/`ChatMessage`/`ChatActionCard`/`ChatCompleteCard`/`ChatEmptyState` 中所有硬编码 hex 替换为主题 token——容器用 `bg-card`/`bg-background`（配合透明度），文字用 `text-foreground`/`text-muted-foreground`，分隔用 `border-border`，强调色统一为 `primary`（emerald）。`ChatCompleteCard` 现有 `#4ADE80` 绿色本就接近 emerald，收敛为 `primary` 体系，保证全站一致。亮/暗自适应由 `globals.css` 的 `:root`/`.dark` 自动处理。
2. **布局重构（消空白）**：`ChatSurface` 外层移除与 `layout.tsx` 重复的 `pt-8 pb-12 md:pt-10`；面板高度由固定 `h-[calc(100vh-8rem)]` 改为填充 `main` 可用高度（`flex flex-col h-full`，会话区 `flex-1 min-h-0 overflow-y-auto`），避免双重滚动与底部塌陷；顶部 `h-44` 渐变缩小/弱化（或改为随主题 `primary` 淡光），composer 底部 padding 收紧，去掉冗余渐变留白。
3. **气泡对齐**：`ChatMessage` 用户分支改为 `flex justify-end` + 气泡 `bg-primary/10 border-primary/20 text-foreground` 并右对齐；助手分支保持左对齐并保留"系统"徽标与"系统判断"标签。
4. **提示词加固（#4）**：在 `prompt.ts` 现有规则基础上明确：模型对已完成项**零可见性**；**不得**从任何对话历史里"复活"已完成任务；当待推进列表为空时仅给方向性建议、**严禁凭空编造**任务。数据层过滤已正确，本项只补强语言约束与降级行为。

### 性能与复用

- 仅替换类名、不改组件结构与数据流程，无新增网络/计算开销；上下文查询与 SSE 流式逻辑保持不变。
- 复用现有 `layout.tsx` 的主题 token 与 padding 约定，避免引入新样式体系。

## 架构设计

修改局限于 `/chat` 专属组件与聊天提示词，不影响 `today`/`profile` 全局系统对话入口。组件树：`ChatSurface` → `ChatConversation` → `ChatMessage`（含 `ChatActionCard`/`ChatCompleteCard`）/ `ChatEmptyState`，底部 `ChatComposer`；后端 `stream`/`complete` 路由与 `context.ts` 过滤不变。

## 目录结构

```
src/components/chat/
├── ChatSurface.tsx        # [MODIFY] 去重复 padding、面板填充高度、弱化顶部渐变、主题化背景
├── ChatComposer.tsx       # [MODIFY] 输入框/按钮去硬编码色，改用 theme token + primary
├── ChatMessage.tsx        # [MODIFY] 用户消息右对齐、助手左对齐；气泡与文字改用 theme token
├── ChatActionCard.tsx     # [MODIFY] 靛紫强调色改为 primary，容器/文字用 card/foreground token
├── ChatCompleteCard.tsx   # [MODIFY] 绿色收敛为 primary 体系，背景用 card token
└── ChatEmptyState.tsx     # [MODIFY] 空状态文案与 chip 卡片改用 theme token
src/lib/chat/
├── prompt.ts              # [MODIFY] 增加"已完成零可见性/不复活/空列表只给方向不编造"硬约束
└── context.ts             # [VERIFY] 确认 !completed 过滤已生效（无需改动，仅复核）
```

## 设计风格

将聊天页从"独立深色紫光面板"改造为与系统完全一致的**系统 OS 风格**：亮色优先、暗色自适应，中性 Zinc 底色 + Emerald 主色点缀，干净克制、卡片轻边框、细微层级阴影，弱化原先夸张的顶部光晕与深色玻璃，使 `/chat` 与 `/today` 等页面视觉同源。

## 页面区块（仅 /chat）

- **顶部状态条**：保留「系统对话 / 来源」小标识，去除大块渐变留白，仅保留一条极淡的 `primary` 顶部微光。
- **会话流**：用户气泡靠右（`primary` 浅底 + 主色边框），助手气泡靠左（`card` 底 + 边框），助手带"系统判断"徽标；流式光标、思考态点阵保留。
- **行动/完成卡片**：统一为 `card` 底 + `border` 描边，主操作用 `primary` 按钮，完成态用 emerald 语义色。
- **空状态**：系统就绪问候 + 人生路径提示 chip，chip 用 `border`/`muted` 风格，hover 显 `primary` 微光。
- **底部输入台**：多行自动伸缩 textarea，容器 `card` 玻璃感、边框 `border`、发送按钮 `primary`，去除过重阴影与额外底部渐变 padding。
- **响应式**：桌面端最大宽度与系统一致（max-w 跟随布局），移动端单列、输入台贴底。

## Agent Extensions

### Skill

- **frontend-design**
- Purpose: 在替换主题 token 与重构聊天布局时，提供高质量的视觉与交互细节（留白节奏、气泡层级、微光与 hover 态），确保成品精致且贴合系统风格。
- Expected outcome: 产出与系统主题一致、干净克制、无多余留白的聊天界面视觉规范与实现要点。
- **playwright-cli**
- Purpose: 改造完成后对 `localhost:3000/chat` 截图，验证主题配色、顶部/底部空白消除、用户气泡靠右，以及对话中"推荐已完成任务"不再出现。
- Expected outcome: 获取亮/暗两种主题下的页面截图与交互验证结果，作为验收依据。