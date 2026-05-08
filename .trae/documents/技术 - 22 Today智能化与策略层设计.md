# 技术 - 22 Today智能化与策略层设计

## 1. 目标

在现有 `Coach Orchestrator + Context Builder + Analytics` 基础上，补齐真正的策略层与质量门，让 Today / Rescue / Review 从“有上下文的生成”升级为“有决策、可解释、可降级的 AI 教练”。

本阶段重点：

- 强化 `Today Plan` grounding，避免建议漂移和抽象化
- 新增 `strategy.ts`，把场景策略与个性化判断显式化
- 为 `Today / Rescue / Review` 增加质量标签与 fallback 规则
- 将 `growth profile / behavior snapshots / frictions / recent AI outcomes` 真正纳入策略决策与持久化

## 2. 当前问题

当前仓库已经有：

- `buildCoachContext()`
- `planToday / planRescue / planReview / planWeeklyInsight`
- `user_growth_profiles / user_behavior_daily_snapshots / user_friction_events`

但仍存在 4 个问题：

1. **上下文可读但未决策**
   - 目前大部分上下文只是传给模型，没有形成明确策略判断。

2. **Today grounding 不够强**
   - 虽然 prompt 已限制抽象词，但仍缺少“为什么选这个 goal / 为什么选这个粒度”的结构化约束。

3. **质量标签没有落库**
   - recommendation 能记录 `fallback_used`，但还不能记录质量门判断。

4. **fallback 触发过晚**
   - 目前主要依赖 parse 失败或调用异常，缺少“内容虽合法但不可执行”的质量级 fallback。

## 3. 设计原则

- **策略先于生成**：先决定难度、目标、护栏，再生成文案
- **质量优先于可解析**：合法 JSON 但不可执行，也应降级
- **个性化必须可解释**：每次 recommendation 都要能回答“为什么这样选”
- **先规则化，后复杂化**：先用可解释规则组合，不引入更复杂 Agent 体系

## 4. 模块设计

### 4.1 strategy.ts

新增：

- `buildTodayStrategy(context, goals)`
- `buildRescueStrategy(context, reasonTag, action)`
- `buildReviewStrategy(context, score, answers)`

输出统一结构：

- `strategyVersion`
- `promptVersion`
- `selectedGoalId`
- `difficultyMode`
- `riskLevel`
- `groundingHints`
- `fallbackPolicy`

### 4.2 质量标签

新增统一质量标签结构：

```ts
type RecommendationQuality = {
  schema_valid: boolean
  actionability_score: number
  adoption_ready: boolean
  requires_fallback: boolean
  reasons: string[]
}
```

场景规则：

- `Today`
  - 标题必须是可执行动作
  - 5/10/20 必须是同一意图的不同粒度
  - 必须锚定已知 goal
- `Rescue`
  - 5 分钟版本必须明显小于当前 action
  - `if_then.then` 必须是最小动作而不是鼓励话术
- `Review`
  - `tomorrow_card` 必须指向可执行的明日方向
  - summary/risk/if-then 不能重复空话

### 4.3 recommendation 持久化增强

在 `ai_recommendations` 新增：

- `quality_labels jsonb`
- `strategy_summary jsonb`

用于后续：

- recommendation detail 回放
- analytics 下钻解释
- 对 prompt/version 的效果分析

## 5. Today grounding 规则

### 5.1 goal 选择

Today 不再只按 priority 选 goal，而是综合：

- priority
- 截止时间
- success/stop criteria 完整度
- 当前 momentum
- 最近 friction
- growth profile 中的 `riskOfDropout / difficultyTolerance`

### 5.2 difficultyMode

- `starter`
  - 低动量 / 高掉线风险 / 最近 friction 多
- `balanced`
  - 中等动量
- `push`
  - 高动量、近期完成稳定

### 5.3 prompt grounding

把以下信息显式传给 Today prompt：

- 选中的 primary goal
- 选择该 goal 的理由
- 当前 difficultyMode
- top frictions
- user summary / preferred time bucket
- recent AI adoption/completion signal

并增加硬规则：

- reason 必须引用 strategy input，而不是抽象判断
- variant 标题必须体现具体产出物或动作对象

## 6. Rescue / Review 策略

### 6.1 Rescue

- 若 `reason=no_time / low_energy`
  - 偏 `starter`
- 若 `reason=too_hard / unclear_next`
  - 强制切分当前 action
- 若近期同类 friction 已重复出现
  - fallback 倾向增强

### 6.2 Review

- score 低且 friction 明确：强调防失败卡
- score 高但 adoption 低：强调继续保持有效节奏
- 若 answers 太空：直接规则 fallback，不勉强调用模型

## 7. 验收标准

- Today 推荐更稳定锚定真实 goal 与最近状态
- Today/Rescue/Review recommendation 均记录 strategy summary 与 quality labels
- 内容虽合法但低质量时，可以自动 fallback
- analytics/replay 能看到 strategy 与 quality 元数据
- `npm run build` 通过
