import type { SupabaseClient } from '@supabase/supabase-js'
import { findDuplicateOpenAction } from './action-dedup.ts'
import { queryWithOwnershipFallback } from '../ownership.ts'
import type { ChatFeedbackReason } from './types.ts'
import type { PathPlanResult } from '../ai/pathPlan.ts'

export type RecordPathPlanInput = {
  goalId: string
  plan: PathPlanResult
}

export type RecordPathPlanResult = { ok?: boolean; error?: string }

/**
 * 把一条 Chat 规划师生成的路径方案落写进数据库（双向联动：chat → 路径）。
 * 写入 goals.positioning，并把 pillars / milestones / 其下 key_results 写入对应子表。
 * 落写是幂等友好的：先清空该 goal 已有的 pillars/milestones，再整体写入。
 */
export async function recordPathPlan(
  supabase: SupabaseClient,
  userId: string,
  input: RecordPathPlanInput
): Promise<RecordPathPlanResult> {
  const { goalId, plan } = input
  if (!goalId || !plan) return { error: 'missing_fields' }

  // 1. 写定位卡到 goals
  const { error: goalErr } = await supabase
    .from('goals')
    .update({
      positioning: {
        persona: plan.positioning.persona,
        oneLiner: plan.positioning.oneLiner,
        threePieces: plan.positioning.threePieces,
        audience: plan.positioning.audience,
      },
    })
    .eq('id', goalId)
    .eq('user_id', userId)

  if (goalErr) return { error: 'operation_failed' }

  // 2. 清掉旧的子结构（幂等）
  await supabase.from('path_pillars').delete().eq('goal_id', goalId)
  const { data: oldMilestones } = await supabase
    .from('path_milestones')
    .select('id')
    .eq('goal_id', goalId)
  if (oldMilestones && oldMilestones.length > 0) {
    const ids = oldMilestones.map((m) => m.id)
    await supabase.from('path_key_results').delete().in('milestone_id', ids)
    await supabase.from('path_milestones').delete().eq('goal_id', goalId)
  }

  // 3. 写策略支柱
  if (plan.pillars?.length) {
    const { error: pillarErr } = await supabase.from('path_pillars').insert(
      plan.pillars.map((p, i) => ({
        goal_id: goalId,
        title: p.title,
        rationale: p.rationale ?? null,
        sort_order: i,
      })),
    )
    if (pillarErr) return { error: 'operation_failed' }
  }

  // 4. 写里程碑 + 关键结果
  // 第一个里程碑设为 active（启动期），其余为 pending
  for (let i = 0; i < (plan.milestones ?? []).length; i++) {
    const m = plan.milestones[i]
    const isFirst = i === 0
    const { data: milestone, error: msErr } = await supabase
      .from('path_milestones')
      .insert({
        goal_id: goalId,
        title: m.title,
        target_date: m.target_date ?? null,
        sort_order: i,
        status: isFirst ? 'active' : 'pending',
        started_at: isFirst ? new Date().toISOString() : null,
      })
      .select('id')
      .single()
    if (msErr || !milestone) return { error: 'operation_failed' }

    if (m.key_results?.length) {
      const { error: krErr } = await supabase.from('path_key_results').insert(
        m.key_results.map((kr) => ({
          milestone_id: milestone.id,
          title: kr.title,
          target: kr.target ?? null,
          current: '0',
        })),
      )
      if (krErr) return { error: 'operation_failed' }
    }
  }

  return { ok: true }
}

export type PathNodeOp =
  | { op: 'update'; node: 'pillar'; id: string; title?: string; rationale?: string }
  | { op: 'create'; node: 'pillar'; goalId: string; title: string; rationale?: string }
  | { op: 'delete'; node: 'pillar'; id: string }
  | { op: 'update'; node: 'milestone'; id: string; title?: string; target_date?: string }
  | { op: 'create'; node: 'milestone'; goalId: string; title: string; target_date?: string }
  | { op: 'delete'; node: 'milestone'; id: string }
  | { op: 'update'; node: 'key_result'; id: string; title?: string; target?: string; current?: string }
  | { op: 'create'; node: 'key_result'; milestoneId: string; title: string; target?: string }
  | { op: 'delete'; node: 'key_result'; id: string }

/**
 * 路径子结构的增量编辑（落成后的就地增删改）。与 recordPathPlan 的全量覆盖不同，
 * 这里只动单个节点，避免用户改一个字段就要重新 AI 规划。
 * 调用方需先确保 goal 归属（见 mutatePathNode 的鉴权）。
 */
export async function mutatePathNode(
  supabase: SupabaseClient,
  userId: string,
  input: PathNodeOp,
): Promise<{ ok?: boolean; error?: string; id?: string }> {
  const { op, node } = input

  if (node === 'pillar') {
    if (op === 'update') {
      const { error } = await supabase
        .from('path_pillars')
        .update({ title: input.title, rationale: input.rationale })
        .eq('id', input.id)
      return error ? { error: 'operation_failed' } : { ok: true }
    }
    if (op === 'create') {
      const { data, error } = await supabase
        .from('path_pillars')
        .insert({
          goal_id: input.goalId,
          title: input.title,
          rationale: input.rationale ?? null,
          sort_order: 99,
        })
        .select('id')
        .single()
      return error || !data ? { error: 'operation_failed' } : { ok: true, id: data.id }
    }
    // delete
    const { error } = await supabase.from('path_pillars').delete().eq('id', input.id)
    return error ? { error: 'operation_failed' } : { ok: true }
  }

  if (node === 'milestone') {
    if (op === 'update') {
      const { error } = await supabase
        .from('path_milestones')
        .update({ title: input.title, target_date: input.target_date ?? null })
        .eq('id', input.id)
      return error ? { error: 'operation_failed' } : { ok: true }
    }
    if (op === 'create') {
      const { data, error } = await supabase
        .from('path_milestones')
        .insert({
          goal_id: input.goalId,
          title: input.title,
          target_date: input.target_date ?? null,
          sort_order: 99,
          status: 'pending',
          started_at: null,
        })
        .select('id')
        .single()
      return error || !data ? { error: 'operation_failed' } : { ok: true, id: data.id }
    }
    const { error } = await supabase.from('path_milestones').delete().eq('id', input.id)
    return error ? { error: 'operation_failed' } : { ok: true }
  }

  // key_result
  if (op === 'update') {
    const { error } = await supabase
      .from('path_key_results')
      .update({ title: input.title, target: input.target ?? null, current: input.current ?? '0' })
      .eq('id', input.id)
    return error ? { error: 'operation_failed' } : { ok: true }
  }
  if (op === 'create') {
    const { data, error } = await supabase
      .from('path_key_results')
      .insert({
        milestone_id: input.milestoneId,
        title: input.title,
        target: input.target ?? null,
        current: '0',
      })
      .select('id')
      .single()
    return error || !data ? { error: 'operation_failed' } : { ok: true, id: data.id }
  }
  const { error } = await supabase.from('path_key_results').delete().eq('id', input.id)
  return error ? { error: 'operation_failed' } : { ok: true }
}

/**
 * 聊天闭环的"落库"纯逻辑，从 server action 中抽出以便单测。
 * 不含 Next 运行时依赖（createClient / revalidatePath / 鉴权），只接收已认证的
 * supabase 客户端与userId，使端到端写库行为可在 node 测试中以 mock 客户端断言。
 */

export type RecordChatActionInput = {
  title: string
  goalHint: string | null
  reason: string
  today: string
}

export type RecordChatActionResult = { actionId?: string; duplicate?: boolean; error?: string }

/**
 * 将一条聊天提议的行动写入 `actions`，归属到用户某个进行中目标：
 * - 有 goalHint 时按标题前 6 字模糊匹配目标；否则落到第一个进行中目标。
 * 返回写入后的 actionId，或结构化的 error。
 */
export async function recordChatAction(
  supabase: SupabaseClient,
  userId: string,
  input: RecordChatActionInput
): Promise<RecordChatActionResult> {
  const { title, goalHint, reason, today } = input
  if (!title) return { error: 'missing_fields' }

  // 去重兜底：若该标题命中用户已有的开放行动，直接返回已存在项，不插入重复
  const dup = await findDuplicateOpenAction(supabase, userId, title)
  if (dup) return { actionId: dup.id, duplicate: true }

  const { data: goalsData } = await supabase
    .from('goals')
    .select('id,title,status')
    .eq('user_id', userId)
    .eq('status', 'active')

  const goals = (goalsData ?? []).filter((g) => g.status === 'active')
  if (goals.length === 0) return { error: 'no_active_goal' }

  let goalId = goals[0].id
  if (goalHint) {
    const lowerHint = goalHint.toLowerCase()
    const match = goals.find((g) => g.title && g.title.toLowerCase().includes(lowerHint.slice(0, 6)))
    if (match) goalId = match.id
  }

  const description = reason ? `来自系统对话：${reason}` : '来自系统对话'

  const { data: inserted, error } = await supabase
    .from('actions')
    .insert({
      user_id: userId,
      owner_id: userId,
      goal_id: goalId,
      title,
      type: 'core',
      priority: 'medium',
      description,
      start_date: today,
      end_date: today,
      completed: false
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: 'operation_failed' }

  return { actionId: inserted.id }
}

export type RecordContentIdeaInput = {
  title: string
  angle: string | null
  hook: string | null
  notes: string | null
}

export type RecordContentIdeaResult = { ideaId?: string; duplicate?: boolean; error?: string }

/**
 * 将一条聊天产出的 IP 选题写入 `content_ideas`，归属当前用户。
 * 去重兜底：标题命中用户已有（status 非 archived）选题时直接返回已存在项。
 */
export async function recordContentIdea(
  supabase: SupabaseClient,
  userId: string,
  input: RecordContentIdeaInput
): Promise<RecordContentIdeaResult> {
  const { title, angle, hook, notes } = input
  if (!title) return { error: 'missing_fields' }

  const { data: existing } = await supabase
    .from('content_ideas')
    .select('id,title,status')
    .eq('user_id', userId)
    .neq('status', 'archived')

  const dup = (existing ?? []).find(
    (i) => i.title && title && i.title.toLowerCase() === title.toLowerCase(),
  )
  if (dup) return { ideaId: dup.id, duplicate: true }

  const rawMarkdown = [hook ? `**钩子**：${hook}` : '', angle ? `**角度**：${angle}` : '', notes || '']
    .filter(Boolean)
    .join('\n\n')

  const { data: inserted, error } = await supabase
    .from('content_ideas')
    .insert({
      user_id: userId,
      title,
      angle: angle ?? null,
      hook: hook ?? null,
      notes: notes ?? null,
      raw_markdown: rawMarkdown || null,
      status: 'idea',
      source: 'chat',
    })
    .select('id')
    .single()

  if (error || !inserted) return { error: 'operation_failed' }

  return { ideaId: inserted.id }
}

export type CompleteChatActionResult = { ok?: boolean; error?: string }

/**
 * 将某条行动标记为已完成，写入范围限定为 actionId + 当前用户（防越权）。
 */
export async function completeChatAction(
  supabase: SupabaseClient,
  userId: string,
  actionId: string
): Promise<CompleteChatActionResult> {
  if (!actionId) return { error: 'missing_fields' }

  const { error } = await supabase
    .from('actions')
    .update({ completed: true })
    .eq('id', actionId)
    .eq('user_id', userId)

  if (error) return { error: 'operation_failed' }

  return { ok: true }
}

export type RecordChatFeedbackInput = {
  turnId: string
  rating: 'up' | 'down'
  reason: ChatFeedbackReason | null
  reasonText?: string | null
  excerpt: string | null
}

export type RecordChatFeedbackResult = { ok?: boolean; error?: string }

/**
 * 把一条用户对助手回答的反馈写入 `chat_feedback`。
 * 以 (user_id, turn_id) 唯一约束做 upsert：用户切换赞/踩或改原因时覆盖旧行，不产生重复。
 * excerpt 仅存前 280 字，供后续分析，避免大字段。
 */
export async function recordChatFeedback(
  supabase: SupabaseClient,
  userId: string,
  input: RecordChatFeedbackInput
): Promise<RecordChatFeedbackResult> {
  const { turnId, rating, reason, reasonText, excerpt } = input
  if (!turnId || (rating !== 'up' && rating !== 'down')) return { error: 'missing_fields' }

  const { error } = await supabase
    .from('chat_feedback')
    .upsert(
      {
        user_id: userId,
        turn_id: turnId,
        rating,
        reason: reason ?? null,
        reason_text: reasonText ? reasonText.slice(0, 500) : null,
        excerpt: excerpt ? excerpt.slice(0, 280) : null
      },
      { onConflict: 'user_id,turn_id' }
    )

  if (error) return { error: 'operation_failed' }

  return { ok: true }
}
