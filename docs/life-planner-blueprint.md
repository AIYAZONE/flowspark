# FlowSpark 人生规划师蓝图（方案文档 v1）

> 面向：产品负责人（王洪兴）
> 定位：把 FlowSpark 从「待办记录工具」升级为「人生规划师 / 人生系统」
> 范围：本文档为**方案设计**，确认后进入开发。本次优先做「路径结构升级 + Chat 规划师联动」两块，并以「王洪兴读经典 / 视频号个人IP」案例打样。

---

## 0. 两个贯穿全文的核心设计原则（来自你的补充）

这两点决定了整个产品的「人格」和「记忆方式」，所有模块都要遵守：

### 原则 A · 个人补充即个人记忆
- 你在对话里**每一次对「个人」的补充**（兴趣、优势、经历、价值观、想成为的人、卡点……），都不是一次性闲聊，而是**直接沉淀为当前用户（你）的长期个人记忆 / 人设库**。
- 这份记忆**跨路径、跨会话持续累积**，是 Chat 规划师做定位推导的底层原料。
- 现有 `system_memory_preferences` 只存了 3 个「交互偏好」（回复长短 / 追问方式 / 专注模式），**远不够**——需要新建真正的个人记忆结构 `user_persona`。
- 触发方式：你主动说（"我擅长把复杂事讲简单"）+ 系统在规划对话中主动补全（"你刚才说你不爱出镜，我记下了"）。

### 原则 B · 规划新目标时，我是该领域全能专家
- 一旦进入「规划一条新路径」的语境，系统**切换为该领域的资深专家 / 大咖人格**，默认全能视角。
- 该人格**敢给结论、敢拍板、主动规划拆解**，不是中立的问答机器人。
- 例子：你说"想做视频号个人IP但不知道怎么做" → 系统以「个人IP操盘手 + 内容策略专家」身份，直接给你定位、人设三件套、内容支柱、90天打法，而不是反问"你想做哪种IP呢？"。

---

## 1. 现状诊断（为什么现在没意义）

### 1.1 路径 = 结构化待办清单
- `goals` 表字段：`title / description / start_date / end_date / success_criteria / stop_criteria / status / priority / category`。**没有定位 / 策略 / 里程碑 / 阶段 / 关键结果**。
- `actions` 表：平铺勾选项（`type` 区分 core/maintenance/learning/review/rest）。**无层级、无结构**。
- 你的「王洪兴读经典」路径现在只是：一个标题 + 一堆你自己也不知道对不对的 todo。系统没有帮你做"我是谁、为什么做视频号、怎么做"。

### 1.2 AI 底座有，但和路径割裂
- `coachOrchestrator` 已会注入 self-model + path-context，并有 `goal-setup / breakdown / rescue / review / potential` 一批端点。
- 但 chat 给的建议**不会回写成路径结构**：`recordChatAction` 只能插一条 `core` action，且按标题模糊匹配落到某 goal，**没有定位/策略/里程碑的落写能力**。
- `self-model` 现在是**基于行为信号被动推断**（采纳率/反馈），不是你主动补充的个人记忆——这正是原则 A 要补的缺口。
- `path-context` 能推断"路径阶段"（落点/启动/铺轨/稳定/收口），但**只出文案，不结构化存储**。

---

## 2. 目标态：人生规划师能做什么（用户故事）

| # | 作为用户，我希望… | 验收标准 |
|---|---|---|
| US-1 | 创建路径时，系统以领域专家身份帮我做定位，而不是让我自己填 | 输入"想做视频号个人IP但不知道怎么做"→ 系统先诊断式补全人设 → 生成定位方案 → 一键落成路径结构 |
| US-2 | 每条路径有清晰的定位卡 + 策略支柱 + 里程碑 + 关键结果 | 路径详情页展示 5 层结构，不再是平铺 todo |
| US-3 | 我在任意对话里补充的个人信息，自动变成长期个人记忆 | 说"我擅长把复杂事讲简单"→ 写入 `user_persona`，下次规划视频号时能被引用 |
| US-4 | chat 聊出来的结论能回写进路径 | chat 生成定位方案后，点"落成路径"→ goals 及其子结构被写入 |
| US-5 | 路径进展能带进 chat 上下文 | chat 规划时能读到当前路径阶段/完成度（复用 path-context） |
| US-6 | 卡住时系统主动提醒并给破局建议 | 复用 `rescue` 端点，路径停滞时主动推送 |

---

## 3. 数据模型方案

### 3.1 新增 `user_persona`（个人记忆表，落实原则 A）

复用现有 `system_memory_preferences` 的 RLS / ownership 写法，但内容从"交互偏好"升级为"个人记忆"。

```sql
-- supabase/NN_user_persona.sql
create table if not exists public.user_persona (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,        -- values: strength / value / experience / aspiration / aversion / context
  title text not null,           -- 简短标签，如 "擅长把复杂讲简单"
  detail text,                   -- 展开说明
  source text not null default 'chat',  -- chat / manual / inferred
  confidence text not null default 'medium', -- low / medium / high
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_persona_user_idx on public.user_persona(user_id);
-- RLS 同 system_memory_preferences（select/insert/update/delete where auth.uid()=user_id）
```

`category` 取值：
- `strength` 优势（"能把经典读出当代感"）
- `value` 价值观（"认为长期主义比爆款重要"）
- `experience` 经历（"做过 2 年线下读书会"）
- `aspiration` 想成为的人（"知识型IP，温和但有锋芒"）
- `aversion` 抗拒点（"不爱露脸出镜"）
- `context` 背景上下文（"本职工作稳定，副业做IP"）

### 3.2 路径子结构（落实"路径质变"）

**方案：在 `goals` 上加 `positioning` JSONB 字段，子结构用独立表**，避免 goals 表过度膨胀。

```sql
-- goals 增加定位卡（JSONB，存 AI 生成的定位方案）
alter table public.goals add column if not exists positioning jsonb;
-- positioning 结构示例：
-- { persona: "知识型IP", oneLiner: "...", threePieces: [...], pillars: [...], audience: "..." }

-- 策略支柱（一条路径可有多个）
create table if not exists public.path_pillars (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  rationale text,
  sort_order int not null default 0
);

-- 里程碑 / 阶段
create table if not exists public.path_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  target_date date,
  sort_order int not null default 0
);

-- 关键结果（KR，挂在里程碑下）
create table if not exists public.path_key_results (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.path_milestones(id) on delete cascade,
  title text not null,
  target text,          -- 量化目标，如 "发布 12 条视频"
  current text default '0'
);

-- actions 增加外键，可挂到 milestone / KR（可选，向后兼容）
alter table public.actions add column if not exists milestone_id uuid references public.path_milestones(id) on delete set null;
```

### 3.3 复用而非新建
- 个人记忆：**扩展** `system_memory_preferences` 思路新建 `user_persona`，不碰原表。
- 路径阶段推断：复用 `path-context.ts` 的 stage 逻辑，新增"把 stage 结构化存到 goals.status 或新字段"。
- 回写：扩展 `recordChatAction` → 新增 `recordPathPlan`（写 goals.positioning + pillars + milestones + KRs）。

---

## 4. Chat 规划师流程（落实原则 B + 联动）

### 4.1 入口
- Chat 新增「规划模式」入口（或识别意图）：用户说"我想做视频号个人IP但不知道怎么做"。
- 系统切换为**个人IP操盘手**人格（原则 B）。

### 4.2 对话流（诊断式补全人设 → 生成 → 落写）

```
[1] 用户："想做视频号个人IP，不知道怎么做"
[2] 系统(专家人格)：先诊断式提问（遵循 single_clarify_question 偏好，一次只问一个关键问题）
    → "你更想做'读经典讲干货'还是'读经典聊人生'？这决定人设方向。"
[3] 用户回答 + 顺带补充个人信息
    → 系统把补充写进 user_persona（原则 A，source=chat）
[4] 当人设关键信息足够，系统生成定位方案（positioning JSON）：
    · 人设一句话（oneLiner）
    · 人设三件套（你是谁/为谁/解决什么）
    · 3 个内容支柱（pillars）
    · 受众画像（audience）
    · 90 天四阶段打法（milestones + KRs）
[5] 系统展示方案，用户可微调
[6] 用户点"落成路径" → 调用 recordPathPlan 写入 goals + 子表
[7] 路径详情页展示完整 5 层结构
```

### 4.3 人设补全的轮次控制（风险点）
- 只追问**影响定位的关键缺口**（人设方向 / 受众 / 内容形式）。
- 最多 3 轮诊断提问，之后即便信息不全也先给方案，方案里标注"假设"。
- 复用 `single_clarify_question` 偏好：一次只问一个。

### 4.4 打样案例（贯穿全文）

「王洪兴读经典 / 视频号个人IP」落成的路径结构示例：

- **定位卡**：知识型IP，经典共读 + 个人成长叙事；人设三件套 =（你：读经典的王洪兴）/（为谁：想自我提升但没时间的职场人）/（解决：把经典变成今天用得上的认知）
- **内容支柱**：① 经典金句拆解 ② 经典×当代生活 ③ 我的践行复盘
- **90天四阶段**：
  - M1 定位验证（发 8 条，测 3 种开头）
  - M2 形式固化（确定"口播+字幕"或"图文"）
  - M3 流量爬坡（稳定周更 3 条，做 1 次话题联动）
  - M4 人设收口（沉淀固定栏目 + 私域承接）

---

## 5. 双向联动架构

```
Chat(规划师) ──生成──> user_persona(个人记忆)
     │                      ▲
     │ 读取                 │ 补全
     ▼                      │
goals.positioning ──阶段──> path-context(复用)
     │
     └── actions.milestone_id ──挂接──> path_milestones
```

- **Chat → 路径**：`recordPathPlan` 写 goals + 子表。
- **路径 → Chat**：规划对话时注入 `buildPrimaryPathContext` + 当前 persona 摘要。
- **Chat → 个人记忆**：任意对话补充自动写 `user_persona`。
- **个人记忆 → Chat**：规划时作为定位推导原料。

---

## 6. 分阶段路线

### Now（本次优先，先出文档后开发）
1. `user_persona` 表 + 写入/读取 lib（原则 A 基建）
2. goals 加 `positioning` + `path_pillars / milestones / key_results` 表 + migration
3. Chat 规划师端点 `api/ai/path-plan`：专家人格 + 诊断式补全人设 + 生成定位方案
4. `recordPathPlan` 落写逻辑（扩展 persistence）
5. 路径详情页：5 层结构展示
6. 打样「王洪兴读经典」案例端到端跑通

### Next
- 路径阶段结构化存储 + 与 path-context 打通
- 卡点主动提醒（rescue 端点接入路径页）
- 个人记忆的冲突/合并（同一条信息多次补充时更新而非重复）

### Later
- 个人品牌专项：视频号选题库、内容日历、人设一致性检查
- 复盘闭环：周期性 review 自动沉淀"学到了什么"到 user_persona

---

## 7. 非目标（Scope 边界）
- 不接视频号/抖音平台 API 直连（只做规划与内容策略，发布在你自己后台）
- 不做多用户协作 / 团队空间
- 不做付费墙 / 订阅
- 不做通用的"AI  chatbot 闲聊"，chat 始终带人生系统人格

---

## 8. 风险与不确定性
| 风险 | 等级 | 缓解 |
|---|---|---|
| LLM 生成的定位质量不稳定 | 中 | 方案标注"假设"，人可微调；专家人格 prompt 强化领域知识 |
| 人设补全轮次失控，用户烦 | 中 | 最多 3 轮 + single_clarify_question 偏好 |
| 个人记忆重复/冲突 | 中 | Later 阶段做合并；Now 阶段先允许重复，UI 可手动删 |
| 路径子表过多导致查询复杂 | 低 | 用 owner_id 兼容写法 + 必要索引 |

---

## 9. 已确认决策（2026-07-31）
1. **个人记忆支持页面手动编辑**：`user_persona` 除 chat 自动沉淀外，提供独立「个人记忆」页面，可手动新增 / 编辑 / 删除 / 调整 category 与 confidence。
2. **路径 5 层结构全做**：定位卡（positioning）+ 策略支柱（pillars）+ 里程碑（milestones）+ 关键结果（KRs）+ 行动（actions）一次性完整落地，不做 MVP 裁剪。
3. **打样用现有 goal 就地升级**：直接对「王洪兴读经典」这条已有 goal 就地升级为完整 5 层结构，不新建演示条目。

---

## 10. Now 阶段开发清单（已锁定）

| # | 任务 | 关键产物 |
|---|---|---|
| 1 | 个人记忆基建 | `supabase/NN_user_persona.sql` + `src/lib/persona.ts`（list/create/update/delete，含手动编辑与 chat 自动写入两套入口） |
| 2 | 个人记忆页面 | `src/app/(authenticated)/persona/page.tsx`：列表 + 新增/编辑/删除 + category 与 confidence 调整 |
| 3 | 路径子结构表 | `supabase/NN_path_structure.sql`：goals.positioning + path_pillars / path_milestones / path_key_results + actions.milestone_id |
| 4 | Chat 规划师端点 | `src/app/api/ai/path-plan/route.ts`：专家人格 + 诊断式补全人设（写 user_persona）+ 生成定位方案（positioning JSON） |
| 5 | 落写逻辑 | 扩展 `src/lib/chat/persistence.ts`：新增 `recordPathPlan` 写 goals + 子表；chat→路径回写 |
| 6 | 路径详情页升级 | `goals/[id]/page.tsx`：5 层结构展示 + 定位卡编辑 + 支柱/里程碑/KR 增删改 |
| 7 | 双向联动 | 规划对话注入 `buildPrimaryPathContext` + persona 摘要；路径阶段结构化复用 path-context |
| 8 | 打样 | 「王洪兴读经典」就地升级为完整 5 层结构，端到端验证

---

## 11. 产品核心定位（2026-08-03 确认）

> **不要做"小号 Claude"。做"最懂你的人生 + IP 教练"——一个记住你、陪你执行、帮你把想法变成资产的私人系统。聊天是门，记忆和资产是墙，闭环是地基。**

### 11.1 一句话定位
FlowSpark 不是一个聊天机器人，而是一个**长在用户人生数据上的 AI 教练 + 个人 IP 操盘系统**。聊只是入口；真正的壁垒是：它越用越懂你（persona 记忆）、越用越知道你怎么卡住（behavior/friction）、越用能帮你把想法变成可发布的 IP 资产（content pipeline）。

### 11.2 竞争对手定义（关键认知）
- **我们的对手不是 ChatGPT / Claude，而是"用户自己在备忘录里瞎记 + 到处问 AI"的低效混乱现状。**
- 我们替代的是那个混乱状态，不是通用大模型。
- 通用 Agent 的弱点是结构性"失忆 + 没有领域闭环"；我们正好补上这两块。

### 11.3 与通用 Agent 的差异化（我们赢的维度）
| 通用 Agent 的"生态" | 我们该做的"专属能力"（基于已有数据） |
|---|---|
| 通用 skills 插件市场 | 人生教练场景：today_plan / rescue / review（coachOrchestrator 已做） |
| 通用专家库 | persona 记忆 = 专属私人专家：每次都带着"你是谁"回答 |
| 通用内容生成 | IP 资产流水线：聊天产出 → brand_check 人设校验 → 存 content_ideas → 排期 calendar |
| 通用知识库 | friction 历史：记录每次卡住原因，AI 主动预防 |

**我们不去建 skills 市场 / 通用插件生态（追不上也没必要）；要拼的是"用户离开后数据还在不在、越用越懂他多少"这一维。**

### 11.4 三层路线图（从内到外）
- **第 0 层（已有=护城河地基）**：persona 记忆 + coach 三场景 + recommendation 落库 + content_ideas 资产。
- **第 1 层（进行中=验证定位）**：全站只有一个 AI 聊天入口统管一切。聊目标→写 Goals；聊 IP→产出选题存 content_ideas；聊脚本→brand_check 校验。brand-studio/persona 降级为"查看/精修"抽屉，不再是录入入口。
- **第 2 层（差异化放大）**：主动教练。基于 friction 历史主动提醒；基于 persona 主动提示人设偏差。

### 11.5 不做的事
- ❌ 建 skills 市场 / 通用插件生态
- ❌ 拼"聊天多像人"（那是他们的强项）
- ❌ 把 brand-studio 做成另一个独立工具（工具思维已否）
