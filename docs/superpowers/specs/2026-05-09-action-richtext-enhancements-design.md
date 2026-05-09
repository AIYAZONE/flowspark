# 行动富文本编辑增强设计

## 1. 背景

`goals` 项目中的“行动”描述已经从纯文本逐步演进为富文本，当前已支持：

- 在新增行动时通过 `ActionDescriptionEditor` 使用 `contentEditable` 编辑 HTML 内容
- 通过粘贴或拖拽上传图片到 `action-images` 存储桶
- 在查看态中通过 `DescriptionMarkdown` 渲染 HTML / Markdown 混合内容

用户本次明确提出三项增强需求：

- 行动新增 / 编辑弹窗支持全屏模式
- 富文本中的图片支持选中后调整大小
- 查看行动详情时，点击图片可查看大图或原图

本次目标是在不引入大型富文本框架的前提下，增强现有富文本链路，使其更适合长内容创作与图片密集场景。

## 2. 当前状态分析

### 2.1 相关文件

- `src/components/ActionDescriptionEditor.tsx`
  - 当前富文本编辑器实现
  - 使用 `contentEditable` 维护 HTML 字符串
  - 已支持图片上传与插入
- `src/components/AddActionDialog.tsx`
  - 新增行动主入口
  - 当前使用 `DialogFormContent`
- `src/components/ActionItem.tsx`
  - 行动查看详情与编辑入口
  - 桌面端查看 / 编辑使用 `DialogFormContent`
  - 移动端查看 / 编辑使用 `SheetFormContent`
- `src/components/ui/dialog.tsx`
  - `DialogFormContent` 已支持 `mobileMode="fullscreen"`
- `src/components/ui/sheet.tsx`
  - `SheetFormContent` 已支持 `mobileMode="fullscreen"`

### 2.2 当前问题

- 新增行动弹窗宽度与高度适合中短文本，不适合持续编辑长描述
- 编辑态查看和输入区域共存，长文档下可视空间明显不足
- 图片插入后无法再次选中、调整大小或做轻量排版
- 查看态图片只是普通内容节点，无法沉浸式预览，也无法快捷打开原图
- 富文本查看逻辑和图片交互逻辑耦合在 `ActionItem` 中，可扩展性一般

## 3. 设计目标

- 让新增 / 编辑行动在长描述场景下具备稳定的“重度编辑模式”
- 让富文本中的图片具备基础文档编辑能力：选中、缩放、持久保存
- 让查看态图片具备站内大图预览和原图访问能力
- 保持当前 HTML 存储格式兼容，不做一次性重构
- 尽量复用现有 `DialogFormContent` / `SheetFormContent` 的 `fullscreen` 能力

## 4. 非目标

- 不重写为 TipTap / ProseMirror 等完整富文本框架
- 不引入图片裁剪、旋转、滤镜、对齐工具栏
- 不做多图轮播图库
- 不重做行动详情整体信息架构
- 不修改后端表结构和图片上传存储桶结构

## 5. 方案决策

### 5.1 采用方案

采用“保留现有 `contentEditable` 架构，在现有组件上增量增强”的方案。

### 5.2 决策说明

#### 背景

当前富文本能力已经覆盖上传与回显，问题主要集中在编辑体验不足和查看态图片交互缺失。

#### 约束

- 不希望为了 3 个能力引入大型编辑器依赖
- 现有存量描述内容已经是 HTML 字符串，需保持兼容
- 行动新增、编辑、查看分别分布在多个组件，方案要可拆分落地

#### 方案

- 继续使用 `ActionDescriptionEditor`
- 在新增 / 编辑弹窗中增加可切换全屏模式
- 在编辑器中增加图片选中态与拖拽缩放能力
- 在查看态增加站内大图预览层和“打开原图”入口

#### 取舍

- 优点：
  - 改动集中
  - 兼容现有 HTML 数据
  - 实现范围可控
- 缺点：
  - 需要自己维护 `contentEditable` 与图片交互
  - 不具备成熟富文本框架的完整扩展生态

#### 风险

- `contentEditable` 内图片选中、拖拽、光标恢复处理存在细节成本
- 查看态当前使用 `dangerouslySetInnerHTML`，需要谨慎接入图片点击代理

#### 建议

先做最小完整闭环：

- 可切换全屏
- 单图选中后拖拽缩放
- 单图站内预览 + 原图入口

## 6. 交互设计

### 6.1 全屏编辑模式

#### 目标

在保留普通弹窗轻量路径的前提下，为长内容编辑提供更大工作区。

#### 行为规则

- 新增行动：
  - 默认仍以当前弹窗尺寸打开
  - 头部增加“全屏 / 退出全屏”切换按钮
- 编辑行动：
  - 默认仍使用当前详情弹层
  - 当进入编辑态时允许切换全屏
- 切换全屏时：
  - 当前表单值、图片上传状态、AI 拆解状态不得丢失
  - 只改变容器展示方式，不触发组件卸载重建

#### 布局规则

- 桌面端全屏：
  - 弹层占据视口主体
  - 顶部保留标题、全屏切换、关闭按钮
  - 中部为可滚动内容区
  - 底部提交区固定在视口内可见区域
- 移动端全屏：
  - 使用 `DialogFormContent` / `SheetFormContent` 的 `mobileMode="fullscreen"`
  - 表单主体全高滚动
  - 兼容安全区

### 6.2 图片选中与缩放

#### 目标

让用户在编辑器中像轻量文档工具一样调整图片尺寸。

#### 行为规则

- 点击图片时进入“图片选中态”
- 选中态表现：
  - 图片出现描边
  - 右下角出现拖拽缩放手柄
- 拖动缩放手柄时：
  - 以宽度为主做等比缩放
  - 实时更新图片宽度
  - 图片高度自动保持比例
- 点击编辑器其他区域后，选中态消失

#### 尺寸约束

- 最小宽度建议 `96px`
- 最大宽度不超过编辑器内容区宽度
- 最终尺寸直接写入图片节点内联样式：
  - `width`
  - `max-width: 100%`
  - `height: auto`

#### 数据持久化

- 编辑器保存值仍为 HTML 字符串
- 调整大小后通过 `syncEditorValue(editor.innerHTML)` 写回
- 查看态直接复用已持久化的图片尺寸

### 6.3 查看态图片预览

#### 目标

让查看行动详情时的图片支持沉浸式浏览和原图访问。

#### 行为规则

- 查看态描述中的图片默认可点击
- 点击图片后打开站内图片预览层
- 预览层提供：
  - 当前大图展示
  - 关闭按钮
  - “打开原图”按钮
- 打开原图时：
  - 使用图片原始 URL
  - 新标签页打开

#### 范围边界

- 本次只支持单张预览
- 多图场景下点击哪张图就预览哪张图
- 不提供左右切换图库

## 7. 组件设计

### 7.1 `ActionDescriptionEditor`

新增职责：

- 维护当前选中图片节点
- 响应图片点击，切换选中态
- 渲染缩放手柄
- 处理拖拽缩放并同步 HTML

建议拆分的内部能力：

- `selectedImageRef`
- `resizeStateRef`
- `applyImageSelectionStyles()`
- `clearImageSelectionStyles()`
- `syncSelectedImageWidth()`

### 7.2 `AddActionDialog`

新增职责：

- 管理新增弹窗 `isFullscreen`
- 头部渲染切换全屏按钮
- 控制 `DialogFormContent` 的 className / mode

要求：

- 打开弹窗时默认非全屏
- 关闭弹窗时恢复默认状态

### 7.3 `ActionItem`

新增职责：

- 编辑态管理 `isEditFullscreen`
- 查看态管理 `previewImageUrl`
- 将查看描述逻辑从内联实现中解耦到可复用组件或受控容器

要求：

- 桌面端与移动端在查看态都支持图片预览
- 编辑态切换全屏不影响未保存草稿

### 7.4 新增查看态图片预览组件

建议新增：

- `src/components/RichTextImagePreviewDialog.tsx`

职责：

- 接收图片 URL、打开状态、关闭事件
- 展示图片大图
- 提供“打开原图”入口

可选新增：

- `src/components/RichTextContentView.tsx`

职责：

- 统一查看态 HTML 渲染
- 统一处理图片点击代理
- 让 `ActionItem` 不再直接承载图片交互细节

## 8. 实现策略

### 8.1 改动文件

主要修改：

- `src/components/ActionDescriptionEditor.tsx`
- `src/components/AddActionDialog.tsx`
- `src/components/ActionItem.tsx`

建议新增：

- `src/components/RichTextImagePreviewDialog.tsx`
- `src/components/RichTextContentView.tsx`

可复用但不需要改动结构的文件：

- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`

### 8.2 具体改动项

1. 在新增行动弹窗中增加 `isFullscreen` 状态与切换按钮
2. 在编辑态详情中增加 `isEditFullscreen` 状态与切换按钮
3. 为富文本编辑器增加图片选中态、缩放手柄与尺寸回写
4. 将查看态描述渲染抽到独立容器，统一处理图片点击
5. 新增站内图片预览弹层组件

### 8.3 接口稳定性

- 行动保存接口不变
- 描述字段仍保存为 HTML 字符串
- 图片上传接口与附件清单字段不变
- 现有 `ActionDescriptionEditor` 输入输出接口尽量保持兼容，只增加可选交互能力

## 9. 安全与兼容性

### 9.1 HTML 安全

查看态仍需保留当前对危险标签和内联事件的清洗逻辑：

- 去除 `script`
- 去除 `style`
- 去除 `iframe`
- 去除 `on*` 事件属性
- 去除 `javascript:`

本次新增图片点击能力不得绕过现有安全清洗。

### 9.2 图片兼容

- 存量 `<img>` 无尺寸样式时，默认按 `max-width: 100%` 渲染
- 新插入或调整后的图片允许带 `width` 内联样式
- 查看态必须兼容旧内容和新内容

## 10. 验收标准

- 新增行动弹窗可在普通模式与全屏模式间切换
- 编辑行动弹层可在普通模式与全屏模式间切换
- 切换全屏前后，已输入内容和上传状态不丢失
- 编辑器中的图片可点击选中并通过拖拽手柄缩放
- 保存后重新打开，图片尺寸保持一致
- 查看态点击图片可以打开站内大图预览
- 预览层支持打开原图
- 不新增大型富文本依赖
- 不修改后端表结构

## 11. 验证清单

- 新增行动：
  - 普通模式输入长描述
  - 切换全屏
  - 继续编辑并提交
- 编辑行动：
  - 打开已有富文本描述
  - 切换全屏后确认草稿保留
  - 缩放图片并保存
- 查看态：
  - 点击图片后弹出大图预览
  - 点击“打开原图”可访问源图
- 回归：
  - 不含图片的描述仍正常编辑和显示
  - 旧 HTML 内容无异常
  - 移动端底部 `Sheet` 与桌面端 `Dialog` 均无明显布局回归

## 12. 实施备注

- 本次优先保证“长内容编辑可用性”和“图片基础可操作性”
- 如果第一版落地后仍存在编辑器交互瓶颈，后续再评估是否升级为成熟富文本框架
- 若未来需要多图轮播、图片说明、对齐方式等能力，可在 `RichTextContentView` 和 `RichTextImagePreviewDialog` 基础上继续扩展
