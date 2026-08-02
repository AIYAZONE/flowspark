import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type MilestoneStatusAction = 'complete' | 'activate'

/**
 * POST /api/ai/milestone-status
 * Body: { milestoneId, action: 'complete' | 'activate' }
 *
 * - complete: 将指定里程碑标为已完成，同时将下一个 pending 里程碑激活
 * - activate: 将指定里程碑激活（同时将其他 active 的标为 pending）
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { milestoneId?: string; action?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { milestoneId, action } = body
  if (!milestoneId || !action) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  if (action !== 'complete' && action !== 'activate') {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
  }

  // 获取里程碑，确认属于当前用户
  const { data: milestone } = await supabase
    .from('path_milestones')
    .select('id,goal_id,status,sort_order')
    .eq('id', milestoneId)
    .single()

  if (!milestone) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // 权限检查：里程碑所属 goal 必须属于当前用户
  const { data: goal } = await supabase
    .from('goals')
    .select('id,user_id')
    .eq('id', milestone.goal_id)
    .single()

  if (!goal || goal.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()

  if (action === 'complete') {
    // 标记完成
    const { error: updateErr } = await supabase
      .from('path_milestones')
      .update({ status: 'completed', completed_at: now })
      .eq('id', milestoneId)

    if (updateErr) {
      return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
    }

    // 激活下一个 pending 里程碑
    const { data: next } = await supabase
      .from('path_milestones')
      .select('id')
      .eq('goal_id', milestone.goal_id)
      .eq('status', 'pending')
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next) {
      await supabase
        .from('path_milestones')
        .update({ status: 'active', started_at: now })
        .eq('id', next.id)
    }

    return NextResponse.json({ ok: true, nextMilestoneId: next?.id || null })
  }

  // action === 'activate'
  // 将该 goal 下当前 active 的里程碑回退为 pending
  await supabase
    .from('path_milestones')
    .update({ status: 'pending', started_at: null })
    .eq('goal_id', milestone.goal_id)
    .eq('status', 'active')

  // 激活目标里程碑
  const { error: activateErr } = await supabase
    .from('path_milestones')
    .update({ status: 'active', started_at: now })
    .eq('id', milestoneId)

  if (activateErr) {
    return NextResponse.json({ error: 'operation_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
