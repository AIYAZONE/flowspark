# FlowSpark 产品蓝图（商业化版 v2）

> **版本说明**：v1 蓝图（重规划人生系统：5 层路径 + 人设诊断 + 主动规划）经市场验证**已推翻**。本版基于真实市场数据 + 现有代码底座重新定位。
> **定位一句话**：FlowSpark = 内容创作者的**私有成长 OS**——开聊就行，AI 自动把灵感/复盘/选题沉淀成结构化的人设与内容资产，数据 100% 归你、可导出、不被训练；周回顾轻提醒，零手动建结构。
> **目标**：商业化订阅产品（单人冷启动 → 上线运营）。

---

## 0. 战略决策与依据（为什么改方向）

### 0.1 真实市场事实（已查证，非假设）
- **通用 agent 记忆已很强**：ChatGPT Memory 2024-04 上线，2025-04 推"全局记忆/Moonshine"跨对话永久记忆，2026-06 升级 Dreaming V3。Claude Projects / 豆包 / Kimi 均有长期记忆。**"记忆"不是壁垒。**
- **Life OS 赛道已拥挤**：malife、TaskCoach.AI（Life OS）、Pipstario、Ari（ADHD coach）等均已存在，主打"目标+习惯+AI教练+日历+日记"。
- **73% 的 ChatGPT 对话已是生活类**（OpenAI 2025-06 报告）——需求真实巨大，但**轻度用户已被通用 agent 吸收**。
- **隐私/主权是真实缝隙**：JauMemory（encrypted cross-AI memory）拿到融资、邀请制排队，证明"隐私可控的人生数据"有人买单；巨头记忆在云端、可被训练、不可完全导出。

### 0.2 三个可防守的差异化（真实可落地）
| 维度 | 通用 agent（ChatGPT） | Life OS 竞品 | **FlowSpark** |
|---|---|---|---|
| 结构 | 聊完即散，无回看结构 | 重，逼你填目标建系统 | **轻：对话即记录，自动长结构** |
| 私有 | 云端、可训练、难导出 | 多为 SaaS 云端 | **Supabase 自建，可导出、不训练** |
| 人群 | 通用 | 泛 | **聚焦内容创作者/个人IP** |

### 0.3 砍掉 vs 保留
**砍掉（v1 过度设计）**：
- ❌ 人设诊断式提问（用户明确烦被问）
- ❌ 主动规划流程 / "请规划"按钮（用户嫌重）
- ❌ 每日待办打卡（反人性，改周回顾）
- ❌ 把 path-plan 当新功能重写（**代码里已实现**，见 §2）

**保留并轻量化**：
- ✅ 对话自动沉淀人设（`recordPersonaFromChat` 已存在）
- ✅ 对话直接生成路径结构（`pathPlan.ts` + `51_path_structure.sql` 已存在）
- ✅ 内容资产树（`content_assets` 表已建，仅缺写入链路）
- ✅ 周回顾式轻主动（`planReview` / `path-context.ts` 已存在）

---

## 1. PRD（商业化版）

### 1.1 问题陈述
内容创作者（个人IP/视频号主）在 ChatGPT 等通用 agent 里聊出的选题、人设思考、复盘结论**聊完即散**，无法沉淀为可回看、可复用的结构化资产；而 malife/TaskCoach 这类 Life OS 又**逼用户手动建目标、填系统**，心智负担重。创作者需要一个**开聊即记录、AI 自动归类、数据私有**的轻量成长系统，且愿意为"省心 + 私有"付费。

### 1.2 目标（可衡量）
- **G1 激活**：新用户首周内产生 ≥3 条自动沉淀的人设/内容资产（leading）。
- **G2 留存**：订阅月留存 ≥ 40%（对标 Life OS 类目中位）。
- **G3 付费**：上线 3 个月内付费转化率 ≥ 5%（免费→订阅）。
- **G4 私有信任**：100% 用户数据可一键导出（合规卖点）。

### 1.3 非目标（防范围蔓延）
- ❌ 不做通用 agent（不碰"啥都能聊"）
- ❌ 不做社交/社区/关注流（v2 后再议）
- ❌ 不做团队协作/多租户（单人创作者优先）
- ❌ 不做视频剪辑/发布（只做"资产沉淀与一致性"，发布交给平台）
- ❌ 不做每日打卡/强提醒（只做周回顾）

### 1.4 用户故事
** persona：内容创作者「小王」（视频号个人IP，想做成长内容）**
- 作为创作者，我想**开着聊天就把今天的选题灵感存下来**，而不用手动建文档 → 系统自动写入 `content_assets` 树。
- 作为创作者，我想**聊完天发现 AI 记住了"我是谁/我的IP定位"**，而不用填表 → 日常对话自动抽人设落 `user_persona`。
- 作为创作者，我想**周末收到一句轻提醒**："这周你囤了 4 个选题，但人设定位还模糊，要不要聊清楚？" → 周回顾轻主动。
- 作为付费用户，我想**随时导出我全部的人设+内容资产为 Markdown/JSON**，证明数据归我 → 隐私导出。
- 作为创作者，我想**看一张"我的内容资产地图"**：选题/脚本/人设笔记按主题自动聚类 → 资产树可视化。

### 1.5 需求分级（P0 = MVP 必须有）
**P0（MVP）**
- R1 对话自动人设抽取：日常自由聊天识别"关于用户本人的陈述"→ 落 `user_persona`（含语义去重）。验收：发一句"我擅长把复杂事讲简单"→ 下次 persona 列表出现该条。
- R2 对话自动内容资产沉淀：聊天中的选题/脚本/笔记 → 自动写入 `content_assets` 树（AI 动态建目录）。验收：聊出选题 → 资产树出现对应节点。
- R3 周回顾轻提醒：每周一次，≤3 句话总结推进/卡点，不强制操作。验收：周一定时推送，可忽略。
- R4 隐私导出：一键导出全部人设+资产+路径为 Markdown/JSON。验收：点击后下载文件含全部数据。
- R5 订阅付费墙：免费版限制资产/人设条数，订阅解锁。验收：超限提示升级，支付后解锁。

**P1（上线后 1-2 月）**
- R6 资产树可视化视图（按主题聚类）。
- R7 人设一致性检查：新草稿 vs `user_persona` + `goals.positioning` 打分（复用 `planBrandCheck`）。
- R8 内容日历（补全 `content_calendar` 骨架）。

**P2（更晚）**
- R9 多平台选题分发草稿。
- R10 创作者专属模板（视频号/小红书/播客）。

### 1.6 成功指标
| 指标 | 类型 | 目标 |
|---|---|---|
| 首周自动沉淀条数 | Leading | ≥3 |
| 周活跃聊天天数 | Leading | ≥3 天/周 |
| 月订阅留存 | Lagging | ≥40% |
| 付费转化率 | Lagging | ≥5% |
| 导出使用率 | Trust | ≥15% 用户用过 |

---

## 2. 现有底座可复用清单（关键：避免重写）

> 探查确认：v1 蓝图里"路径结构/人设抽取/内容资产树"**代码已实现**，本版只补缺口。

| 能力 | 状态 | 关键文件 |
|---|---|---|
| 对话抽人设并落库（语义去重合并） | ✅ 已实现 | `src/lib/persona.ts` `recordPersonaFromChat` + `supabase/50_user_persona.sql` |
| 对话直接生成 5 层路径（零手动建结构） | ✅ 已实现 | `src/lib/ai/pathPlan.ts` + `chat/actions.ts` `createGoalFromChat` + `supabase/51_path_structure.sql` |
| 对话建议行动/选题落库 | ✅ 已实现 | `src/lib/chat/persistence.ts` `recordChatAction`/`recordContentIdea` |
| 内容资产树表（零手动建目录） | ✅ 表已建，⚠️ 缺写入链路 | `supabase/56_content_assets_tree.sql` + `ChatAssetsCard.tsx` |
| 主路径阶段上下文 | ✅ 已实现 | `src/lib/path-context.ts` |
| 目标详情页母版（定位+5层+行动） | ✅ 已实现 | `src/app/(authenticated)/goals/[id]/page.tsx` |
| AI 编排 strategy/fallback/context | ✅ 已实现 | `src/lib/ai/coachOrchestrator.ts` + `contextBuilder.ts` |
| 聊天 UI（行动/选题/资产卡） | ✅ 已实现 | `src/components/chat/*` |
| 人设一致性检查（brand-check） | ✅ 已实现 | `planBrandCheck` / `brand-check/route.ts` |

### 缺口（本版 MVP 真正要补的）
1. **`content_assets` 无 AI 写入链路**：`persistence.ts` 只有 `recordContentIdea`（写 `content_ideas`），**缺 `recordContentAsset` 把对话沉淀物自动写进 `content_assets` 树**。→ MVP 核心补建点。
2. **日常人设抽取未贯通自由聊天**：`recordPersonaFromChat` 仅在"规划新路径/导入"时触发，普通聊天不自动回写。→ 需在 chat 沉淀链路接入。
3. **goals 无标签体系**：仅单一 `category`，内容资产缺 tag 维度，不利检索/商业化呈现。→ MVP 轻量补 `tags`（jsonb 或独立表）。
4. **`content_calendar` 未实现**（53 号迁移为预留骨架）→ P1。

---

## 3. MVP 技术方案（增量，不推倒）

### 3.1 对话自动沉淀主链路（零手动）
```
用户自由聊天
   └─> ChatSurface 发送
         └─> [NEW] chat stream 沉淀调度：每轮 AI 回复后异步跑轻量抽取（不阻塞主流程）
               ├─> [DONE] /api/chat/persona ──> recordPersonaFromChat ──> user_persona
               ├─> [DONE] /api/chat/assets  ──> upsertContentAssets    ──> content_assets 树
               └─> recordContentIdea（已有，选题）                      ──> content_ideas
```
**关键决策**：抽取**不阻塞**主聊天流，异步后台跑（参考现有 `recordChatAction` 模式），用户无感知。

### 3.2 周回顾轻提醒
- 复用 `planReview` + `path-context.ts`，改为**定时任务**（cron/周一定时）生成 ≤3 句摘要推送。
- 不强制操作，可忽略；仅在"人设模糊/选题堆积"等信号出现时轻提示。

### 3.3 隐私导出
- 新增 `/api/export`：聚合 `user_persona` + `content_assets` + `goals`（含 5 层）+ `content_ideas` → 打包 Markdown/JSON 下载。
- 复用现有 RLS（user_id 隔离），导出即"数据归你"的信任证明。

### 3.4 订阅付费墙
- 免费版：人设/资产条数上限（如各 50 条），超限引导订阅。
- 订阅解锁：无限沉淀 + 资产树可视化 + 一致性检查 + 导出。
- 支付：先接轻量方案（如 Creem/Polar 等创作者友好支付，或 Stripe），MVP 阶段可先用"假支付+手动开通"验证意愿，再接真支付。

---

## 4. 路线图（Now / Next / Later）

> 单人开发，节奏以"周"为单位。Now = 上线前 MVP；Next = 上线后 1-2 月；Later = 增长期。

### Now（MVP，目标：可上线收费）
| 项 | 状态 | 依赖 |
|---|---|---|
| 接通日常人设抽取（缺口2） | **Done** ✅ | 新增 /api/chat/persona，stream 异步触发 |
| 补 `recordContentAsset` 写入链路（缺口1） | **Done** ✅ | /api/chat/assets 已接通 stream |
| goals 加 `tags` 轻量标签（缺口3） | **Done** ✅ | supabase/57_tags.sql + 读写 + 检索 API |
| 周回顾定时轻提醒 | Not Started | planReview/path-context |
| 隐私导出 `/api/export` | Not Started | RLS 复用 |
| 订阅付费墙（先假支付验证） | Not Started | — |

### Next（上线后 1-2 月）
| 项 | 状态 | 依赖 |
|---|---|---|
| 资产树可视化视图 | Not Started | content_assets |
| 人设一致性检查（brand-check 接通草稿） | Not Started | planBrandCheck |
| 内容日历补全 | Not Started | 53 骨架 |
| 真支付接入（Stripe/Creem） | Not Started | Now 付费墙 |

### Later（增长期）
| 项 | 状态 |
|---|---|
| 多平台选题分发草稿 | Not Started |
| 创作者专属模板 | Not Started |
| 社区/案例库（可选） | Not Started |

---

## 5. 风险与缓解
- **R1 巨头碾压**：ChatGPT 随时可加"资产树/导出"。缓解：死守"私有+创作者聚焦+轻"三件套，巨头不做重 UI、不碰具体职业工作流。
- **R2 单人产能**：功能多易摊薄。缓解：MVP 只做 6 项 P0，其余坚决 Next/Later。
- **R3 付费意愿未验证**：先用"假支付+手动开通"测真实付费意向，再接真支付，避免白做。
- **R4 抽取质量**：AI 误抽人设/资产。缓解：复用现有语义去重 + fallback 规则，用户可改可删（`user_persona` 已支持 manual 编辑）。

---

## 6. 与原蓝图（v1）的决裂点（给团队/自己备忘）
1. **不再做"人设诊断式提问"**——用户烦被问，改日常对话自动抽。
2. **不再把 path-plan 当新功能**——已实现，MVP 聚焦"资产树写入 + 人设贯通 + 周回顾 + 导出 + 付费"。
3. **从"规划师"降级为"沉淀器+轻提醒"**——心智负担最小是第一名原则。

---

## 7. 开发进度（已实现）

### 2026-08-06：接通「日常对话自动沉淀人设」（Now 第一项，Done ✅）
**问题**：原 `recordPersonaFromChat` 只在"规划路径/导入文档"时触发，自由聊天不自动抽人设，违背"零手动"原则。

**改动**：
- 新增 `src/app/api/chat/persona/route.ts`：接收 transcript，LLM 抽 0~3 条高信度人设信号（7 类：优势/价值观/经历/想成为的人/抗拒点/背景/复盘洞察），逐个 `recordPersonaFromChat` 落库 `user_persona`，含去重合并。
- 改 `src/app/api/chat/stream/route.ts`：AI 回复完整后，与内容资产沉淀**并列异步**调用 `/api/chat/persona`（不阻塞主流程）。
- 类型：`ChatStreamEvent` 增 `persona` 事件；`ChatTurn` 增 `persona` 字段；`ChatCopy` 增 `personaCardTitle`/`personaAutoSaved`。
- 前端：`ChatPersonaCard.tsx`（与 `ChatAssetsCard` 对称，展示"AI 已记下关于你的 X"），`ChatMessage.tsx` 渲染；`zh.json`/`en.json` 补文案。

**效果**：用户开聊即被默默记住，聊完在气泡下看到"AI 已记下关于你的信息"提示卡——这是"比通用 agent 更懂你"的可见卖点，零手动、零打扰。

**下一项待办**：`goals.tags` 轻量标签（缺口3），用于资产检索与创作者维度聚合。

### 2026-08-06：goals / content_assets 多标签体系（缺口3，Done ✅）
**问题**：原 goals 只有单选 `category`（主领域），无法对目标/资产打多选自由标签，导致"创作者维度视图"无法跨目标聚合。

**改动**：
- 新增 `supabase/57_tags.sql`：`goals` 与 `content_assets` 加 `tags text[] not null default '{}'`；PG 函数 `normalize_tags` + 触发器自动去重/裁剪（≤40字、≤12个）；GIN 索引支撑数组检索。
- `lib/goalCategories.ts`：新增 `normalizeTagsInput`（逗号分隔→去重数组）。
- `goals/actions.ts`：`createGoal`/`updateGoal` 接入 `tags`。
- `lib/contentAsset.ts`：`ContentAssetInput` 与 `ContentAsset` 加 `tags`，`upsertContentAssets` 写入。
- 新增 `src/app/api/assets/tags/route.ts`：① `?tag=x` 按标签检索（goals+assets）；② 无参数返回全量标签计数——支撑"创作者维度视图"聚合。
- UI：`NewGoalForm` / `GoalDetailsCard` 编辑态加 tags 输入框（逗号分隔）；查看态 `GoalDetailsCard` 展示标签胶囊；`zh.json`/`en.json` 补 `goals.tags` 文案。

**效果**：目标/资产可打"视频号/读书/IP定位"等多标签，后端已具备跨目标聚合检索能力，下一步做"创作者维度视图"页直接消费该 API。

### 2026-08-06：创作者维度视图（消费 tags 聚合，Done ✅）
**决策**：不新建独立页面。已存在 `/brand-studio/`（视频号个人IP工作台），它本就是"创作者维度"载体，新建页会重复造轮子。正确做法：把 tags 聚合能力作为 brand-studio 的新区块。

**改动**：
- `lib/contentAsset.ts`：新增 `getCreatorDimensions()`，跨 `goals` + `content_assets` 聚合标签计数（含每维度关联的 goals/资产样例）。
- `lib/contentBrand.ts`：`getBrandStudioView` 接入 `dimensions`。
- `components/BrandStudioClient.tsx`：新增"创作者维度"区块——标签云（按总量排序、显示计数）+ 点击展开该维度下的「相关路径」与「内容资产」两张卡片（路径可跳转）。
- `brand-studio/page.tsx`：传入 `initialDimensions`。
- `zh.json`/`en.json`：补 `brandStudio.dimensionsTitle/Goals/Assets/Empty`。

**效果**：创作者打开 IP 工作台，一眼看到"视频号/读书/IP定位"各维度挂了多少目标与资产，点开即见明细——这是"比通用 agent 有结构、比 Life OS 轻"的可见落点。
4. **商业化优先于功能完备**——先能收费再迭代，避免完美主义拖延上线。
