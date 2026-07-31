# 执行闭环结构增强：PARA / Zettelkasten 迭代路线图设计

> 日期：2026-07-30 ｜ 类型：产品策略 + 迭代路线图（非单功能实现 spec）
> 关联文档：
> - `2026-07-29-chat-context-enrichment-design.md`（聊天上下文富化，AI 执行闭环的现状基础）
> - `2026-07-23-chat-as-primary-surface-design.md`（/chat 作为主入口）
> - `2026-05-10-ai-insights-productization-design.md`（**已被清理**的周报尝试，详见 §7 教训）

## 1. 背景与目标

FlowSpark 的定位不是"知识捕获型第二大脑"（那是 Obsidian 的事），而是 **AI 驱动的个人执行系统（execution-oriented）**。核心闭环：

```
意图 →（/chat 采纳）→ Goal / Action →（AI 排序进 /today）→ 执行 →（回顾）→ 再规划
```

本路线图借用 **PARA**（Projects / Areas / Resources / Archives）与 **Zettelkasten**（原子化 / 双向链接 / 涌现式回顾）两套个人管理方法论，给这个执行闭环补上它当前缺失的两层：

- **结构层（Area）**：让目标不再平铺，而是挂在"生活领域"之下。
- **涌现层（链接 + 回顾）**：让 AI 主动发现行动之间的关联、提示停滞，并形成周期回顾习惯。

**核心目标**：强化"执行 + 回顾"，而不是把产品变成笔记软件。

## 2. 当前结构盘点（基于代码事实）

| 维度 | 现状 | 来源 |
|---|---|---|
| 目标表 | `goals` 表已存在（`supabase/00_init_tables.sql`） | 迁移 |
| 行动表 | `actions` 表已存在，含 `goal_id`（外键）、`priority`、`type`、`start_date`、`end_date`、`completed` | 迁移 / `src/lib/today-task-list.ts` |
| 主目标概念 | 已有 primary goal / main path（`src/lib/path-context.ts`、`src/lib/chat-agent/orchestrator.ts`） | 代码 |
| AI 落地 | chat 采纳可生成 goal / action；AI 用 goals+actions 给 /today 排序、给对话提供上下文（`src/lib/chat/context.ts`、`src/lib/chat-agent/action-ranking.ts`） | 代码 |
| 每日回顾雏形 | `src/lib/tomorrow-handoff.ts` 已实现"明日交接"骨架 | 代码 |
| 删除/归档态度 | 通知删除已做样式化二次确认弹窗，体现对破坏性操作的谨慎 | `ConfirmDeleteNotificationDialog.tsx` |
| 对话存储决策 | `/chat` 对话**仅本地**（`localStorage`），不落服务端（隐私优先，已拍板不改） | `src/lib/chat/store.tsx` |

**已具备**：Goal↔Action 的单向关联（`actions.goal_id`）、原子化节点、AI 执行排序、显式归档流（`archiveAction`/`unarchiveAction`）、Area 领域层（`area_meta` 表 + 分组 UI）、Action↔Action 链接（`action_links` 表 + AI 建议采纳闭环）。

> **实施状态（2026-07-30 代码核查）**：本路线图撰写时把 Phase 1–3 列为"缺失/待做"，但代码已超前落地，特此校正——
> - ✅ **Phase 1 领域层**：`supabase/43_area_meta.sql` + `/goals` 领域分组面板 + `AreaManageDialog`。
> - ✅ **Phase 2 双向视图 + 归档流**：`goals/[id]` 详情聚合 actions + 进度；`ArchiveGoalButton` / `archiveAction` 提供归档流。
> - ✅ **Phase 3 链接 + AI 涌现**：`supabase/45_action_links.sql` + `ActionItemPanel` 双向展示 / AI 建议采纳落库闭环。
> - ✅ **Phase 4 周回顾**：`/review` 可操作周回顾页已上线（问卷 → `/api/ai/review` → 结构化 `review_items`）；`ReviewOutput` 已结构化（`archive`/`reorder`/`focus`/`complete`），`aiReview`/`planReview` 注入真实 candidates，无 AI key 时 fallback 派生可操作项；`WeeklyInsightCard` 已改造为指向 `/review` 的入口卡；废弃的 `weekly_insight` 链路（`route`/`insightStore`/`insights`/`planWeeklyInsight`）已清理。详见 Phase 4 小节。
> - ⬜ **Phase 5 Resources / 图谱**：未启动，优先级最低。

## 3. 方法论映射（PARA / Zettelkasten → FlowSpark）

| 方法论要素 | 在 FlowSpark 的对应 | 现状 | 缺口 |
|---|---|---|---|
| PARA · Projects（有终点） | **Goals** | ✓ 已具备 | — |
| PARA · Areas（无终点，需长期维护） | 领域（健康/职业/财务…） | ✗ 无 | **Phase 1 补全** |
| PARA · Resources（参考资料） | chat 采纳仅产出 goal/action | ✗ 无 | Phase 5 可选 |
| PARA · Archives（完成/放弃） | 仅 `completed` 标志 | △ 部分 | Phase 2 补"归档"语义 |
| Zettelkasten · 原子化 | 每条 goal/action 独立节点 | ✓ | — |
| Zettelkasten · 双向链接 | `goal_id` 单向；缺 goal 聚合视图与 action↔action | △ | Phase 2 + 3 |
| Zettelkasten · 涌现式回顾 | 仅有 daily（`tomorrow-handoff`） | △ | Phase 3（AI 涌现）+ Phase 4（周回顾） |

## 4. 迭代路线图（按依赖顺序）

> 依赖关键：**Area 是地基，Goal↔Action 双向视图是承重墙，AI 涌现与周回顾都建在它们之上。** 不可跳步。

### Phase 1 — Now：Area 领域层（地基）
- **做什么**：新增 `areas` 表（`user_id`, `name`, `icon`, `order`）；`goals` 加 `area_id` 外键。形成 `领域 → 目标 → 行动` 三层。
- **为什么先做**：已确认需要；且 Phase 2/3/4 全部依赖它聚合。
- **可复用**：`user_notifications` 那套 `auth.uid()` RLS 策略直接照抄，零新基础设施。
- **防负担**：不给用户一上来就填领域。提供默认领域（职业 / 健康 / 财务 / 学习 / 生活）+ "未分类"，让领域随首个 goal **自然涌现**（符合 Zettelkasten 涌现式，而非预设式）。老 goal 默认归"未分类"，向后兼容。

### Phase 2 — Now/Next：Goal↔Action 双向视图 + 归档流（承重墙）
- **做什么**：
  - Goal 详情页聚合其下所有 action + 完成进度（数据已有 `goal_id`，近乎零成本）。
  - 明确"**归档 ≠ 删除**"：放弃的 goal/action 进 Archive，保留回顾价值（呼应 §2 对删除的谨慎，也补齐 PARA 的 Archives 象限）。
- **为什么**：Zettelkasten 双向链接最便宜的一块，也是 Phase 3 AI 涌现回顾的数据基础。

### Phase 3 — Next：Action↔Action 链接 + AI 涌现回顾（Zettelkasten 核心）
- **做什么**：
  - action 间加可选"关联 / 前置"关系（`action_links` 表）。
  - 复用 `contextBuilder` / `action-ranking` / `chat-agent` 基建，让 AI 主动提示："这 N 条 action 可能属于同一件事""某 goal 已 30 天无进展""领域 X 本周零动作"。
- **为什么是精髓**：用 AI 把"链接涌现"自动化，比画图谱实用得多。
- **风险**：AI 关联质量需评估。建议先出"建议"让用户**确认采纳**，绝不自动改数据。

### Phase 4 — Later：周回顾流（建立在 1–3 之上）
- **做什么**：把 `tomorrow-handoff.ts` 的每日骨架扩展成 **weekly review**，按 PARA 过一遍 `Areas → Goals → 开放 Actions → 归档建议`。可落在 `/system` 或新 `/review`。
- **重要教训（见 §7）**：吸取仍存活的 `WeeklyInsightCard` 教训——做成**可操作**（每条直接链到 Goal/Action、可一键归档/重排），不是只读报告。

#### Phase 4 当前状态与执行计划（2026-07-30 核查）

**后端已具备但未接通**：`src/lib/ai/coachOrchestrator.ts` 的 `planReview` + `src/app/api/ai/review/route.ts` 已实现，但 `ReviewOutput`（`src/lib/ai/phase2aSchemas.ts:107`）当前**仅含 `summary_sentence` + `tomorrow_card`（明日卡），非结构化可操作**——无 `goal`/`action` 引用、无归档/重排建议，本质是"日终复盘"而非"周回顾"，且**前端零调用**。

**执行步骤**：
1. **结构化 `ReviewOutput`**：新增 `review_items[]`，每条含 `goal_id`/`action_id` 引用 + `action_kind`（`archive` | `reorder` | `focus`）+ 理由，把建议变成可点击执行的对象（沿用现有 `parseReview` 校验 + `evaluateReviewQuality`）。
2. **改造 `aiReview` 输出 + fallback**：prompt 增加结构化 items 产出；`buildFallbackReview` 同步产出可操作兜底项（基于真实 stalled goals / actions 查询）。
3. **新建 `/review` 周回顾页**（建议独立路由，而非塞进 `/system`）：问卷（score + friction）→ 调 `/api/ai/review` → 渲染结构化结果；每条 `review_item` 配「一键归档 / 重排 / 聚焦」按钮，复用现有 `archiveAction` / `updateAction`（带 RLS，零新基础设施）。
4. **收尾 `WeeklyInsightCard`**：改造为指向 `/review` 的入口卡，或在 `/review` 上线后正式移除（兑现 §7 教训）。

**风险/成本**：中。AI 结构化质量需评估（沿用 `evaluateReviewQuality` 的 fallback 机制）；所有写操作复用现有带 RLS 的 actions，不引入新基础设施。已在 `feature/ai-chat` 分支实现并提交（2026-07-31）。

### Phase 5 — Later（可选，锦上添花）
- Resources 层：chat 里"保存为参考"而非只产出 goal/action。
- 关系图谱视图（Obsidian graph 风格）——优先级最低，验证前 4 步价值后再议。

## 5. 优先级与价值矩阵

| 阶段 | 主题 | 依赖 | 价值 | 风险/成本 |
|---|---|---|---|---|
| **1** | Area 领域层 | 无 | 高 | 低（照抄 RLS） |
| **2** | 双向视图 + 归档 | 1 | 高 | 低 |
| **3** | Action 链接 + AI 涌现 | 1,2 | 高 | 中（AI 质量需评估） |
| **4** | 周回顾 | 1–3 | 中高 | 中 |
| **5** | Resources / 图谱 | 全部 | 低–中 | 高（易跑偏成笔记软件） |

## 6. 非目标（Non-goals）

- 不把 FlowSpark 变成另一个 Obsidian / 笔记软件。
- 不强迫用户预先规划完整结构（保持涌现式，给默认值即可）。
- 不引入本地文件存储；`/chat` 对话仍保持已定的"仅本地"决策。

## 7. 风险与权衡

1. **Area 分类负担**：用户可能因"先想领域"而卡住。缓解：默认领域 + "未分类"，涌现优先。
2. **AI 涌现关联质量**：错误关联会污染数据。缓解：仅出建议、用户采纳才落库；需配套评估用例。
3. **周回顾 ≠ 仍存活的 WeeklyInsightCard**：`2026-05-10-ai-insights-productization-design.md` 对应的 `WeeklyInsightCard` **实际并未在前期清理**（截至 2026-07-30 仍存活于 `dashboard/page.tsx` 且为只读形态）。那次是**被动周报**；新周回顾必须吸取教训，做成**可执行动作入口**（每条链到 Goal/Action、可一键归档/重排），而非只读洞察报告。Phase 4 上线后应将 `WeeklyInsightCard` 改造为指向 `/review` 的入口，或正式移除。

## 8. 成功指标（建议采集）

- **Phase 1**：老 goal 全部安全归"未分类"（0 破坏）；`/goals` 可按领域分组浏览；默认领域覆盖率。
- **Phase 2**：Goal 详情页 action 聚合与进度可见；归档动作数与归档后回顾留存率。
- **Phase 3**：AI 关联建议的**采纳率**；停滞 goal 提示的准确率（人工抽样）。
- **Phase 4**：周回顾使用率、单次回顾产生的归档/重排动作数。

## 9. 建议起点（2026-07-31 更新）

Phase 1–4 已全部落地并提交（见 §2 状态表）：
- Phase 4 周回顾 = `/review` 可操作页 + 结构化 `review_items` + 废弃 `weekly_insight` 链路清理（2026-07-31 提交于 `feature/ai-chat`）。

**下一步选项（按杠杆排序）**：

1. **打磨 Phase 4 价值**：让 `/review` 在全局 `Sidebar`/底部导航可见（当前仅靠 `WeeklyInsightCard` 入口）；实测 AI 结构化质量与无 key fallback 覆盖；确认 `ai_review_*` 埋点就绪以衡量 §8 指标。
2. **Phase 5（Resources / 图谱）**：可选、优先级最低，应在验证前 4 步用户价值后再议，避免跑偏成笔记软件。

> 注：原文档「当前唯一下一步是 Phase 4」（2026-07-30）已过时，因 Phase 4 现已完成。另，原文档「Phase 1 的 Area 层是唯一正确的起点」亦已过时，代码已超前实现至 Phase 3。

## 10. 关联文档

- `docs/superpowers/specs/2026-07-29-chat-context-enrichment-design.md` — AI 执行闭环的上下文基础
- `docs/superpowers/specs/2026-07-23-chat-as-primary-surface-design.md` — /chat 主入口
- `docs/superpowers/specs/2026-05-10-ai-insights-productization-design.md` — 已清理的周报尝试（Phase 4 的反面教材）
