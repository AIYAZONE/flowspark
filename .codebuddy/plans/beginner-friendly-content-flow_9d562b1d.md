---
name: beginner-friendly-content-flow
overview: 重构 FlowSpark 内容创作流程，从面向"专业创作者"改为面向"零基础小白"，核心是：Chat 引导式诊断 + 渐进式复杂度 + 术语降维。
design:
  architecture:
    framework: react
  styleKeywords:
    - 克制
    - 安静
    - 渐进
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 15px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#3B82F6"
      - "#2563EB"
    background:
      - "#0F172A"
      - "#1E293B"
    text:
      - "#F8FAFC"
      - "#94A3B8"
    functional:
      - "#22C55E"
      - "#EF4444"
todos:
  - id: rewrite-system-prompt
    content: 重写 prompt.ts：增加水平感知规则，新增「新手辅导模式」规则集，去掉对 XML 标签的强制要求，用日常语言替代表格语言
    status: completed
  - id: simplify-stream-route
    content: 精简 stream/route.ts：移除 extractIdeaFromUserMessage 自动提取逻辑，删除不再需要的 ChatIdeaDraft 导入和 parseIdeaTag 函数
    status: completed
    dependencies:
      - rewrite-system-prompt
  - id: simplify-chat-message
    content: 简化 ChatMessage.tsx：移除 idea 卡片渲染区块（ChatIdeaCard），保留 assets 沉淀卡片作为轻量确认方式
    status: completed
    dependencies:
      - simplify-stream-route
  - id: simplify-brand-studio
    content: 重构 Brand Studio 页面：从 4 面板 Tab 布局改为单页时间线卡片流，按时间倒序展示已沉淀的内容资产
    status: completed
  - id: cleanup-unused-code
    content: 清理废弃代码：移除 store.tsx 中 saveIdea 相关代码、actions.ts 中 saveContentIdeaFromChat、ChatIdeaCard 组件、/api/chat/action/route.ts 中与 idea 相关的逻辑
    status: completed
    dependencies:
      - simplify-stream-route
      - simplify-brand-studio
---

## 用户需求

当前 FlowSpark 的内容创作流程（Chat 对话→idea/action 卡片→Brand Studio 选题库/日历/资产树/人设检查）要求用户理解"选题""角度""钩子""日历排期""资产树"等专业术语。对纯小白用户来说，这些概念完全无法理解，导致"聊一句就卡住、看到卡片不知道点哪个、不知道下一步要干什么"。

用户要求系统性重构，使 Chat 成为一个真正的"小白友好型 AI 辅导系统"：对话驱动、零术语、渐进引导、不填表。

## 核心功能

### 1. 对话式 AI 辅导模式

Chat 需要能**自动判断用户水平**。当用户是纯小白时，AI 切换为"老师/辅导者"角色：

- 不用任何专业术语（不用"选题""角度""钩子"等词）
- 用提问引导用户理清思路，而不是直接吐出结构化卡片
- 每次对话只推进一小步，不追求一次性"填完表"

### 2. 渐进式信息暴露

Brand Studio 不再一上来展示全部 4 个面板。根据用户所在的阶段，只展示当前需要的功能：

- 探索期：只看"定位梳理"和"初步想法"
- 创作期：逐步出现选题列表、内容大纲
- 发布期：出现排期日历和复盘

### 3. 去掉结构化卡片的强制输出

当用户说"想做视频号IP"时，AI 不再输出 action/idea 卡片。而是以聊天方式对话，只有当用户**明确确认**某件事（如"好的，这个选题记下来"）时，才在后台自动沉淀。前端表现为简短的确认弹窗而非需要填字段的卡片。

### 4. 简化 Brand Studio 视图

Brand Studio 从 4 面板（选题库/日历/资产树/人设检查）简化为一个**单页面看板**，按时间线展示用户的所有内容创作资产，小白用户只需滚动就能看到"我聊过什么、产出了什么、接下来该干什么"。

## 技术方案

### 方案总体思路

**核心改造点只有 2 个文件 + 1 个组件**，其余改动是级联简化。遵循"最小改动、最大效果"原则：

1. **`src/lib/chat/prompt.ts`**（最大杠杆点）：重写系统提示词，增加"水平感知"和"辅导模式"
2. **`src/app/api/chat/stream/route.ts`**（数据流控制）：去掉小白场景的强制 idea/action 卡片下发
3. **Brand Studio 页面组件**：从 4 面板简化为一页看板

### 关键设计决策

**为什么不在 prompt 里用 `level` 参数？**
用户水平是动态变化的（用了一周就不是小白了），不能写死。改用 AI 从对话中自动判断：首次聊天 + 说"不知道怎么做"→小白模式；聊了几轮后提到具体操作→进阶模式。

**为什么删掉 idea 卡片而不是修卡片？**
小白不需要填 angle/hook/notes 这些字段。后台自动沉淀足矣，前端只需一句"已记下"的轻提示。

**Brand Studio 为什么不继续展示 4 面板？**
4 面板（选题库/日历/资产树/人设检查）的 UI 模型暗示用户理解"选题→排期→产出→检查"工作流。小白没有这个心智模型，应该用时间线/看板替代。

### 实现细节

**prompt.ts 修改要点：**

- 新增规则 0："水平感知"——根据用户表达自动判断是新手还是老手
- 新增规则 6（替换现有）："对话引导模式"——新手不输出 XML 标签、一次只问一个问题、用日常语言
- 保留规则 6 原内容给老手使用
- 去掉所有 `<action>` 标签的硬性要求

**stream/route.ts 修改要点：**

- 移除 `extractIdeaFromUserMessage` 的自动提取逻辑
- 保留 `parseIdeaTag` 作为老手模式的兜底
- 资产沉淀（`/api/chat/assets`）保持不变，后台静默工作

**Brand Studio 改造要点：**

- 合并 4 面板为单页滚动视图
- 顶部显示"当前定位"摘要卡片
- 中间按时间线展示已沉淀的内容资产
- 底部显示 AI 建议的下一步

### 架构影响

不引入新架构模式。不修改数据库。完全向后兼容——老手用户不受影响（prompt 中老手规则保持不变）。

## 设计策略

本次不新增页面，只改 Chat 对话体验和 Brand Studio 信息架构。

### Chat 对话体验（小白模式）

- AI 用日常语言交流，不出现"选题""角度""钩子""资产"等术语
- AI 回复末尾不再附带 action/idea 卡片
- 当 AI 在后台自动沉淀了某条信息时，前端展示一个轻量级 Toast（"已记下你说的内容"）代替原结构化卡片
- 输入框保持当前样式，不做改动

### Brand Studio 静默简化

- 从 4 面板 Tab 布局改为单页 Card 流布局
- 顶部一张卡片："你的IP定位"（从 user_persona 和对话中自动提取）
- 中间按更新时间排列的内容资产卡片（每条卡片只显示：标题 + 一句话摘要 + 时间）
- 底部一张卡片："AI 建议的下一步"（由后端根据用户当前阶段计算）

### 视觉风格

保持现有 FlowSpark 的设计语言：克制的暗色系、圆角卡片、微动画。不做视觉大改，只做信息架构重组。