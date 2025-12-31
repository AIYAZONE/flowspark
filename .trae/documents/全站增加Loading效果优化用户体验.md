**目标**

* 解决所有接口调用或页面访问慢的问题，通过增加不同的 Loading 效果减少用户焦虑。

**分析**

* 这是一个全局性的 UX 优化，需要覆盖多个层面：

  1. **路由切换 Loading**：Next.js 的 `loading.tsx` 文件，用于页面首次加载或路由跳转。

  2. **异步操作 Loading**：Server Actions (如创建、更新、删除) 提交时的按钮状态反馈。

  3. **局部数据 Loading**：如仪表盘图表、列表等组件的 Suspense fallback。

**实施计划**

1. **全局路由 Loading (Global Route Loading)**

   * 创建 `src/app/loading.tsx`：为根路由提供一个全屏或居中的加载指示器（如 Spinner 或骨架屏），处理首次加载和大型页面切换。

   * 创建 `src/app/(authenticated)/loading.tsx`：为已登录区域提供更贴合布局的 Loading（如侧边栏保留，仅主内容区域显示 Loading）。

2. **Server Actions Loading (Interactive Feedback)**

   * 检查并增强所有表单提交按钮：

     * `src/components/AddActionDialog.tsx`: 确保提交时按钮显示 "Submitting..." 或 Spinner。

     * `src/components/GoalDetailsCard.tsx`: 编辑模式下的保存按钮。

     * `src/app/(authenticated)/goals/new/page.tsx`: 创建目标页面的提交按钮。

     * `src/components/ActionItem.tsx`: 编辑/删除操作的 Loading 状态（已有 `isLoading` 状态，需检查视觉反馈是否明显）。

   * 使用 `useFormStatus` (React Hook) 或 `useState` + `transition` 来管理提交状态。

3. **局部组件 Suspense (Component Level Loading)**

   * 仪表盘 (Dashboard) 内容较多，可以将耗时组件（如 `ScoreTrendChart`）包裹在 `<Suspense>` 中，并提供 Skeleton Fallback。

   * 目标列表和行动列表：在数据加载时显示列表骨架屏。

**具体步骤**

1. **创建全局 Loading 组件**：在 `src/components/ui/loading-spinner.tsx` 创建一个通用的 Spinner 组件。

2. **添加路由级 Loading**：

   * `src/app/loading.tsx`

   * `src/app/(authenticated)/loading.tsx`

3. **增强交互 Loading**：

   * 修改 `AddActionDialog`，使用 `useFormStatus` 或 `isSubmitting` 状态。

   * 修改 `ActionItem`，确保 `isLoading` 状态下按钮变灰或显示 Spinner。

   * 检查 `goals/new/page.tsx` 的表单提交体验。

4. **添加骨架屏**：

   * 创建 `src/components/ui/skeleton.tsx` (如果未安装 shadcn/ui skeleton，需手动创建)。

   * 在仪表盘关键区域应用 Suspense + Skeleton。

**本轮重点**

* 优先实现路由级 Loading 和关键交互的 Loading 反馈，这是最直接减少焦虑的方式。

* 鉴于用户提到“所有接口调用”，重点强化 Server Actions 的反馈。

