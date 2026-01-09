# 个人目标系统 UI/UX 设计规范 (UI/UX Design Specification)

## 1. 设计概述 (Design Overview)

### 1.1 设计理念

本系统的设计核心在于平衡“**工具的理性**”**与**“**成长的感性**”。

* **极简 (Minimalism)**：去除所有不必要的装饰，让用户的注意力聚焦于“目标”与“行动”本身。

* **科技感 (Tech Aesthetics)**：通过精准的排版、微光泽的色彩和流畅的动效，营造一种先进、智能的氛围，区别于传统的纸质记录感。

* **高级感 (Premium Feel)**：利用留白、细线条和高质感的灰阶背景，打造如同高端电子产品般的精致体验。

### 1.2 用户体验目标

* **无压力开启**：界面应轻盈、通透，减少用户的心理负担，让“打开应用”这件事变得轻松。

* **多巴胺反馈**：通过色彩和微动效，让每一次“完成”操作都成为一次小小的奖励，促进用户高频使用。

* **高效流 (Flow)**：操作路径极短，避免复杂的层级跳转，确保用户在 3 秒内能完成核心记录。

***

## 2. 色彩体系 (Color System)

采用“高饱和度点缀 + 低饱和度背景”的策略，既保证长时间使用的舒适度，又能在关键时刻通过色彩刺激大脑。

### 2.1 主色调 (Primary Color)

* **电光翡翠 (Electric Emerald)**

  * **色值**: `#059669` (Light Mode) / `#34D399` (Dark Mode)

  * **语义**: 成长、激活、生命力、科技。

  * **应用**: 核心操作按钮、进度条高亮、完成状态、关键数据。

  * **设计意图**: 区别于沉闷的森林绿或刺眼的纯绿，这种绿色带有一种“荧光感”和“通透感”，显得更年轻、更具科技属性。

### 2.2 辅助色 (Secondary Colors)

* **全息蓝 (Holographic Blue)**

  * **色值**: `#3B82F6`

  * **语义**: 智慧、冷静、数据。

  * **应用**: 图表数据线、链接、次要提示。

* **星云紫 (Nebula Purple)**

  * **色值**: `#8B5CF6`

  * **语义**: 愿景、梦想、高级感。

  * **应用**: 长期目标（Vision）的背景渐变、特殊成就徽章。

* **活力橙 (Vitality Orange)**

  * **色值**: `#F97316`

  * **语义**: 紧迫、能量。

  * **应用**: 连续打卡火焰图标、未完成提醒。

### 2.3 中性色与背景 (Neutrals & Backgrounds)

* **陶瓷白 (Ceramic White)**

  * **色值**: `#FFFFFF` (纯白) / `#FAFAFA` (极淡灰)

  * **应用**: 亮色模式下的卡片背景，营造干净、类似陶瓷的质感。

* **深岩灰 (Slate Grey)**

  * **色值**: `#0F172A` (背景) / `#1E293B` (卡片)

  * **应用**: 暗色模式背景，带有蓝调的深灰，比纯黑更具高级感和透气感。

* **钛金灰 (Titanium)**

  * **色值**: `#64748B`

  * **应用**: 次要文字、未激活图标。

***

## 3. 视觉规范 (Visual Language)

### 3.1 字体 (Typography)

放弃系统默认字体，优先使用具有数字美感的现代无衬线字体。

* **英文字体**: Inter 或 Geist Sans (强调数字显示的等宽性和几何感)。

* **中文字体**: PingFang SC (Mac) / Noto Sans SC，字重略微调细，增加透气感。

* **层级**:

  * **H1**: 24px, Bold, 紧凑字间距 (Tracking -0.02em)。

  * **H2**: 18px, SemiBold。

  * **Body**: 14px, Regular, 适中的行高 (1.5)。

  * **Caption**: 12px, Medium, 灰色。

### 3.2 图标 (Iconography)

* **风格**: **细线条 (Fine Stroke)**。

* **笔触**: 统一 1.5px 或 1px 描边。

* **特征**: 锐利、简洁，无填充（Active 状态可适当填充）。

* **推荐库**: Lucide React (与 shadcn/ui 完美配合)。

### 3.3 质感与光影 (Texture & Light)

* **微边框 (Micro-border)**: 卡片不依赖沉重的阴影，而是使用 1px 的极淡边框（如 `#E2E8F0`）来界定范围，显得更轻薄。

* **弥散光 (Subtle Glow)**: 在“今日核心行动”等重点模块，可以使用极低透明度的同色系弥散阴影，营造悬浮感。

* **玻璃拟态 (Glassmorphism)**: 在导航栏或浮层背景使用高斯模糊（Backdrop Blur），增加层次感和科技感。

***

## 4. 界面布局与组件 (Layout & Components)

### 4.1 布局原则 (Layout Principles)

* **呼吸感 (Breathing Space)**: 增大模块间距（24px - 32px），避免信息拥挤。

* **网格系统 (Grid System)**: 严格对齐，保证视觉秩序。

* **中心化 (Centralized)**: 核心行动始终处于视觉中心或最易点击区域。

### 4.2 关键组件设计 (Key Components)

#### A. 仪表盘 (Dashboard)

* **核心行动卡片**:

  * 占据最显眼位置。

  * 设计为一张“票据”或“通行证”样式，带有虚线分割。

  * 右侧配备巨大的、令人想点击的“完成”按钮（圆形或圆角矩形）。

* **进度展示**:

  * 使用**环形进度条**或**极细线条进度条**。

  * 进度增长时带有平滑动画。

#### B. 目标列表 (Goals List)

* **卡片式设计**: 每个目标一张卡片。

* **进度可视化**: 进度条不再是简单的色块，可以带有微弱的渐变光泽。

* **状态标签**: 使用“胶囊”样式，半透明背景色 + 实色文字。

#### C. 输入与表单 (Inputs)

* **无框感**: 输入框平时仅显示底部线条或极淡的全框，聚焦（Focus）时通过光晕或颜色变化强调。

* **行内编辑**: 尽可能支持点击文字直接编辑，减少跳转。

#### D. 按钮 (Buttons)

**设计变量**
- 形状：shape=pill（默认圆角）｜ default（中圆角）
- 尺寸：sm(h-9 px-3)｜default(h-10 px-4 py-2)｜lg(h-11 px-8)｜icon(h-10 w-10)
- 颜色源：primary、secondary、destructive、foreground、muted、border、background

**变体配色与交互**
- default（主操作）：bg-primary、text-primary-foreground、hover:bg-primary/85、active:bg-primary/80、shadow-sm/hover:shadow-md
- secondary（次级）：bg-secondary、text-secondary-foreground、hover:bg-secondary/80、active:bg-secondary/70、shadow-sm
- outline（描边）：border border-border、bg-background、hover:bg-primary/5 + hover:border-primary/40、text-foreground
- ghost（幽灵）：bg-transparent、text-muted-foreground、hover:bg-muted/50 + hover:text-foreground
- destructive（危险）：bg-destructive、text-destructive-foreground、hover:bg-destructive/90、active:bg-destructive/80、shadow-sm
- link（文本）：text-primary、hover:underline（underline-offset-4）

**交互细节**
- 焦点可见：focus-visible:ring-2 + ring-offset-2
- 动效：transition-all duration-200、active:scale-95
- 禁用：disabled:pointer-events-none + disabled:opacity-50
- 形状策略：主行动默认使用 pill；密集工具条或弱操作可用 default

## 5. 交互与动效 (Interaction & Motion)

让系统“活”起来的关键，避免死板的数据库操作感。

* **完成反馈**:

  * 当用户勾选完成时，播放一个微小的弹跳（Bounce）动画。

  * 文字出现删除线时，颜色平滑变淡。

* **页面转场**:

  * 模块之间采用轻微的**上浮淡入 (Fade Up)** 效果，而不是生硬的切换。

* **加载状态**:
  * 表单提交统一使用 Spinner + 保留文案；pending 时禁用按钮避免重复提交；图标在加载中隐藏
  * 页面整体数据加载优先使用骨架屏 (Skeleton)，保持结构稳定

* **提交交互（SubmitButton）**:
  * 基于 useFormStatus 的 pending 态
  * 保留按钮文案并在左侧显示统一 Spinner
  * pending 时自动禁用按钮；焦点环与禁用态样式保持一致

***

## 6. 总结 (Summary)

这套设计规范旨在打造一个\*\*“不仅好用，而且好看”\*\*的个人目标系统。通过电光翡翠色与极简布局的结合，传达出“高效、冷静、进取”的产品气质，让用户在每一次打开应用时，都能感受到一种向上的力量。

## 无障碍与图表视觉准则

* 无障碍：对交互元素提供清晰的 label/aria 属性；保证键盘可达性

* 对比度：文本与背景对比度满足 WCAG AA
* 图表：线条粗细与颜色语义统一；悬停交互显示精确数值与时间

**按钮可访问性**
- 焦点可见：任何主题下均可见的 focus-visible
- 点击目标：移动端可触达区域≥44×44px（使用 lg 或增加外边距）
- 禁用元素不可聚焦；按下反馈一致（active:scale-95）

**使用准则与场景映射**
- 表单提交：SubmitButton default + pill
- 编辑保存：default + pill；取消：outline/ghost
- 新建弹窗主按钮：default + pill；弹窗次级按钮：outline
- 删除/归档：destructive + pill
