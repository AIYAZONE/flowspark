# Chat 作为主页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/chat` 升级为认证后默认主页面，并将其视觉推进为沉浸式主对话场，同时让 `/system` 退为次级总览页。

**Architecture:** 保持现有 `SystemConversationProvider`、draft 请求和记忆逻辑不变，只调整入口层、导航层和 `/chat` 承载层。视觉改造集中在 `chat/page.tsx`、`SystemConversation.tsx`、`SystemChatComposer.tsx`，路由优先级调整集中在认证跳转与导航组件。

**Tech Stack:** Next.js App Router、React、TypeScript、Tailwind CSS、Supabase Auth、中英文字典。

---

## 文件结构

- 修改：`src/app/(authenticated)/chat/page.tsx`
  - 负责 `/chat` 页面骨架，从“内容页”改成“沉浸式主对话场”
- 修改：`src/components/SystemConversation.tsx`
  - 负责消息主容器视觉，弱化卡片感，增强主场景感
- 修改：`src/components/SystemChatComposer.tsx`
  - 负责底部输入控制台视觉，保持逻辑不变
- 修改：`src/components/Sidebar.tsx`
  - 负责桌面侧边栏顺序，将 `/chat` 提到第一位
- 修改：`src/components/MobileNavBar.tsx`
  - 负责移动端主导航顺序，保持主入口一致
- 修改：`src/components/MobileSidebar.tsx`
  - 负责移动侧边栏顺序，保持主入口一致
- 修改：`src/app/(auth)/login/actions.ts`
  - 登录后默认跳转改为 `/chat`
- 修改：`src/lib/supabase/middleware.ts`
  - 认证用户访问根路径时默认重定向到 `/chat`
- 可能修改：`src/app/page.tsx`
  - 若营销页中已登录用户 CTA 仍指向 `/system`，统一改为 `/chat`
- 测试：`src/lib/system-chat.test.ts`
  - 若需要新增入口相关纯函数断言，补在这里

### Task 1: 切换主入口到 `/chat`

**Files:**
- Modify: `src/app/(auth)/login/actions.ts`
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 搜索所有“认证后默认去 `/system`”的入口**

Run: `rg -n "redirect\\('/system'|new URL\\('/system'|href=\"/system\"" src`
Expected: 命中登录 action、middleware、landing CTA 等入口

- [ ] **Step 2: 先改服务端登录跳转**

将 `src/app/(auth)/login/actions.ts` 中登录成功后的：

```ts
redirect('/system');
```

改为：

```ts
redirect('/chat');
```

- [ ] **Step 3: 改 middleware 的已登录默认落点**

将 `src/lib/supabase/middleware.ts` 中认证用户访问根路径时的：

```ts
return NextResponse.redirect(new URL('/system', request.url));
```

改为：

```ts
return NextResponse.redirect(new URL('/chat', request.url));
```

- [ ] **Step 4: 改首页已登录 CTA**

将 `src/app/page.tsx` 里已登录用户仍指向 `/system` 的 `href` 改为 `/chat`，例如：

```tsx
<Link href={user ? "/chat" : "/login"}>
```

- [ ] **Step 5: 运行定向检查**

Run: `rg -n "redirect\\('/system'|new URL\\('/system'|href=\"/system\"" src/app src/lib src/components`
Expected: 剩余命中只保留明确需要去系统总览页的业务入口，不再有“默认首页跳转”语义

### Task 2: 调整桌面与移动导航顺序

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/MobileNavBar.tsx`
- Modify: `src/components/MobileSidebar.tsx`

- [ ] **Step 1: 先让桌面侧边栏 `/chat` 排第一**

把 `src/components/Sidebar.tsx` 的 `sidebarItems` 从：

```ts
[
  { title: dict.sidebar.dashboard, href: '/system', icon: LayoutDashboard },
  { title: dict.sidebar.chat, href: '/chat', icon: MessageSquare },
]
```

改为：

```ts
[
  { title: dict.sidebar.chat, href: '/chat', icon: MessageSquare },
  { title: dict.sidebar.dashboard, href: '/system', icon: LayoutDashboard },
]
```

- [ ] **Step 2: 同步移动端顺序**

在 `src/components/MobileNavBar.tsx` 与 `src/components/MobileSidebar.tsx` 做同样的顺序调整，保持移动端心智一致。

- [ ] **Step 3: 检查激活态**

确认 `pathname.startsWith(item.href)` 在 `/chat` 上仍正常工作；如果移动端用了不同判断逻辑，同步保持 `/chat` 第一项高亮。

- [ ] **Step 4: 运行定向 lint**

Run: `npm run lint -- src/components/Sidebar.tsx src/components/MobileNavBar.tsx src/components/MobileSidebar.tsx`
Expected: PASS

### Task 3: 把 `/chat` 页面骨架改成沉浸式主对话场

**Files:**
- Modify: `src/app/(authenticated)/chat/page.tsx`

- [ ] **Step 1: 先写目标骨架**

把当前“顶部大卡片 + 对话区 + sticky 输入”的结构，改成：

```tsx
<div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-col">
  <div className="mb-4 flex items-center justify-between gap-3 px-1">
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/75">
        {copy.eyebrow}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {copy.body}
      </p>
    </div>
  </div>

  <div className="flex-1">
    <SystemConversation className="h-full min-h-[28rem]" />
  </div>

  <div className="sticky bottom-4 mt-6">
    <SystemChatComposer ... />
  </div>
</div>
```

- [ ] **Step 2: 删除大 Hero 卡片感**

移除当前：

```tsx
<section className="rounded-3xl border ... p-5 shadow-sm md:p-6">
```

改成轻量状态带，不再使用重边框、重背景和大段标题。

- [ ] **Step 3: 为空会话保留轻引导**

如果 `SystemConversation` 内部已有空状态，就复用；如果没有，则在 `/chat` 页面补一条轻提示文案，要求：

- 不出现大卡片
- 不打断主对话场感
- 文案只提示“直接对系统说你现在想推进什么”

- [ ] **Step 4: 运行页面相关 lint**

Run: `npm run lint -- 'src/app/(authenticated)/chat/page.tsx'`
Expected: PASS

### Task 4: 提升 `SystemConversation` 的主场景感

**Files:**
- Modify: `src/components/SystemConversation.tsx`
- Modify: `src/components/SystemTurn.tsx`
- Modify: `src/components/SystemMessage.tsx`

- [ ] **Step 1: 先弱化外层卡片容器**

把 `SystemConversation.tsx` 当前外层：

```tsx
'rounded-3xl border border-primary/12 bg-linear-to-br ... p-4 shadow-sm'
```

往更轻的方向调整，例如：

```tsx
'rounded-[2rem] border border-border/50 bg-background/55 p-4 shadow-none backdrop-blur-sm md:p-5'
```

- [ ] **Step 2: 让消息容器更像对话主流**

把 turn 列表区的间距、宽度和留白调得更舒展，避免“一个小卡片里套多个小卡片”的感觉。

- [ ] **Step 3: 弱化展开控件存在感**

保留“展开最近 N 条”，但把按钮视觉处理得更轻，不抢主视觉。

- [ ] **Step 4: 若消息卡片过重，同步下调**

若 `SystemMessage.tsx` / `SystemTurn.tsx` 目前边框、阴影太重，改成更轻的玻璃层次，但不动其文案结构和主按钮逻辑。

- [ ] **Step 5: 运行定向 lint**

Run: `npm run lint -- src/components/SystemConversation.tsx src/components/SystemTurn.tsx src/components/SystemMessage.tsx`
Expected: PASS

### Task 5: 把 `SystemChatComposer` 做成主输入控制台

**Files:**
- Modify: `src/components/SystemChatComposer.tsx`

- [ ] **Step 1: 保持逻辑不动，只改视觉结构**

禁止改这些逻辑：

- `appendSubmittingTurn`
- `replaceLastTurnWithResponse`
- `requestDraft`
- `focus/prefill`

- [ ] **Step 2: 把输入区从“普通卡片”改成“主控制台”**

目标结构：

```tsx
<div className="rounded-[2rem] border border-border/60 bg-background/88 p-3 shadow-lg shadow-black/5 backdrop-blur-xl">
  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary/75">
    对系统说
  </div>
  <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-2">
    <input ... />
    <button ...>发送</button>
  </div>
</div>
```

要求：

- 整体更稳
- 内外层关系清晰
- 不像普通业务表单

- [ ] **Step 3: degraded 状态继续可用**

手动确认“按这个继续”或 focusInput 仍能把文字回填到输入框，不能因视觉重构失效。

- [ ] **Step 4: 运行定向 lint**

Run: `npm run lint -- src/components/SystemChatComposer.tsx`
Expected: PASS

### Task 6: 联调与验收

**Files:**
- Test: `src/lib/system-chat.test.ts`

- [ ] **Step 1: 如新增纯函数或文案分支，补测试**

若这次改动新增了 `/chat` 入口相关纯函数、来源提示 copy 分支或导航顺序生成逻辑，则在 `src/lib/system-chat.test.ts` 或对应纯函数测试中补断言。

- [ ] **Step 2: 跑相关测试**

Run: `node --test src/lib/system-chat.test.ts src/lib/system-conversation/turn-builder.test.ts`
Expected: PASS

- [ ] **Step 3: 跑定向 lint**

Run: `npm run lint -- 'src/app/(authenticated)/chat/page.tsx' src/components/SystemChatComposer.tsx src/components/SystemConversation.tsx src/components/SystemTurn.tsx src/components/SystemMessage.tsx src/components/Sidebar.tsx src/components/MobileNavBar.tsx src/components/MobileSidebar.tsx src/app/(auth)/login/actions.ts src/lib/supabase/middleware.ts src/app/page.tsx`
Expected: PASS

- [ ] **Step 4: 手动路径验收**

依次验证：

1. 未登录访问根路径，仍按原登录流程走
2. 登录成功后默认进入 `/chat`
3. 已登录访问根路径，自动到 `/chat`
4. 桌面和移动导航第一项都是 `/chat`
5. `/chat` 第一眼是主对话场，不再是内容页
6. 输入与回答保持在同一页
7. `/system` 仍可访问，但心智退为总览页

## 自检

- Spec 覆盖：已覆盖默认入口、侧边栏顺序、`/chat` 主视觉、`/system` 次级化、空状态、定向验证
- 占位符扫描：无 TBD / TODO / “自行实现”
- 类型一致性：沿用现有 `SystemConversation` / `SystemChatComposer` 接口，不引入新的未定义类型
