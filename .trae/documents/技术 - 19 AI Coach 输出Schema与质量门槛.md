# 技术 - AI Coach 输出 Schema 与质量门槛（Phase 2A）

## 背景
- Phase 2A 的核心不是“能生成”，而是“不会显得随意”。因此必须把 AI 输出约束为可校验的结构，并在信息不足时拒绝进入拆解阶段。

## 约束
- **不破坏现有流程**：不用 AI 也能创建 goal/action。
- **不新增 DB 表（两周 MVP）**：优先复用 `goals.success_criteria` / `goals.stop_criteria`（text）与 `actions.description`（text）承载结构化内容（用可读格式）。
- **输出必须可落库**：所有字段都能映射到现有字段或可忽略字段；不可输出“只能看不能用”的内容。

## 方案
本文件定义三类 Schema：
1) Goal Setup AI：StepA（理解+澄清）与 StepB（草案输出）\n
2) Daily Coach AI：Plan / Rescue / Review 输出\n
3) 通用质量门槛：硬规则 + 失败策略\n

---

## 1. 统一基础类型（Type Primitives）

### 1.1 日期/时间
- `ISODate`：`YYYY-MM-DD`（用户时区）
- `Minutes`：整数，范围 `[1, 180]`，但行动类输出在 MVP 强制 `[5, 20]`

### 1.2 枚举
- `GoalPriority`：`low | medium | high`
- `ActionType`：`core | maintenance | learning | review | rest`
- `SuccessCriterionType`：`outcome | process`
- `StopCriterionType`：`resource | direction`
- `QuestionType`：`single_choice | short_text`

---

## 2. Goal Setup AI

### 2.1 输入：GoalBrief（由产品表单汇总）
说明：GoalBrief 是模型“应该被喂到的上下文”，不是用户额外要填写的字段。

```json
{
  "title": "string",
  "description": "string | null",
  "start_date": "ISODate | null",
  "end_date": "ISODate | null",
  "priority": "GoalPriority | null",
  "category": "string | null",
  "success_criteria": "string | null",
  "stop_criteria": "string | null",
  "user_context": {
    "time_budget_bucket": "5-10 | 10-20 | 20-45 | 45+ | unknown",
    "constraints": ["string"],
    "likely_frictions": ["string"],
    "preference": "string | null"
  }
}
```

### 2.2 Step A 输出：理解摘要 + 澄清问题
```json
{
  "type": "goal_setup_stepA",
  "understanding": {
    "goal_summary": "string",
    "key_constraints": ["string"],
    "likely_failure_reasons": ["string"],
    "leverage_point": "string"
  },
  "clarifying_questions": [
    {
      "id": "q1",
      "question": "string",
      "type": "single_choice",
      "options": ["string"],
      "required": true
    }
  ],
  "need_more_info": {
    "blocking": false,
    "missing": ["string"],
    "message": "string"
  }
}
```

#### Step A 质量门槛
- `understanding.goal_summary` 必须可读、具体，不得是“提升/优化/更好”等空泛词堆叠。
- `clarifying_questions.length`：
  - 默认 2–3 个
  - 允许 0 个（仅当 `need_more_info.blocking=true`）
- `need_more_info.blocking=true` 的触发条件（任一满足即触发）：
  - 缺少目标结束时间且目标是期限型（如考试/发布/报名等）且无法从描述推断
  - `success_criteria` 为空且描述无法推导“可验收结果”
  - 用户可用时间档为 unknown 且行动需要日常投入（习惯/训练/学习）

### 2.3 Step B 输出：行动/标准/If-Then 草案
```json
{
  "type": "goal_setup_stepB",
  "actions": [
    {
      "title": "string",
      "why": "string",
      "definition_of_done": "string",
      "estimated_minutes": 10,
      "action_type": "ActionType",
      "priority": "low | medium | high | null"
    }
  ],
  "success_criteria": [
    { "type": "outcome", "text": "string" },
    { "type": "process", "text": "string" }
  ],
  "stop_criteria": [
    { "type": "resource", "text": "string" },
    { "type": "direction", "text": "string" }
  ],
  "if_then_plans": [
    {
      "if": "string",
      "then": "string",
      "minimal_action_minutes": 5
    }
  ]
}
```

#### Step B 质量门槛（硬规则）
- `actions.length`：`[6, 10]`（信息不足可降级到 `[3, 5]`，但必须标记为低确信度并在 UI 提示）
- 每个 `actions[i]`：
  - `estimated_minutes` 必须在 `[5, 20]`
  - `title` 必须动词开头且包含对象（例如“写 3 条用户痛点”而不是“学习更多”）
  - `definition_of_done` 必须可验证（可计数/可交付/可复现），禁止“感觉更好/更自信”类
- `success_criteria.length >= 2` 且必须同时包含 `outcome` 与 `process`
- `stop_criteria.length >= 2` 且必须同时包含 `resource` 与 `direction`
- `if_then_plans.length`：`[1, 2]`（若 `likely_failure_reasons` 为空允许 0，但推荐至少 1）

#### 落库映射（两周 MVP）
- Goals：
  - `goals.success_criteria`：用 markdown bullet 存储（每行一条）：`- 结果型：...` / `- 过程型：...`
  - `goals.stop_criteria`：同上：`- 资源：...` / `- 方向：...`
- Actions：
  - `actions.title` ← `actions[i].title`
  - `actions.type` ← `actions[i].action_type`（默认 core/maintenance 等）
  - `actions.description` ← 拼装可读块：
    - `Why: ...`
    - `DoD: ...`
    - `If-Then: 如果... 那么...`（可选）

---

## 3. Daily Coach AI

### 3.1 Today Plan 输出（核心行动 + 备选 + 三档难度）
```json
{
  "type": "today_plan",
  "recommendations": [
    {
      "kind": "core",
      "goal_id": "string | null",
      "reason": "string",
      "variants": [
        {
          "minutes": 5,
          "title": "string",
          "first_step": "string",
          "definition_of_done": "string"
        },
        {
          "minutes": 10,
          "title": "string",
          "first_step": "string",
          "definition_of_done": "string"
        },
        {
          "minutes": 20,
          "title": "string",
          "first_step": "string",
          "definition_of_done": "string"
        }
      ]
    }
  ]
}
```

质量门槛：
- `recommendations[0].variants` 必须包含 5/10/20 三档（除非用户明确只剩 5 分钟）
- 每个变体：
  - `title` 可执行（动词+对象）
  - `first_step` 必须是 1 句话且不超过 30 字（降低启动摩擦）

### 3.2 Rescue 输出（最小版本 + If-Then + 开始脚本）
```json
{
  "type": "rescue",
  "reason_tag": "no_time | too_hard | anxiety | unclear_next | low_energy | other",
  "minimal_variant": {
    "minutes": 5,
    "title": "string",
    "first_step": "string",
    "definition_of_done": "string"
  },
  "if_then": {
    "if": "string",
    "then": "string"
  }
}
```

质量门槛：
- `minimal_variant.minutes` 固定为 5
- `then` 必须可在 5–10 分钟内完成

### 3.3 Review 输出（总结 + 明日防翻车卡）
```json
{
  "type": "review",
  "summary_sentence": "string",
  "detected_friction_tag": "string | null",
  "tomorrow_card": {
    "risk": "string",
    "if_then": { "if": "string", "then": "string" },
    "suggested_core_action_direction": "string"
  }
}
```

质量门槛：
- `summary_sentence` 不超过 30 字，避免长篇报告
- `tomorrow_card.if_then.then` 必须是“最小行动”，避免把压力推给用户

---

## 4. 通用失败策略（Fallback Policy）

### 4.1 输出校验失败
- 规则：若输出不满足硬规则（例如 action 分钟数超标/标题不可执行/缺少 outcome+process 等），必须触发“自检重写”最多 1 次。
- 仍失败：返回 `need_more_info.blocking=true`，并给出 2–3 个最小补充项。

### 4.2 无法从上下文判断
- 允许输出“低确信度草案”，但必须在结构里加 `confidence: low`（或在 UI 层显式标识），避免用户误信。

### 4.3 敏感目标与安全边界（MVP 最小原则）
- 对健康/法律/财务等高风险领域：只输出通用行动（例如“咨询专业人士”“记录现状数据”），不输出诊疗/法律建议。

