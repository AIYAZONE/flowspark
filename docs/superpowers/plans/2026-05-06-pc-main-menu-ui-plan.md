# Goals PC 主菜单 UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `goals` 桌面端左侧主菜单改为固定单态的 2 列卡片式入口，采用“上 icon / 下文字”布局，并移除展开/收起与 tooltip 逻辑。

**Architecture:** 保持 `Sidebar` 组件对外接口不变，只在组件内部重构桌面端主菜单的状态与样式。移动端 `MobileNavBar` 和 `MobileSidebar` 不改，布局接入点 `layout.tsx` 不改，从而把风险压缩到单文件主改造。

**Tech Stack:** Next.js App Router、React Client Component、TypeScript、Tailwind CSS、Lucide React、shadcn/ui

---

### Task 1: 清理侧栏双态逻辑

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 删除折叠态相关 import**

移除：
- `useEffect`
- `createPortal`
- `ChevronLeft`
- `ChevronRight`

- [ ] **Step 2: 删除折叠态与 tooltip 状态**

删除：
- `isCollapsed`
- `tooltip`
- `showTooltip()`
- `hideTooltip()`
- `SidebarFloatingTooltip`

- [ ] **Step 3: 删除折叠按钮**

删除侧栏中部绝对定位的折叠切换按钮，避免保留无效交互。

- [ ] **Step 4: 固定桌面侧栏宽度**

将侧栏容器由：

```tsx
isCollapsed ? "w-16" : "w-64"
```

改为固定宽度，目标区间为 `w-[232px]` 或等效 Tailwind 宽度。

- [ ] **Step 5: 保持品牌区与底部退出区功能不变**

只允许做对齐与间距微调，不改变退出弹窗和登出逻辑。

### Task 2: 重构桌面主菜单为 2 列卡片

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 改写主菜单容器**

将当前：

```tsx
<nav className="grid items-start px-2 text-sm font-medium gap-1">
```

改为适合桌面端的 2 列 grid，例如：

```tsx
<nav className="grid grid-cols-2 gap-2 px-3">
```

- [ ] **Step 2: 改写导航项结构**

将当前横向导航项：

```tsx
"flex items-center ..."
```

改为竖向卡片：

```tsx
"flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl ..."
```

- [ ] **Step 3: 将图标置于文字上方**

保留现有 `item.icon`，增大尺寸到 `h-5 w-5` 或 `h-6 w-6`，并把文案放到图标下方。

- [ ] **Step 4: 优化激活态与 hover 态**

默认态使用浅底、弱边框、弱 hover；
激活态使用主色浅底 + 主色文字/icon + 轻边框/轻阴影。

- [ ] **Step 5: 处理文字换行和对齐**

文字使用居中对齐，允许 2 行内展示，避免英文或较长文案导致卡片高度抖动。

### Task 3: 调整品牌区和底部视觉衔接

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 品牌区轻微收敛**

保持 `BrandMark + 文案` 结构不变，只做 spacing / 对齐微调，让其和新卡片菜单风格更统一。

- [ ] **Step 2: 底部退出区保持稳定**

继续使用当前 `AlertDialog` 结构，仅做容器间距与按钮样式微调，避免与新主菜单割裂。

- [ ] **Step 3: 清理因折叠态移除产生的分支**

删除所有 `isCollapsed ? ... : ...` 分支，统一成单态渲染，减少组件复杂度。

### Task 4: 验证与回归检查

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Verify: `src/components/MobileNavBar.tsx`
- Verify: `src/app/(authenticated)/layout.tsx`

- [ ] **Step 1: 运行类型检查**

Run:

```bash
pnpm -C goals exec tsc --noEmit
```

Expected: PASS，无 TypeScript 错误。

- [ ] **Step 2: 运行 lint**

Run:

```bash
pnpm -C goals lint
```

Expected: 不新增错误；若有历史 warning，记录为非本次引入。

- [ ] **Step 3: 启动本地页面**

Run:

```bash
pnpm -C goals dev
```

Expected: 本地开发服务正常启动。

- [ ] **Step 4: 手动检查桌面端**

检查：
- `/dashboard`
- `/today`
- `/goals`
- `/potential`
- `/profile`

Expected:
- 左侧为固定单态
- 主菜单为 2 列卡片
- `icon` 在上、文字在下
- 当前路由高亮正确

- [ ] **Step 5: 手动检查移动端无回归**

Expected:
- `MobileNavBar` 不变
- `MobileSidebar` 不变
- 布局未因桌面端侧栏改造产生回归

- [ ] **Step 6: 提交实现**

```bash
git -C goals add src/components/Sidebar.tsx
git -C goals commit -m "feat: refresh desktop main menu ui"
```
