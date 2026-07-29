# ChatMessage 助手端反馈工具栏优化 Plan
（点赞/点踩切换 + 互斥隐藏 + Tooltip 位置）

> 生成时间：2026-07-29
> 模式：/plan 模式，等待审批后再执行
> 涉及页面：/chat 对话页（ChatMessage 助手端工具栏

---

## 1. 需求梳理

针对 ChatMessage.tsx 底部工具栏现有功能（目前为：复制 + 点赞 + 点踩）做三处交互优化：

1. **点赞/点踩支持取消：
   - 当用户已处于「已点赞」态时，再次点击同一按钮应取消该评分（回到未选态）；
   - 同理「已点踩」态再次点同一按钮应取消评分。
2. **互斥隐藏：
   - 选中「点赞」后，「点踩」按钮不再显示（即两个不能同时可见，但不是灰色，而不是灰色显示但是另一按钮也展示，灰色不可点）；
   - 选中「点踩」后，「点赞」按钮不再显示。
3. **Tooltip 方向调整：
   - 三个按钮（复制 / 点赞 / 点踩）在助手端 Tooltip 由原来的 side="top"（上方弹出）改为 side="bottom"（下方弹出），用户明确截图里看到的 tip 应朝下展示。

---

## 2. 现状调研结论（代码仓库调研得到的事实

### 2.1 点赞/点踩的数据流

- 点赞/点踩通过的本地态存在 `ChatTurn.feedback：{ rating, reason }（参考 [types.ts](file:///Users/ht-2502/Documents/mycode/flowspark/src/lib/chat/types.ts#L23-L38）
- `submitFeedback 定义在 [store.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/lib/chat/store.tsx#L324-L348
  - 签名：`submitFeedback(turnId, rating, reason, excerpt)
  - 核心逻辑是：本地先把 feedback 写入 `turns 映射 → { ...t, feedback: { rating, reason } }`，然后通过 `submitChatFeedback(FormData) 异步落库。
  - 注意：rating 只支持 'up' | 'down'，**尚不支持**"取消评分（无 rating 为空）。

### 2.2 服务端落库入口

- Server Action：`submitChatFeedback` 在 [/src/app/(authenticated)/chat/actions.ts]。由 store 调用。
- DB 表：`chat_feedback`（RLS：已开通，参见 `supabase/41_chat_feedback_rls.sql`，已有。

### 2.3 ChatMessage 工具栏现状

- 工具栏结构（助手端）：
- [ChatMessage.tsx](file:///Users/ht-2502/Documents/mycode/flowspark/src/components/chat/ChatMessage.tsx#L203-L267)：
  - 工具按钮 `Copy → ThumbsUp → ThumbsDown 一行，均为 `h-8 w-8 rounded-full` 三按钮；
  - `rating = turn.feedback?.rating；
  - `handleUp / handleDown 当前会无判断「再点同一按钮也会一直 submitFeedback('up') → 无法取消。
  - 三按钮 Tooltip：`TooltipContent side="top" align="start" className="text-[12px]"。

---

## 3. 变更文件与模块

### 3.1 必改文件

1. **`src/components/chat/ChatMessage.tsx`
   - 变更「取消态判断与互斥隐藏：
     - `handleUp` / `handleDown` 增加：如果当前已经等于 rating 则「取消」（调用新方法 `cancelFeedback(turnId)）；
     - 点赞后隐藏点踩，点踩后隐藏点赞；
   - Tooltip 方向 side="bottom"。

2. **`src/lib/chat/types.ts`
   - `ChatTurnFeedback` 的 rating 可选：`rating?: 'up' | 'down'`（或在 store 里允许 `feedback` 字段为 null 等价于无反馈）。

3. **`src/lib/chat/store.tsx`
   - 新增 `cancelFeedback(turnId: string)` 接口；
   - 本地逻辑：`feedback: null`（清掉 `turn.feedback`）；
   - 同时落库：调用服务端的删除（或用 `rating = 'cancel' / null / 以最小改动：**新增一条"取消反馈的动作）。

4. **`src/app/(authenticated)/chat/actions.ts`
   - 可选两种方案任选其一（详见§4.2）：
     - 要么新增一个单独 action（`cancelChatFeedback`）；
     - 要么在原来的 `submitChatFeedback 接受 null rating。

---

## 4. 详细步骤

### 4.1 步骤一：类型与 store 层新增"取消反馈"能力

1. 类型：
   - `ChatTurnFeedback.rating` 改为可选（或者 turn.feedback 本身已经可为 null 已经是可选项）。
2. `store`：
   - `ChatContextValue` 增加接口 `cancelFeedback: (turnId: string) => void`。
   - 实现：
     - 本地：`prev.map(t => t.id === turnId ? { ...t, feedback: null } : t)`；
     - 服务端：调用 Server Action 删除或 `cancelChatFeedback(fd)`，fd 里 `turnId`。

### 4.2 步骤二：Server Action 层提供取消落库的落库（二选一）

**方案 A（最小改动，建议）：** 仍然使用一条 `deleteChatFeedback(turnId)（推荐）：
- 接收 FormData: `turnId`；
- supabase: `from('chat_feedback').delete().eq('turn_id', turnId).eq('user_id', auth.uid())`；
- 返回：`{ error?: string }`。

**方案 B（兼容保留历史：** 扩展 `submitChatFeedback(rating: 'up'|'down'|null`)，当 `rating 传 ` 为 null 时 delete。
不推荐；因为目前 `FormData 只能字符串语义差、审计日志会比较脏。

### 4.3 步骤三：ChatMessage 行为

**取消/隐藏

1. `handleUp / handleDown 改动：
```ts
const handleUp = () => {
  if (rating === 'up') {
    cancelFeedback(turnId)       // 再次点击取消
  } else {
    submitFeedback(turnId, 'up', null, excerpt)
  }
}

const handleDown = () => {
  if (rating === 'down') cancelFeedback(turnId)
  else submitFeedback(turnId, 'down', null, excerpt)
}
```

2. **互斥隐藏：
- `rating === 'up'` 时不渲染 ThumbsDown（而不是 disabled）；
- `rating === 'down'` 时不渲染 ThumbsUp。

3. **Tooltip 朝下：
- 三个 TooltipContent side="top" → side="bottom"；
- `align` 保持 `align="start"` 不变；
- 复制按钮已选后复制后复制完仍展示 `copy.copiedMessage`。

### 4.4 步骤四：ChatConversation 传参透传

- `ChatConversation` → `ChatMessage` 需要透传 `cancelFeedback` prop，一路从 `useChat` 里拿到 `cancelFeedback` → ChatSurface → ChatConversation → ChatMessage。

---

## 5. 依赖与注意事项

1. **不要**：类型向后兼容；所有引用 `ChatTurnFeedback` 的其它地方：
- `ChatFeedback.tsx（现不依赖此方案**仅用于旧接口；不会冲突。
2. **落库权限：RLS 策略：
- 必须确保 `delete` 操作必须有 `turn_id + user_id` 唯一；避免删别人的反馈。
3. **历史数据：** 不会影响已写入已删除后再次点赞后还可以重新点不会冲突，因为 delete 后 turn_id 不会重复（delete 后再 submit 会 insert 一条新行。
4. **UI 上删除了"理由原因选择框没有保留（reason 不会受 reason 也删除整个反馈删除后同时把 reason 删除。

---

## 6. 风险处理

1. **风险：取消反馈的取消后原 turn.feedback 被清为 null**
- 处理：在 store 里本地优先（`setTurns`）优先；服务器失败不还原UI失败但同时本地**先写本地再落库失败仍返回 error 后但忽略（与原来的 submit 一致）。
2. **风险：两个用户端（TypeScript 类型：ChatContextValue 接口里新增 cancelFeedback**
- 处理：在 ChatConversation props 新增 `cancelFeedback`；编译期诊断 GetDiagnostics，所有调用链里用的调用。
3. **风险：Tooltip 方向 side="bottom" 可能在助手端最后面最后一条消息刚好在视口底部时，tip 朝下可能超出视口：
- 处理：使用 Radix Tooltip 默认会自动 collision padding；默认会自动翻转，可接受；如用户体验；**优先按用户要求朝下；

---

## 7. 验收标准

1. 点赞后，再点同一按钮 → 按钮高亮消失，另一按钮重新显示（取消点赞成功）；
2. 点踩后，再点同一按钮 → 取消点踩；
3. 点赞后 ThumbsDown 从 DOM 中隐藏；点踩后 ThumbsUp 隐藏；取消后两个按钮重新显示；
4. 三个按钮的 Tooltip 全部改为下方弹出；
5. TS 0 报错；
6. 网络失败忽略；
7. `/chat` 刷新后点赞/点踩状态无报错；
