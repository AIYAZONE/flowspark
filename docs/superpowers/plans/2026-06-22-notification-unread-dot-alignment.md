# Notification Unread Dot Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让未读通知在 `个人中心` 导航入口与 `查看通知` 按钮上保持一致可见，并统一为绿色轻提醒语义。

**Architecture:** 保持现有未读数来源 `/api/notifications/counts` 与服务端 `getUnreadNotificationCount()` 不变，只在 `Sidebar.tsx`、`MobileNavBar.tsx` 与 `profile/page.tsx` 内补充统一的视觉标记。实现采用最小 diff，不抽象新组件、不改接口。

**Tech Stack:** Next.js App Router、React、TypeScript、Tailwind CSS、Lucide React、shadcn/ui

---

### Task 1: 统一导航入口未读点语义

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/MobileNavBar.tsx`

- [ ] **Step 1: 保留现有未读显示条件**

继续使用 `notificationUnread > 0` 作为展示条件，不改拉取逻辑与刷新逻辑。

- [ ] **Step 2: 统一未读点颜色**

将未读点显式使用绿色语义色，避免继续跟随 `primary` 造成“品牌主色”和“通知提醒”语义混用。

- [ ] **Step 3: 保持位置与尺寸稳定**

继续使用现有右上角小圆点结构与 `ring-background`，避免产生布局偏移。

### Task 2: 给个人中心页通知按钮补充提醒点

**Files:**
- Modify: `src/app/(authenticated)/profile/page.tsx`

- [ ] **Step 1: 复用已有服务端未读数**

继续使用页面内已拿到的 `unreadNotifications`，不新增客户端请求。

- [ ] **Step 2: 在 `查看通知` 按钮上添加绿色未读点**

仅在 `unreadNotifications > 0` 时渲染右上角小圆点，保证按钮文案、跳转与 `Button asChild` 结构不变。

### Task 3: 验证

**Files:**
- Verify: `src/components/Sidebar.tsx`
- Verify: `src/components/MobileNavBar.tsx`
- Verify: `src/app/(authenticated)/profile/page.tsx`

- [ ] **Step 1: 检查 TypeScript / JSX 诊断**

使用编辑器诊断确认三个改动文件无新增语法或类型问题。

- [ ] **Step 2: 手动检查提醒一致性**

确认：
- `个人中心` 桌面导航有绿色未读点
- `个人中心` 移动导航有绿色未读点
- `查看通知` 按钮有绿色未读点
- 三处样式语义一致
