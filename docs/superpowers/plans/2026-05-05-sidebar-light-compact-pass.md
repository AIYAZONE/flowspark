# Goals Sidebar Light Compact Pass Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `goals` 桌面端左侧栏在现有浅色窄栏基础上再收一档，做成“轻极致紧凑版”，同时保留 `icon 上 / 文字下` 与双行文字能力。

**Architecture:** 保持 `Sidebar` 组件的数据结构、路由高亮逻辑和退出弹窗逻辑不变，只在 `Sidebar.tsx` 内继续压缩宽度、头部高度、菜单项尺寸和激活态强度。移动端组件与布局接入点不改，以单文件视觉微调完成本轮收敛。

**Tech Stack:** Next.js App Router、React Client Component、TypeScript、Tailwind CSS、Lucide React、shadcn/ui

---

### Task 1: 收紧整栏宽度与顶部 logo 区

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 将侧栏宽度从约 `100px` 再收一档**

目标宽度控制在 `92px~96px`，并同步减小左右内边距，避免出现“边框很窄但内部留白仍然大”的问题。

- [ ] **Step 2: 压缩顶部头部高度**

将顶部 header 高度从当前 `h-20` 继续下压，保留 logo-only 头部，但减少垂直留白。

- [ ] **Step 3: 放大 logo 本体但减轻容器存在感**

继续使用 `BrandMark`，通过 `scale` 或更轻容器实现视觉放大；避免重新出现厚重卡片感。

### Task 2: 将菜单项改为轻极致紧凑入口

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 收窄单项最大宽度**

将菜单项 `max-w` 从当前 `72px` 再收一档，使其更贴合窄栏宽度。

- [ ] **Step 2: 收紧 vertical rhythm**

减少：
- `gap`
- `padding-y`
- `line-height`
- 菜单项间距

保留双行文字能力，但让整体更像紧凑入口而不是按钮卡片。

- [ ] **Step 3: 继续减弱卡片感**

默认态尽量接近透明；仅在 hover 和 active 时给很轻的背景与强调，避免重新出现方块感。

- [ ] **Step 4: 收敛激活态**

激活态继续保留 `primary` 视觉锚点，但降低块面感和强度，避免“重选中块”。

### Task 3: 压缩底部退出区

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 收紧底部按钮尺寸**

缩小底部按钮高度与内部间距，使其与上方菜单节奏一致。

- [ ] **Step 2: 保持退出逻辑不变**

保留：
- `AlertDialog`
- `handleSignOut`
- `aria-label`

仅改视觉表达。

### Task 4: 验证

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Verify: `src/app/(authenticated)/layout.tsx`

- [ ] **Step 1: 运行类型检查**

Run:

```bash
pnpm -C goals exec tsc --noEmit
```

Expected: PASS，无新增 TypeScript 错误。

- [ ] **Step 2: 运行 lint**

Run:

```bash
pnpm -C goals lint
```

Expected: 不新增与 `Sidebar.tsx` 相关的 lint 问题；已有仓库历史问题可记录但不扩散修复。

- [ ] **Step 3: 浏览器验证桌面端**

检查：
- 侧栏宽度更窄
- logo-only 头部更紧凑
- 菜单项更轻更细
- active 态更克制
- 底部退出按钮更轻

- [ ] **Step 4: 检查路由高亮与退出交互**

Expected:
- `/dashboard` `/today` `/goals` `/potential` `/profile` 高亮逻辑不变
- 退出按钮仍可正常触发弹窗
