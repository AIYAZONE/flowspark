# Action Richtext Enhancements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `goals` 项目的行动描述补齐全屏编辑、编辑器图片缩放、查看态大图预览能力。

**Architecture:** 保留现有 `contentEditable` + HTML 字符串存储方案，在 `ActionDescriptionEditor` 上增量增强图片交互；在 `AddActionDialog` 与 `ActionItem` 中增加全屏状态控制；新增轻量查看态渲染与图片预览组件，避免把所有图片逻辑堆在 `ActionItem` 内。

**Tech Stack:** Next.js 16, React 19, TypeScript, Radix Dialog/Sheet, Tailwind CSS, Supabase Storage

---

### Task 1: 文案与查看态组件

**Files:**
- Create: `src/components/RichTextImagePreviewDialog.tsx`
- Create: `src/components/RichTextContentView.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1: 新增查看态图片预览组件**

```tsx
export function RichTextImagePreviewDialog(props: {
  open: boolean
  imageUrl: string | null
  onOpenChange: (open: boolean) => void
  dict: { openOriginal: string; close: string }
}) {
  return null
}
```

- [ ] **Step 2: 新增富文本查看组件**

```tsx
export function RichTextContentView(props: {
  html: string
  compact?: boolean
  onImageClick?: (url: string) => void
}) {
  return null
}
```

- [ ] **Step 3: 补齐查看态图片预览相关中英文文案**

```json
{
  "openOriginal": "打开原图",
  "fullscreen": "全屏",
  "exitFullscreen": "退出全屏"
}
```

- [ ] **Step 4: 运行诊断验证新增组件和字典字段无报错**

Run: `npm run lint -- src/components/RichTextImagePreviewDialog.tsx src/components/RichTextContentView.tsx`
Expected: lint 通过，或仅出现与当前任务无关的既有告警

### Task 2: 富文本编辑器图片缩放

**Files:**
- Modify: `src/components/ActionDescriptionEditor.tsx`

- [ ] **Step 1: 给编辑器增加图片选中态**

```tsx
const selectedImageRef = useRef<HTMLImageElement | null>(null)
const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null)
```

- [ ] **Step 2: 给选中图片渲染缩放手柄并绑定拖拽逻辑**

```tsx
function syncSelectedImageWidth(nextWidth: number) {
  selectedImageRef.current?.style.setProperty("width", `${nextWidth}px`)
  selectedImageRef.current?.style.setProperty("max-width", "100%")
  selectedImageRef.current?.style.setProperty("height", "auto")
}
```

- [ ] **Step 3: 在失焦、点击空白处、删除图片时清理选中态**

```tsx
function clearImageSelectionStyles() {
  selectedImageRef.current = null
}
```

- [ ] **Step 4: 确认缩放后 HTML 能通过 `syncEditorValue(editor.innerHTML)` 回写**

Run: `npm run lint -- src/components/ActionDescriptionEditor.tsx`
Expected: lint 通过

### Task 3: 新增弹窗全屏模式

**Files:**
- Modify: `src/components/AddActionDialog.tsx`

- [ ] **Step 1: 为新增弹窗增加 `isFullscreen` 状态**

```tsx
const [isFullscreen, setIsFullscreen] = useState(false)
```

- [ ] **Step 2: 在头部加入全屏切换按钮**

```tsx
<Button type="button" variant="ghost" size="sm" onClick={() => setIsFullscreen((v) => !v)}>
  {isFullscreen ? dict.common.exitFullscreen : dict.common.fullscreen}
</Button>
```

- [ ] **Step 3: 根据状态切换 `DialogFormContent` 尺寸和 `mobileMode`**

```tsx
<DialogFormContent mobileMode={isFullscreen ? "fullscreen" : "sheet"} />
```

- [ ] **Step 4: 关闭弹窗时重置全屏状态**

Run: `npm run lint -- src/components/AddActionDialog.tsx`
Expected: lint 通过

### Task 4: 编辑态全屏与查看态大图预览

**Files:**
- Modify: `src/components/ActionItem.tsx`

- [ ] **Step 1: 用 `RichTextContentView` 替换现有查看态描述渲染**

```tsx
<RichTextContentView html={action.description || ""} onImageClick={setPreviewImageUrl} />
```

- [ ] **Step 2: 为编辑态增加 `isEditFullscreen` 状态与切换按钮**

```tsx
const [isEditFullscreen, setIsEditFullscreen] = useState(false)
```

- [ ] **Step 3: 桌面端 `DialogFormContent` 和移动端 `SheetFormContent` 接入全屏模式**

```tsx
mobileMode={isEditFullscreen ? "fullscreen" : "sheet"}
```

- [ ] **Step 4: 接入 `RichTextImagePreviewDialog`，支持站内看图和打开原图**

Run: `npm run lint -- src/components/ActionItem.tsx`
Expected: lint 通过

### Task 5: 整体验证

**Files:**
- Modify: `src/components/ActionDescriptionEditor.tsx`
- Modify: `src/components/AddActionDialog.tsx`
- Modify: `src/components/ActionItem.tsx`
- Create: `src/components/RichTextImagePreviewDialog.tsx`
- Create: `src/components/RichTextContentView.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1: 运行项目级诊断**

Run: `npm run lint`
Expected: 无本次改动引入的新错误

- [ ] **Step 2: 手动验证**

Run:

```bash
npm run dev
```

Expected:
- 新增行动支持普通 / 全屏切换
- 编辑行动支持普通 / 全屏切换
- 图片可选中并拖拽缩放
- 查看态点击图片可弹出预览并打开原图

- [ ] **Step 3: 记录验证结果并准备交付**

```bash
git status --short
```
