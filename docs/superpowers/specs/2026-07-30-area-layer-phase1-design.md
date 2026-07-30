# 领域层（Area）Phase 1 设计：基于现有 category 的结构化增强

> 日期：2026-07-30 ｜ 类型：单功能 Feature Spec（路线图 `2026-07-30-goal-action-structure-roadmap-design.md` 的 Phase 1 落地）
> 关联：
> - `2026-07-30-goal-action-structure-roadmap-design.md`（总路线图，本 spec 是其中 Phase 1）
> - `src/lib/goalCategories.ts`、`src/components/GoalCategorySelect.tsx`、`src/app/(authenticated)/goals/actions.ts`

## 1. 背景与关键发现（先纠偏）

路线图里写"Area 是缺失的一层"，但**代码核查后需纠偏**：`goals` 表已有 `category` 字段，且已是一套完整的轻量领域体系：

- `src/lib/goalCategories.ts`：`BUILTIN_GOAL_CATEGORY_KEYS` = `personal_brand / company_project / health / career / learning / finance / lifestyle / social / other`（**这 8 类本就是默认领域**）。
- `src/components/GoalCategorySelect.tsx`：目标创建/编辑时选领域。
- `replaceGoalCategory(from, to)`：批量把某领域下的所有目标改挂到另一领域。
- `getCategoryLabel` + i18n（`goals.category.*`）：中英文标签。
- `category` 已被 chat 上下文消费（`src/lib/chat/context.ts` / `prompt.ts` 在 AI 提示词里展示 `（领域）`），也进分享快照（`fetchGoalForShare`）。

**所以"Area 缺失"不准确**：准确说是 `category` **太轻量**——无图标、无排序、无描述、无"管理领域"的独立界面、`/goals` 也只是把领域当卡片小标签，**没有按领域分组聚合**。

## 2. 设计决策（含权衡，必须看）

> **决策：在现有 `category` 字段之上做结构化增强，不新建 `areas` 表 + `area_id` 外键。**

**为什么不复用/新建归一化 `areas` 表**：
- `category` 是纯文本字段，已被 chat 上下文、AI `phase2a` schema、分享快照、i18n、批量替换**广泛引用**。引入 `area_id` 外键 + 数据迁移会波及上述全部链路，爆炸半径大、回归风险高。
- 领域本质是"目标的归类维度"，`category` 已承担此责。缺的不是"另一张表"，而是**展示层的结构化**（分组、排序、图标、描述、管理界面）。

**采用方案**：新增一个**轻量元信息表 `area_meta`**，以 `category` 字符串为键，存放用户可定制的呈现属性（排序/图标/描述）。目标表仍用 `category` 关联，**零数据迁移、chat/AI/分享全部无感保留**。

**替代方案（记为未来可选）**：若后续确需"用户可自由重命名内置领域、删除领域并级联"，再考虑升级为 `areas` 表 + `area_id` 外键迁移。Phase 1 不做。

## 3. 范围（Phase 1）

| 项 | 内容 |
|---|---|
| 数据层 | 新增 `area_meta` 表（用户级领域呈现元信息）+ RLS |
| 默认领域 | 复用 `BUILTIN_GOAL_CATEGORY_KEYS` 作为默认领域，附默认排序与图标 |
| `/goals` 分组 | 目标按领域分组成区（section），每区可折叠；保留搜索/状态筛选 |
| 领域管理 | 轻量"领域"条 + 管理弹窗：重排顺序、设图标/描述、重命名（复用 `replaceGoalCategory`）、删除（改挂 Uncategorized） |
| 未分类 | `category` 为 `other` / `null` 的目标归入 **Uncategorized** 区，置于末尾 |
| 向后兼容 | 老目标 `category` 原值不变；`replaceGoalCategory` 等行为不变 |

**显式不做（留给后续 Phase）**：
- 不新建 `areas` 表、不加 `goals.area_id`（见 §2）。
- 不引入 Action↔Action 链接、AI 涌现回顾、周回顾（那是路线图 Phase 3/4）。
- 不改 `category` 在 chat 上下文/分享快照/AI schema 中的现有用法。

## 4. 数据层改动

### 4.1 新增迁移 `supabase/XX_area_meta.sql`
```sql
-- 领域呈现元信息：以 category 字符串为键，用户级定制
CREATE TABLE IF NOT EXISTS public.area_meta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_key text NOT NULL,          -- 对应 goals.category 的取值
    sort_order integer DEFAULT 0,         -- 领域在 /goals 的分组顺序
    icon text DEFAULT 'circle',           -- lucide 图标名
    description text,                     -- 领域说明（可选，Phase 1 可先留空）
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (user_id, category_key)
);

CREATE INDEX IF NOT EXISTS area_meta_user_id_idx ON public.area_meta(user_id);
```

### 4.2 RLS（照抄现有 `auth.uid() = user_id` 模式，单 ownership 列即可）
```sql
ALTER TABLE public.area_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own area_meta" ON public.area_meta
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own area_meta" ON public.area_meta
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own area_meta" ON public.area_meta
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own area_meta" ON public.area_meta
    FOR DELETE USING (auth.uid() = user_id);
```

### 4.3 默认领域
默认排序/图标由代码常量提供（不强制写库）：扩展 `goalCategories.ts`，给每个内置 key 配 `{ defaultOrder, defaultIcon }`。用户首次访问时若 `area_meta` 无记录，前端按默认常量渲染；用户一旦自定义（`sort_order`/`icon`/`description`），才落 `area_meta` 行。

## 5. 后端 / actions 改动

在 `src/app/(authenticated)/goals/actions.ts` 新增：
- `upsertAreaMeta(formData)`：`{ category_key, sort_order?, icon?, description? }` → `upsert` 到 `area_meta`（带 `user_id` 约束，防越权）。
- `deleteAreaMeta(categoryKey)`：删除该用户的 `area_meta` 行，并调用既有 `replaceGoalCategory({ from: categoryKey, to: 'other' })` 把该领域下目标改挂 Uncategorized（删除领域 ≠ 删除目标，呼应产品对破坏性操作的谨慎）。

**不改** `createGoal` / `updateGoal` / `replaceGoalCategory` 的 `category` 语义，保持 chat/AI/分享链路无感。

## 6. 前端 UI 改动

### 6.1 `/goals` 分组（`src/components/GoalListFilter.tsx`）
- 现有平铺网格改为**按领域分组**：先用 `category` 把 `mainGoals` 聚合成 `Map<categoryKey, Goal[]>`，再按 `area_meta.sort_order`（缺席用默认）排序输出 section。
- 每个 section：领域名 + 图标 + 目标计数 + 可折叠（`Collapsible`，沿用现有 archived 折叠样式）。
- 末尾 **Uncategorized** section：`category` 为 `other`/`null` 的目标。
- 顶部搜索 + 状态筛选**保留**，作用域改为"在分组内过滤"。

### 6.2 领域管理入口
- `/goals` 顶部新增**领域条（Areas strip）**：横向展示各领域 chip（图标 + 名 + 计数），点击滚动/展开对应 section。
- 新增 **领域管理弹窗**（`AreaManageDialog`）：
  - 列出当前用户所有出现过的 `category`（来自 `buildCategoryOptions` 的 `usedCategories`）＋ 默认内置项；
  - 拖拽/上下调整 `sort_order`；
  - 选图标（`icon`）、填描述（`description`）；
  - 重命名 → 复用 `replaceGoalCategory`；
  - 删除 → `deleteAreaMeta`（级联改挂 Uncategorized）。

### 6.3 创建/编辑目标
- 复用现有 `GoalCategorySelect` 作为"归属领域"选择器，行为不变。

## 7. 数据流

```
/goals (server)
  ├─ select goals (existing)
  └─ select area_meta where user_id = user.id   ← 新增
  ↓
GoalListFilter
  ├─ buildCategoryOptions(usedCategories)        ← 已有，复用
  ├─ 按 category 聚合 mainGoals → sections
  └─ sections 按 area_meta.sort_order / 默认排序
AreaManageDialog
  ├─ upsertAreaMeta / deleteAreaMeta             ← 新增 actions
  └─ 删除领域 → replaceGoalCategory(→ 'other')
```

## 8. 向后兼容与验收

- [ ] 老目标 `category` 原值不变；`category` 为 `other`/`null` 的目标全部进入 **Uncategorized** 区，0 丢失。
- [ ] chat 上下文（`prompt.ts` 的 `（领域）`）、AI `phase2a`、分享快照中的 `category` 行为**完全不变**（回归）。
- [ ] `/goals` 按领域分组展示；默认领域顺序 = `BUILTIN_GOAL_CATEGORY_KEYS` 次序或内置 `defaultOrder`。
- [ ] 领域管理弹窗：重排/图标/描述生效；重命名走 `replaceGoalCategory`；删除领域后其目标落入 Uncategorized，目标本身不删。
- [ ] `tsc --noEmit` 无新错误；`GoalListFilter`/`actions` lint 通过。
- [ ] 建议补测试：`tests/.../areaMeta.test.ts` 覆盖 `upsertAreaMeta` 越权防护（`user_id` 约束）、`deleteAreaMeta` 级联改挂 `other`、老数据 `null`→Uncategorized 分组。

## 9. 风险与权衡

1. **`category` 是自由文本**：自定义领域是随意字符串，`area_meta` 以字符串为键可行；重命名领域通过 `replaceGoalCategory` 级联改 `goals.category`，不会孤儿化。
2. **默认 vs 自定义冲突**：优先读 `area_meta`，缺席回退默认常量；用户任一自定义即落库，回退安全。
3. **不归一化的代价**：内置领域名（`health` 等）不可被单用户"改名显示"而不影响其他引用——但重命名走 `replaceGoalCategory` 已是全局改标签，符合现状，Phase 1 接受。
4. **爆炸半径控制**：因不改 `goals` 表结构，chat/AI/分享/批量替换全部无感，是本方案最大优势。

## 10. 关联文档

- `docs/superpowers/specs/2026-07-30-goal-action-structure-roadmap-design.md`（总路线图）
- `src/lib/goalCategories.ts`（内置领域定义，Phase 1 复用）
- `src/components/GoalCategorySelect.tsx`（领域选择器，复用）
- `src/app/(authenticated)/goals/actions.ts`（`replaceGoalCategory` / `createGoal`，保持不变 + 新增 meta actions）
