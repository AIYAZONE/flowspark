# 聊天上下文富化设计（Chat Context Enrichment）— P0

> 日期：2026-07-29 ｜ 关联规划：`.trae/documents/产品 - 23 产品诊断与方向规划.md`（P0）
> 目标：把已经写好的"人生系统大脑"（Self Model / 偏好 / 连续天数 / AI 建议信号）接入 `/chat` 主界面，让聊天从"todolist 壳"变为"懂我的系统"。

## 1. 问题

`/chat` 是主入口（见 `chat-as-primary-surface-design`），但 `getChatContext` 当前只向系统提示词喂入：
- 进行中路径（目标）标题
- 今日未完成行动标题（最多 8 条）

而 `buildSelfModelCards` / `buildTodayPersonalization`、偏好记忆、连续天数、近 7 天 AI 建议信号等成熟能力，只被 `/profile` 与 `/profile/ai-insights` 消费。聊天内核看不到它们，导致"感觉只是 todolist"。

## 2. 范围（P0）

| 接入项 | 数据源 | 接入方式 |
|---|---|---|
| Self Model 画像卡片（节奏/决策/适应） | `buildSelfModelCards`（`src/lib/self-model.ts`） | 进入系统提示词【人生系统画像】段 |
| 今日系统解读卡片 | `buildTodayPersonalization`（`src/lib/self-model.ts`） | 进入系统提示词【今日系统解读】段 |
| 连续天数 / 节奏 | `getStreakSnapshot`（`src/lib/streaks.ts`） | 进入【当前系统上下文】Streak 行 |
| 长期偏好记忆 | `listSystemMemoryPreferences`（`src/lib/system-memory/preferences.ts`） | 进入【当前系统上下文】偏好行 |
| 近 7 天 AI 建议信号 | `getRecentRecommendations` + `summarizeRecommendationSignals` | 进入【当前系统上下文】信号行 |

**显式不做（留给后续阶段）**：
- `buildTodayPersonalization` 的 `hasTomorrowHandoff` 标志位：聊天上下文不计算 handoff，P0 固定为 `false`（近似安全，不影响卡片正确性）。`showStreakRiskBanner` 用 `streakSnapshot.currentStreak > 0 || recoverableMissDate` 推导。

## 8. P3 自用验收（Self-acceptance）— 已补可复现自检

> P3 在规划文档里是「别急着通用化，先自己每天用，验证 P0 之后 chat 建议是否真比 ChatGPT 贴你」。它本质是人工验收，不是代码任务。本步把验收变成**可复现**：加一道自动化闸门 + 一个 dev 诊断接口，让你随时确认"大脑已插电"。

### 8.1 改动文件

1. `tests/lib/chat/prompt.test.ts`（新增，3 用例全过）
   - `full context renders all enrichment sections`：用满数据 `ChatContext` 渲染系统提示词，断言同时含【当前系统上下文】【人生系统画像（Self Model）】【今日系统解读】三段，且 Streak / 偏好 / 信号 / 画像卡片正文全部落进文本——即"大脑已插电"的硬证据。
   - `English locale` / `degraded context`：验证英文框架、以及空数据降级仍正常渲染（不阻断聊天）。
   - 这是 P0 接线的回归护城河：任何人改 `prompt.ts` / `context.ts` 把画像或偏好弄丢，本测试会立刻红。
2. `src/app/api/chat/debug/context/route.ts`（新增，dev-only GET）
   - `GET /api/chat/debug/context?locale=zh|en`：返回当前账号实际注入聊天的系统提示词预览 + 各项来源健康度（`goals / todayActions / selfModelCards / todayPersonalization / streak / preferences / signals` 计数）。
   - `NODE_ENV === 'production'` 时直接 404，避免泄露系统提示词。

### 8.2 如何使用（自用验收流程）

1. `npm run dev` 后访问 `http://localhost:3000/api/chat/debug/context` —— 看 `sources` 是否非零、`promptPreview` 是否含你的连续天数 / 偏好 / 画像。
2. 在 `/chat` 实际聊几句，验证模型能引用你的真实背景（而非泛泛而谈）。
3. 连续对话 > 20 轮，验证旧背景仍被 `summary` 召回（见 §6）。
4. 跑 `npm test`，确认 211 用例全绿（含 §8.1 闸门）。

### 8.3 验收

- [ ] `npm test` 全绿（211 用例），`prompt.test.ts` 3 用例证明大脑已插电。
- [ ] `tsc --noEmit` 无新错误。
- [ ] dev 下 `GET /api/chat/debug/context` 返回非空来源与提示词预览；prod 下 404。
- [ ] 真人连续用几天，确认 chat 建议明显比直接开 ChatGPT 更贴自己（人工验收成立再谈下一步通用化）。

## 7. P2 落库可靠性（创建/完成闭环）— 已补端到端测试

> P2 的创建/完成闭环此前已存在：`/api/chat/action` 与 `/api/chat/complete` 负责 LLM 提取，`createActionFromChat` / `completeActionFromChat` 两个 server action 负责写库。问题在于写库逻辑耦合在 `use server` 文件里，无法在 `node --test` 中直接验证。本步把"真正写库"抽成纯函数并补测试。

### 7.1 改动文件

1. `src/lib/chat/persistence.ts`（新增）
   - `recordChatAction(supabase, userId, { title, goalHint, reason, today })`：解析目标（hint 模糊匹配前 6 字，否则落第一个进行中目标）→ 写 `actions` → 返回 `actionId`。
   - `completeChatAction(supabase, userId, actionId)`：更新 `actions` 设 `completed: true`，范围限定 `id + user_id`（防越权）。
   - 两者均与 Next 运行时解耦（不引用 `createClient` / `revalidatePath`），仅接收已认证客户端，便于单测。
2. `src/app/(authenticated)/chat/actions.ts`
   - 两个 server action 变薄：仅保留鉴权、`getUserTimezone` / `getTodayInTZ`、调用纯函数、`revalidatePath`。写库委托给 `persistence.ts`，行为不变。
3. `tests/lib/chat/persistence.test.ts`（新增，8 用例全过）
   - 用可 thenable 的 mock Supabase 客户端断言：目标解析、字段完整性（user_id/owner_id/goal_id/type='core'/priority='medium'/completed=false/日期窗口）、范围限定、空值守卫、DB 错误映射为 `operation_failed`。

### 7.2 验收

- [ ] `npm test` 全绿（210 用例），`tests/lib/chat/persistence.test.ts` 8 用例覆盖写库关键路径与错误分支。
- [ ] `tsc --noEmit` 无新错误。
- [ ] server action 行为与原实现一致（仅重构抽函数，未改写库 SQL）。

## 6. P1 扩展（历史窗口 + 客户端摘要回传）— 已落地

> 目标：让 chat 在长对话中不丢失早期背景（P0 仅 10 轮工作记忆，长对话会"忘事"）。

### 6.1 改动文件

1. `src/lib/chat/summary.ts`（新增）
   - `buildChatSummary(overflow: ChatHistoryEntry[]): string | null`：对超出窗口的旧轮次做**确定性压缩**（沿用 `system-memory/summarized.ts` 思路，但不调用 LLM）。最多摘要约 10 轮溢出内容，每条轮次截断 120 字，保证请求体积有界、行为可预测。
2. `src/lib/chat/store.tsx`
   - 新增常量 `CHAT_HISTORY_WINDOW = 20`（与 server 的 `MAX_HISTORY` 同步）。发送前将 `historyForRequest` 切分为：
     - `workingMemory` = 最近 20 轮（作为 `history` 发送）
     - `overflow` = 更早轮次 → `buildChatSummary` 压缩为 `summary`
   - 请求体新增 `summary` 字段（无溢出时为 `undefined`）。
3. `src/app/api/chat/stream/route.ts`
   - `MAX_HISTORY = 10` → `20`。
   - 解析请求体 `summary`；非空时以**系统消息**形式注入到工作记忆之前（中英文按 `locale` 切换前缀 `【历史摘要】` / `【Conversation history summary】`），明确标注"非当前提问"。

### 6.2 设计说明

- 摘要在**客户端**计算并随请求回传，服务端只做注入，无额外 LLM 往返、无服务端存储，与现有 `localStorage` 持久化结构一致。
- 摘要为确定性文本压缩（非语义摘要），优先保证"不丢关键背景"且零成本；若后续需要语义级摘要，可改为客户端调用一次轻量模型生成——但 P1 选择零依赖方案。
- 服务端仍对 `history` 做 `slice(-MAX_HISTORY)` 兜底，防止客户端常量漂移导致上下文过长。

### 6.3 验收

- [ ] 连续对话超过 20 轮后，模型仍能引用 20 轮之前的背景（由 `summary` 注入）。
- [ ] 短对话（≤20 轮）不发送 `summary`，行为与 P0 完全一致（回归）。
- [ ] `tsc --noEmit` 无新错误；`store.tsx` / `route.ts` lint 通过。

## 3. 改动文件

1. `src/lib/chat/context.ts`
   - `ChatContext` 类型新增：`selfModelCards`、`todayPersonalization`、`streak`、`preferences`、`signals`。
   - `getChatContext(supabase, userId, locale = 'zh')` 新增 `locale` 参数；新增两条 DB 取数（streak、近 7 天建议），并复用已有 preferences 取数；整体包 try/catch 降级，个性化数据缺失不阻断聊天。
2. `src/lib/chat/prompt.ts`
   - 新增 `renderSelfModelCards` 辅助；在系统提示词中新增【人生系统画像】【今日系统解读】两段，并在【当前系统上下文】增加 Streak / 偏好 / 信号三行。
3. `src/app/api/chat/stream/route.ts`
   - `getChatContext(supabase, user.id, locale)` 透传已在路由算好的 `locale`。

## 4. 数据流

```
getChatContext(supabase, userId, locale)
  ├─ getStreakSnapshot({supabase, userId, timeZone: tz, today})
  ├─ getRecentRecommendations({supabase, userId, limit: 24, days: 7})
  │     └─ summarizeRecommendationSignals(...) → signals
  ├─ listSystemMemoryPreferences({supabase, userId, locale}) → enabled titles
  ├─ buildSelfModelCards({locale, currentStreak, completedToday, signals}) → selfModelCards
  └─ buildTodayPersonalization({locale, currentStreak, nextActionTitle, showStreakRiskBanner, hasTomorrowHandoff: false, signals}) → todayPersonalization

buildChatSystemPrompt({context, locale}) → 将上述字段渲染进系统提示词
```

## 5. 验收

- [ ] 打开 `/chat`，模型回复能引用用户的连续天数、节奏画像（如"深耕期/建立节奏期"）、已启用偏好（如"回复保持短"）。
- [ ] 当 `getStreakSnapshot` 或 preferences 查询失败（异常/未配置）时，聊天仍能正常返回（降级生效，不报 context_error）。
- [ ] TypeScript 编译通过（`next build` / `tsc --noEmit` 无新错误）。
- [ ] 现有 goals / todayActions 上下文行为不变（回归）。
