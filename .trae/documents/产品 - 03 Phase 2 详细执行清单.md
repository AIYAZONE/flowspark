# Phase 2: The Spark - 详细执行清单

本文档基于 [产品路线图](产品%20-%2001%20产品路线图.md) 和 [创新激励设计](产品%20-%2020%20创新激励与AI系统设计.md) 制定，旨在为开发阶段提供详尽的任务指引。

## 1. 核心模块概览

Phase 2 的核心目标是引入 **AI 智能** 和 **游戏化激励**，将产品从工具升级为伙伴。

| 模块 ID      | 模块名称      | 优先级     | 描述                    |
| :--------- | :-------- | :------ | :-------------------- |
| **M-AI**   | AI 智能目标拆解 | P0 (最高) | 利用 LLM 将模糊愿景拆解为微挑战    |
| **M-GAME** | 变量奖励系统    | P0 (最高) | XP、等级、盲盒反馈、可视化成长      |
| **M-UX**   | 沉浸式体验     | P1 (高)  | 专注模式 (Zen Mode)、物理微交互 |

***

## 2. 详细任务清单

### 2.1 \[M-AI] AI 智能目标拆解 (AI Goal Breakdown)

> 让 AI 帮你把模糊的想法拆解为可执行的微挑战。

| 任务 ID     | 任务名称                  | 详细描述                                                                         | 技术要点                                       | 状态         | 证据 |
| :-------- | :-------------------- | :--------------------------------------------------------------------------- | :----------------------------------------- | :--------- | :-- |
| **AI-01** | **LLM 服务接入与配置**       | 集成 OpenAI/Anthropic API，建立统一的 AI Service 层。                                  | `openai` SDK, 环境变量配置, Error Handling       | ✅ Done | [breakdown.ts](file:///Users/brucewang/Documents/AIYA/goals/src/lib/ai/breakdown.ts#L143-L225) |
| **AI-02** | **Prompt 模板设计**       | 设计用于目标拆解的 System Prompt，要求输出 JSON 格式，包含 title, description, estimated\_time。 | Prompt Engineering, JSON Schema Validation | ✅ Done | [buildSystemPrompt](file:///Users/brucewang/Documents/AIYA/goals/src/lib/ai/breakdown.ts#L112-L141) |
| **AI-03** | **后端 API: 智能拆解**      | 开发 `/api/ai/breakdown` 接口，接收用户输入，返回拆解后的任务列表。                                 | Next.js API Routes, Zod Validation         | ✅ Done | [route.ts](file:///Users/brucewang/Documents/AIYA/goals/src/app/api/ai/breakdown/route.ts#L1-L46) |
| **AI-04** | **前端组件: Magic Split** | 在创建目标/任务表单中添加 "AI 帮我拆解" 按钮与交互流程（Loading 态、结果预览与编辑）。                          | React Hook Form, Streaming UI (可选)         | ✅ Done | [NewGoalForm](file:///Users/brucewang/Documents/AIYA/goals/src/components/NewGoalForm.tsx#L97-L167) |
| **AI-05** | **动态难度调整 (基础版)**      | 记录用户对 AI 任务的反馈（接受/拒绝/完成），作为上下文传入下一次 Prompt。                                  | Supabase Vector (可选) 或 简单上下文拼接             | 🔴 Pending |  |

### 2.2 \[M-GAME] 变量奖励系统 (Variable Reward System)

> 利用多巴胺回路，让完成任务本身充满惊喜。

| 任务 ID       | 任务名称                | 详细描述                                                                         | 技术要点                                  | 状态         | 证据 |
| :---------- | :------------------ | :--------------------------------------------------------------------------- | :------------------------------------ | :--------- | :-- |
| **GAME-01** | **数据库设计: 游戏化系统**    | 设计 `profiles` (扩充 XP/Level), `xp_logs`, `badges`, `user_inventory` (道具) 表结构。 | Supabase SQL, Drizzle/Prisma Schema   | 🟡 Partial | [04_gamification.sql](file:///Users/brucewang/Documents/AIYA/goals/supabase/04_gamification.sql#L4-L20)、[05_gamification_rls.sql](file:///Users/brucewang/Documents/AIYA/goals/supabase/05_gamification_rls.sql#L4-L16) |
| **GAME-02** | **后端逻辑: 经验值结算**     | 实现完成任务增加 XP 的逻辑，处理升级判定。                                                      | Server Actions, Database Transactions | ✅ Done | [toggleAction](file:///Users/brucewang/Documents/AIYA/goals/src/app/(authenticated)/dashboard/actions.ts#L1-L31)、[awardXP](file:///Users/brucewang/Documents/AIYA/goals/src/lib/gamification-actions.ts#L1-L53) |
| **GAME-03** | **核心算法: 随机奖励池**     | 实现加权随机算法 (Weighted Random)，决定任务完成后的掉落物 (XP/道具/徽章)。                           | 概率算法, 配置文件管理奖励权重                      | 🔴 Pending |  |
| **GAME-04** | **UI 组件: 盲盒开箱动画**   | 开发任务完成后的弹窗动画，展示“开箱”过程与获得奖励。                                                  | Framer Motion, Lottie (可选)            | 🔴 Pending |  |
| **GAME-05** | **UI 组件: 经验条与等级展示** | 在 Dashboard 和 Navbar 展示当前等级、XP 进度条。                                          | CSS Animations, Optimistic UI         | ✅ Done | [LevelCard](file:///Users/brucewang/Documents/AIYA/goals/src/components/LevelCard.tsx#L1-L92) |
| **GAME-06** | **可视化成长 (植物/生物)**   | (P2) 为每个核心目标关联一个 SVG 形象，随进度改变状态 (幼苗 -> 大树)。                                  | SVG Manipulation, 状态映射逻辑              | 🔴 Pending |  |

### 2.3 \[M-UX] 沉浸式 UX (Immersive UX)

> 打造心流体验，操作即享受。

| 任务 ID     | 任务名称                   | 详细描述                                    | 技术要点                                         | 状态         |
| :-------- | :--------------------- | :-------------------------------------- | :------------------------------------------- | :--------- |
| **UX-01** | **专注模式 (Zen Mode) 页面** | 开发全屏执行页面，隐藏导航栏，仅显示当前任务、计时器和白噪音控制。       | Fullscreen API, Audio API                    | 🔴 Pending |
| **UX-02** | **微交互: 粉碎任务**          | 优化 Checkbox 交互，支持长按完成，并在完成时触发“粉碎/粒子”特效。 | Framer Motion (Gestures & Layout Animations) | 🔴 Pending |
| **UX-03** | **触感反馈 (Haptic)**      | 在移动端/支持的设备上，在完成任务、升级等关键节点触发震动。          | `navigator.vibrate`                          | 🔴 Pending |
| **UX-04** | **情感化文案系统**            | 替换系统默认的 Toast 提示和空状态文案，建立随机文案库。         | i18n 扩展, 随机文案工具函数                            | 🔴 Pending |

***

## 3. 执行策略

### 阶段一：AI 核心 (Week 1)

优先打通 **AI-01** 至 **AI-04**。这是 Phase 2 最显著的功能增量，能立即提升用户创建目标的体验。

### 阶段二：激励闭环 (Week 2)

完成 **GAME-01** 至 **GAME-05**。构建基础的 XP 和随机奖励循环，让用户完成任务后有反馈。

### 阶段三：体验打磨 (Week 3)

实施 **UX-01** (Zen Mode) 和 **UX-02** (微交互)，并视情况推进 **GAME-06** (可视化成长)。

***

## 4. 依赖项检查

* [ ] 确认 Supabase 项目是否开启 Vector 扩展 (如需 RAG)。

* [ ] 申请 OpenAI 或 Anthropic API Key（或配置 DeepSeek Key）。

* [x] 检查 `framer-motion` 是否已安装 (用于动画)。

* [x] 确认图标库 (如 Lucide React) 是否满足游戏化图标需求。
