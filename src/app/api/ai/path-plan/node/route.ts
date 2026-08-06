import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mutatePathNode, type PathNodeOp } from '@/lib/chat/persistence'

export const runtime = 'nodejs'

/**
 * 路径子结构增量编辑端点（落成后的就地增删改）。
 * 支持的 op：update / create / delete；node：pillar / milestone / key_result。
 * 详见 src/lib/chat/persistence.ts 的 PathNodeOp 联合类型。
 */
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const input = body as PathNodeOp
  if (!input || typeof input !== 'object' || !('op' in input) || !('node' in input)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // 归属校验：确保被操作的节点属于当前用户
  const ownershipOk = await verifyOwnership(supabase, user.id, input)
  if (!ownershipOk) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const result = await mutatePathNode(supabase, user.id, input)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 })

  return NextResponse.json({ ok: true, id: result.id }, { status: 200 })
}

async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: PathNodeOp,
): Promise<boolean> {
  // create 类：直接校验 goalId 归属
  if (input.op === 'create') {
    const goalId = 'goalId' in input ? input.goalId : 'milestoneId' in input ? undefined : undefined
    if ('goalId' in input) {
      const { data } = await supabase
        .from('goals')
        .select('id')
        .eq('id', input.goalId)
        .eq('user_id', userId)
        .maybeSingle()
      return !!data
    }
    if ('milestoneId' in input) {
      const { data: ms } = await supabase
        .from('path_milestones')
        .select('goal_id')
        .eq('id', input.milestoneId)
        .maybeSingle()
      if (!ms) return false
      const { data: goal } = await supabase
        .from('goals')
        .select('id')
        .eq('id', ms.goal_id)
        .eq('user_id', userId)
        .maybeSingle()
      return !!goal
    }
    return false
  }

  // update / delete 类：校验节点归属
  if (input.node === 'pillar' || input.node === 'milestone') {
    const table = input.node === 'pillar' ? 'path_pillars' : 'path_milestones'
    const { data } = await supabase
      .from(table)
      .select('goal_id')
      .eq('id', input.id)
      .maybeSingle()
    if (!data) return false
    const { data: goal } = await supabase
      .from('goals')
      .select('id')
      .eq('id', data.goal_id)
      .eq('user_id', userId)
      .maybeSingle()
    return !!goal
  }

  // key_result
  const { data: kr } = await supabase
    .from('path_key_results')
    .select('milestone_id')
    .eq('id', input.id)
    .maybeSingle()
  if (!kr) return false
  const { data: ms } = await supabase
    .from('path_milestones')
    .select('goal_id')
    .eq('id', kr.milestone_id)
    .maybeSingle()
  if (!ms) return false
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', ms.goal_id)
    .eq('user_id', userId)
    .maybeSingle()
  return !!goal
}
