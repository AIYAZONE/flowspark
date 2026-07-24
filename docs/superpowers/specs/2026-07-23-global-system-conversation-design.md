# Global System Conversation（全站内联对话流）Design

## 目标

把现有“底部命令栏 + 弹窗式回执”的弱交互，升级为 **全站统一的内联对话流**，满足：

- 不弹窗、不遮罩、不打断上下文
- 永不“问一句就挂”：任何失败都降级为可继续的对话
- 系统回复短且有主次：默认 3 段以内 + 1 个主按钮
- 全站共享同一个系统上下文，形成“同一个系统一直在”的心智模型

## 非目标

- 不把产品做成 IM 聊天软件（不做无限历史、搜索、群聊、表情等）
- 不在 V1 追求“真正强 AI 智能体”，而是先把交互与容错做成“像系统”
- 不做复杂多轮澄清：最多只问 1 个关键问题

## 用户偏好（已锁定）

- 交互形态：A1 内联对话流（非 Sheet/Modal/Drawer）
- 回复风格：混合型（先一句分析判断，再给明确下一步）
- 模糊输入：能判断就直接判断，实在不够再只问 1 个问题
- 输出长度：短（3 段以内）
- 按钮文案：折中系统口吻（去执行 / 确认写入 / 告诉我你卡在哪）
- 覆盖范围：全站统一（/system /today /profile）
- 历史策略：
  - UI 可见历史：最近 3 轮（跨页面）
  - 短期工作记忆：最近 20 轮原始对话
  - 更早上下文：摘要化进入记忆模块

## 现状问题（归因）

现有实现中，“命令输入”和“系统回执”是两个断裂的东西：

- 命令提交后通过 `Sheet` 呈现回执，会遮住上下文，体验像弹窗式表单而不是系统对话。
- API/解析失败时进入“不可用/未接住”路径，用户感知为“问一句就挂”。
- placeholder/提示语在不同页面不同，导致用户无法建立“这是同一个全局系统入口”的心智。

## 设计总览

### 1) 统一心智（固定位置）

- **输入入口：** 全站只有一个 `GlobalCommandBar`（底部常驻）。
- **系统回执区：** 全站固定一个 `SystemConversation` 区域（页面主内容顶部，Hero/标题下方），不遮挡页面。

页面放置建议：

- `/system`：Hero 下方（最强“系统感”）
- `/today`：标题/工具条下方、列表上方（执行时也能求助）
- `/profile`：Tabs 下方、内容区顶部（用于“分析我/解释我/给建议”）

### 2) 轻对话（不是聊天软件）

- 默认只展开最近 1 轮可见对话
- 可展开最近 3 轮可见对话
- 不做长历史堆叠；需要长分析沉淀到 `/profile/ai-insights`（后续迭代）
- “只显示 3 轮”仅用于页面可见 UI，不等于系统只记住 3 轮

## UI 组件设计

### SystemConversation（容器）

职责：

- 渲染最近 N 轮 Turn（默认 1，最大 3）
- 控制展开/收起
- 提供统一的视觉结构（“系统在此回应”）

### Turn（一轮对话）

由两条消息组成：

- `UserMessage`：展示用户输入（一行，弱强调）
- `SystemMessage`：展示系统回复（强结构）

### SystemMessage（系统回复）

严格 3 段（短，强结构）：

1. judgement（判断，一句话）
2. reason（原因，一句话）
3. nextStep（下一步，一句话）

附加元素：

- 右上角一个小标签（用于建立心智）：系统判断 / 需要确认 / 需要澄清 / 已执行 / 降级理解
- 底部最多 1 个主按钮：去执行 / 确认写入 / 告诉我你卡在哪

## 状态机（核心：永不挂）

每个 Turn 有且仅有一个状态：

### S1 submitting

触发：用户按下发送后立即进入。

UI：

- 系统先回一句“处理中”的短句（不做复杂 loading 面板）

### S2 responded.execute

含义：系统已理解且可执行。

按钮：去执行（跳转到可执行的目标页，例如 `/today?view=focus` 或带 action 参数）。

### S3 responded.confirm

含义：系统理解了，但需要确认才写入系统。

按钮：确认写入（调用确认接口；成功后进入 done）。

### S4 responded.clarify

含义：信息不足，必须补一句关键信息才能继续。

限制：

- 只能问 1 个关键问题
- 最多提供 2 个候选按钮（可选），否则让用户直接回答一句话

按钮：告诉我你卡在哪（把输入框聚焦，引导用户补一句）

### S5 done

含义：执行/写入/草案已经完成闭环。

UI：

- 系统给一句“下一步建议”（仍在 3 段内约束）
- 主按钮消失（或变为继续，视页面需要）

### SE degraded（降级理解，替代报错）

触发：

- 网络错误、500、超时
- 返回结构不完整
- 意图解析失败或无法安全写入

UI 固定模板：

- judgement：我没能安全完成写入，但我理解你在问：X
- reason：我缺少/无法确认关键信息：Y
- nextStep：你补一句 Z，我就能继续
- 主按钮：按这个继续（聚焦输入框并预填 Z）

## 数据模型

### Conversation（共享可见历史 + 工作记忆）

存储目标：

- 在 App Router 跨路由切换时保持（同一个系统）
- 刷新后可恢复可见历史与短期工作记忆
- 不能引入 hydration mismatch（SSR 首次渲染必须稳定）

建议实现：

- `SystemConversationProvider`（Client Component）挂在 authenticated layout 下
- 初始 state 为 `[]`
- `useEffect` 读取 localStorage 并合并（避免 SSR/CSR 不一致）
- 任何写入 localStorage 都在 effect/事件中进行

分层规则：

- **可见历史（UI History）**
  - 默认展示最近 1 轮
  - 最多展开最近 3 轮
  - 作用：保证页面干净，不把 `/system` 做成聊天软件

- **短期工作记忆（Working Memory）**
  - 保留最近 20 轮原始对话
  - 作用：让系统在连续几轮对话里保持上下文，不像“失忆”
  - 这部分不需要全部展示给用户

- **更早摘要记忆（Summarized Memory）**
  - 超过 20 轮后，按主题压缩成摘要，不继续保留所有原文在运行时上下文里
  - 摘要内容进入“记忆模块”，供后续分析与个性化使用

### 记忆模块（V1）

记忆模块用于让系统“越来越懂用户”，但必须分层，避免乱记与误导。

#### A. 短期记忆（Conversation Memory）

- 内容：
  - 最近 3 轮可见对话
  - 最近 20 轮短期工作记忆
- 存储：runtime store + localStorage
- 作用：让跨页面对话连续，不需要用户重复解释
- 特点：自动写入、可随时清空、无高风险

#### B. 偏好记忆（Preference Memory，V1 主线）

- 内容：稳定的交互偏好、系统使用偏好、明确规则
- 例子：
  - 回复短，3 段以内
  - 能判断就判断，不够再问 1 个问题
  - 优先进入专注模式
  - 某些固定的系统偏好/使用习惯

存储建议：

- 数据库（user scoped）
- 每条偏好需要可开关、可删除、可解释
- 展示位置：`/profile` 增加“系统记忆”区

写入规则：

- 只允许两种来源：
  - 用户显式表达（例如“以后回复短一点”）
  - 系统检测到稳定重复模式后，先提出建议，再由用户确认写入
- 不允许系统“猜到了就直接写”

条目展示形态（已锁定）：

- `开关 + 解释`
- 每条偏好显示：
  - 偏好名称
  - 当前状态（开/关）
  - 一句解释：系统为什么这样记住你

#### C. 自我画像（Self Model，V1 次主线）

- 内容：按周生成的“本周画像 + 下周策略”
- 作用：让系统在分析类问题上更懂你，而不是每次都像第一次认识你
- 存储：数据库（建议带时间窗口和版本）
- 触发：
  - 7 天内首次访问 `/profile`
  - 或用户主动问分析类问题（如“分析我最近怎么了”）

输出约束：

- 仍遵守短输出偏好，默认 3 段：
  - 本周判断
  - 主要阻力
  - 下周一个策略

展示位置：

- `/profile?tab=analytics`
- 后续可沉淀到 `/profile/ai-insights`

#### D. 回复时的记忆读取优先级

系统每次生成内联回复时，按以下优先级取上下文：

1. 短期工作记忆（最近 20 轮原始对话）
2. 偏好记忆（风格与策略约束）
3. 自我画像（仅分析类问题调用）
4. 更早摘要记忆（仅当前三层不足时补充）

目标：

- 日常推进类对话保持快、短、明确
- 分析类对话能体现“系统真的记得你、理解你”

### Turn 结构（建议）

```ts
type SystemTurnState =
  | 'submitting'
  | 'responded.execute'
  | 'responded.confirm'
  | 'responded.clarify'
  | 'done'
  | 'degraded'

type SystemPrimaryAction =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'confirm'; label: string; draftId: string }
  | { kind: 'focusInput'; label: string; prefill?: string }

type SystemTurn = {
  id: string
  createdAt: string
  sourcePage: 'system' | 'today' | 'profile'
  userText: string
  state: SystemTurnState
  tag: '系统判断' | '需要确认' | '需要澄清' | '已执行' | '降级理解'
  judgement: string
  reason: string
  nextStep: string
  primaryAction: SystemPrimaryAction | null
  traceId?: string
}
```

## 与现有后端/接口的对齐

现有 `/api/command/draft` 的返回会被映射到上述状态机：

- executable → responded.execute
- need_confirmation → responded.confirm
- need_more_info → responded.clarify
- not_ready / error → degraded（不再直接“报错/挂掉”）

确认写入（confirm）建议沿用现有写入链路（若已有 `/api/command/commit` 则复用；若没有则新增）。

## /today 专注入口（已存在能力，需统一体验）

- 统一用深链参数：`/today?view=focus`
- System 的“去执行”优先跳到 focus 视图，降低噪音

## 验收标准（可观察）

### 体验验收

- 任何命令提交后都能在页面内联得到回应（不弹窗）
- 即使接口失败，也会得到 degraded 的“可继续”回复（不出现“挂了/没接住/请重试”式体验）
- 系统回复始终 ≤ 3 段 + 1 主按钮
- 用户在 /today 说话后，回到 /system 能看到最近 3 轮共享可见历史
- 系统在跨页面连续对话时，能够利用最近 20 轮工作记忆保持连续理解

### 工程验收

- 不引入 hydration mismatch（localStorage 读取必须在 effect）
- lint / typecheck 通过

## 迁移策略（最小破坏）

1. 保持 `GlobalCommandBar` 作为唯一输入入口，但移除/弱化 Sheet 回执呈现。
2. 新增 `SystemConversation` 与 provider，并在三页接入展示。
3. 将现有回执逻辑改为写入 conversation store（状态机驱动 UI）。
4. 逐步收敛页面上与命令栏职责冲突的按钮（后续迭代，不阻塞本设计落地）。
